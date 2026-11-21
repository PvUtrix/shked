import crypto from 'crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { isoWeekday, zonedTimeToUtc } from '@/lib/schedule/time'
import type { Course, ParsedDeadline, ParsedPlacement, ParsedTimetable, TimetableEvent } from './parse'

/**
 * Writes a parsed timetable workbook into the database, as a diff:
 * - schedule entries and deadlines carry a stable externalKey, so a
 *   re-import updates them in place, adds new ones and deactivates the ones
 *   that disappeared from the sheet (nothing is deleted);
 * - every change after the first import of a semester is logged as an
 *   Announcement with the sheet as its source;
 * - subjects and subgroups are created as the legend describes them;
 * - the placement sheet sets each matched student's subgroup per course.
 * With dryRun nothing is written and the summary says what would change.
 */

export interface ApplyInput {
  groupId: string
  semester: { number: number; title: string }
  sourceRef: string
  timetable: ParsedTimetable
  deadlines?: ParsedDeadline[]
  placements?: ParsedPlacement[]
  dryRun: boolean
  importedById?: string
}

export interface Change {
  kind: 'SCHEDULE_ADDED' | 'SCHEDULE_CHANGED' | 'SCHEDULE_REMOVED' | 'DEADLINE_ADDED' | 'DEADLINE_CHANGED' | 'DEADLINE_REMOVED'
  title: string
  subject: string
  subgroup?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
}

export interface ImportSummary {
  dryRun: boolean
  semesterId: string | null
  firstImport: boolean
  subjects: { created: string[] }
  subgroups: { created: string[] }
  schedules: { added: number; changed: number; removed: number; unchanged: number }
  deadlines: { added: number; changed: number; removed: number; unchanged: number }
  placements: { students: number; matched: number; unmatched: string[]; membershipsChanged: number }
  changes: Change[]
  warnings: string[]
  importId?: string
  /** Classes added or changed by this import (not on a first import), for notifications. */
  notifyScheduleIds: string[]
}

const NOON = 12 // store a class's date at noon in the app zone: the same calendar day everywhere

function sha(s: string) {
  return crypto.createHash('sha1').update(s).digest('hex').slice(0, 20)
}

function normaliseName(s: string) {
  return s
    .toLowerCase()
    .replace(/\u0451/g, '\u0435') // yo -> ye
    .replace(/[^\p{L}\s-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Identity of an event title: case, spacing and punctuation do not matter, numbers do. */
function titleKey(s: string) {
  return s
    .toLowerCase()
    .replace(/\u0451/g, '\u0435')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function ymd(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return { y, m, d }
}

/** Where a deadline's first link says to submit. */
export function submissionChannelOf(url: string | undefined): string | null {
  if (!url) return null
  const host = (() => {
    try {
      return new URL(url).hostname
    } catch {
      return ''
    }
  })()
  if (/forms\.gle$|docs\.google\.com$/.test(host) && /forms|forms\.gle/.test(url)) return 'FORM'
  if (/drive\.google\.com$/.test(host)) return 'DRIVE'
  if (/disk\.yandex|disk\.360\.yandex|yadi\.sk/.test(host)) return 'YANDEX_DISK'
  if (/telemost|t\.me$|telegram/.test(host)) return 'CHAT'
  return 'OTHER'
}

type Tx = Prisma.TransactionClient

export async function applyTimetable(input: ApplyInput): Promise<ImportSummary> {
  const summary: ImportSummary = {
    dryRun: input.dryRun,
    semesterId: null,
    firstImport: true,
    subjects: { created: [] },
    subgroups: { created: [] },
    schedules: { added: 0, changed: 0, removed: 0, unchanged: 0 },
    deadlines: { added: 0, changed: 0, removed: 0, unchanged: 0 },
    placements: { students: 0, matched: 0, unmatched: [], membershipsChanged: 0 },
    changes: [],
    warnings: [...input.timetable.warnings],
    notifyScheduleIds: [],
  }

  const run = async (tx: Tx) => {
    const now = new Date()

    // Semester ---------------------------------------------------------------
    let semester = await tx.semester.findUnique({
      where: { groupId_number: { groupId: input.groupId, number: input.semester.number } },
    })
    if (!semester && !input.dryRun) {
      semester = await tx.semester.create({
        data: { groupId: input.groupId, number: input.semester.number, title: input.semester.title },
      })
    } else if (semester && !input.dryRun && semester.title !== input.semester.title) {
      semester = await tx.semester.update({ where: { id: semester.id }, data: { title: input.semester.title } })
    }
    const semesterKey = semester?.id ?? `new-${input.groupId}-${input.semester.number}`
    summary.semesterId = semester?.id ?? null
    const prior = semester
      ? await tx.schedule.count({ where: { externalKey: { startsWith: `tt:${semester.id}:` } } })
      : 0
    summary.firstImport = prior === 0

    // Subjects and subgroups ---------------------------------------------------
    const allCourses: Course[] = [...input.timetable.courses, ...(input.timetable.generalCourse ? [input.timetable.generalCourse] : [])]
    const subjectId = new Map<Course, string>()
    for (const course of allCourses) {
      const existing = await tx.subject.findUnique({ where: { name: course.name } })
      if (existing) {
        subjectId.set(course, existing.id)
        continue
      }
      summary.subjects.created.push(course.name)
      if (input.dryRun) {
        subjectId.set(course, `new-subject-${course.index}`)
        continue
      }
      const instructor = course.kind === 'whole' ? course.bands[0]?.instructor : undefined
      const created = await tx.subject.create({ data: { name: course.name, instructor } })
      subjectId.set(course, created.id)
    }

    // key: course + band number (elective enrolment is number 1)
    const subgroupId = new Map<string, string>()
    const sgKey = (course: Course, number: number | null) => `${course.index}:${number ?? 1}`
    for (const course of allCourses) {
      if (course.kind !== 'split' && course.kind !== 'elective') continue
      const sid = subjectId.get(course)!
      for (const band of course.bands) {
        const number = band.number ?? 1
        const name = course.kind === 'elective' ? course.name : band.label || `${number}`
        const existing = sid.startsWith('new-')
          ? null
          : await tx.subgroup.findUnique({ where: { groupId_subjectId_number: { groupId: input.groupId, subjectId: sid, number } } })
        if (existing) {
          subgroupId.set(sgKey(course, band.number), existing.id)
          if (!input.dryRun && band.instructor && existing.instructor !== band.instructor) {
            await tx.subgroup.update({ where: { id: existing.id }, data: { instructor: band.instructor } })
          }
          continue
        }
        summary.subgroups.created.push(`${course.name}: ${name}`)
        if (input.dryRun) {
          subgroupId.set(sgKey(course, band.number), `new-subgroup-${course.index}-${number}`)
          continue
        }
        const created = await tx.subgroup.create({
          data: { groupId: input.groupId, subjectId: sid, number, name, instructor: band.instructor },
        })
        subgroupId.set(sgKey(course, band.number), created.id)
      }
    }

    // Schedule -----------------------------------------------------------------
    const occurrences = new Map<string, number>()
    const sortedEvents = [...input.timetable.events].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start) || a.row - b.row)
    const desired = new Map<string, { event: TimetableEvent; data: Prisma.ScheduleUncheckedCreateInput }>()
    for (const event of sortedEvents) {
      const bandPart = event.band ? `${event.band.number ?? 'enrol'}` : 'all'
      const base = `${event.course.name}|${bandPart}|${titleKey(event.title)}`
      const occ = (occurrences.get(base) ?? 0) + 1
      occurrences.set(base, occ)
      const key = `tt:${semesterKey}:${sha(`${base}|${occ}`)}`
      const { y, m, d } = ymd(event.date)
      const date = zonedTimeToUtc(y, m, d, NOON, 0)
      desired.set(key, {
        event,
        data: {
          subjectId: subjectId.get(event.course)!,
          groupId: input.groupId,
          subgroupId: event.band ? subgroupId.get(sgKey(event.course, event.band.number)) ?? null : null,
          date,
          dayOfWeek: isoWeekday(date),
          startTime: event.start,
          endTime: event.end,
          description: event.title,
          meetingUrl: event.meetingUrl ?? null,
          semesterId: semester?.id ?? null,
          externalKey: key,
          sourceType: 'SHEET_IMPORT',
          sourceRef: `${input.sourceRef}#row=${event.row}`,
          sourceAt: now,
          isActive: true,
        },
      })
    }

    const existingSchedules = semester
      ? await tx.schedule.findMany({ where: { externalKey: { startsWith: `tt:${semester.id}:` } }, include: { subject: true, subgroup: true } })
      : []
    const existingByKey = new Map(existingSchedules.map((s) => [s.externalKey!, s]))
    const comparable = (s: { date: Date; startTime: string; endTime: string; meetingUrl: string | null; subgroupId: string | null; isActive: boolean; description: string | null }) => ({
      date: s.date.toISOString().slice(0, 10),
      startTime: s.startTime,
      endTime: s.endTime,
      meetingUrl: s.meetingUrl,
      subgroupId: s.subgroupId,
      active: s.isActive,
    })

    const scheduleChanges: Array<{ change: Change; scheduleKey: string }> = []
    for (const [key, { event, data }] of desired) {
      const old = existingByKey.get(key)
      const subgroupName = event.band ? event.band.label || event.course.name : undefined
      if (!old) {
        summary.schedules.added++
        scheduleChanges.push({
          scheduleKey: key,
          change: { kind: 'SCHEDULE_ADDED', title: event.title, subject: event.course.name, subgroup: subgroupName, after: { date: event.date, start: event.start, end: event.end } },
        })
        if (!input.dryRun) await tx.schedule.create({ data })
        continue
      }
      const before = comparable(old)
      const after = comparable({ ...old, ...data, date: data.date as Date, meetingUrl: data.meetingUrl ?? null, subgroupId: data.subgroupId ?? null, isActive: true, description: data.description ?? null })
      if (JSON.stringify(before) === JSON.stringify(after) && old.description === data.description) {
        summary.schedules.unchanged++
        if (!input.dryRun) await tx.schedule.update({ where: { id: old.id }, data: { sourceAt: now, sourceRef: data.sourceRef } })
        continue
      }
      summary.schedules.changed++
      scheduleChanges.push({
        scheduleKey: key,
        change: {
          kind: old.isActive ? 'SCHEDULE_CHANGED' : 'SCHEDULE_ADDED',
          title: event.title,
          subject: event.course.name,
          subgroup: subgroupName,
          before: { date: before.date, start: before.startTime, end: before.endTime },
          after: { date: after.date, start: after.startTime, end: after.endTime },
        },
      })
      if (!input.dryRun) await tx.schedule.update({ where: { id: old.id }, data })
    }
    for (const old of existingSchedules) {
      if (desired.has(old.externalKey!) || !old.isActive) continue
      summary.schedules.removed++
      scheduleChanges.push({
        scheduleKey: old.externalKey!,
        change: {
          kind: 'SCHEDULE_REMOVED',
          title: old.description ?? old.subject.name,
          subject: old.subject.name,
          subgroup: old.subgroup?.name,
          before: { date: old.date.toISOString().slice(0, 10), start: old.startTime, end: old.endTime },
        },
      })
      if (!input.dryRun) await tx.schedule.update({ where: { id: old.id }, data: { isActive: false, sourceAt: now } })
    }

    // Deadlines ------------------------------------------------------------------
    const deadlineChanges: Array<{ change: Change; deadlineKey: string }> = []
    if (input.deadlines) {
      const occ = new Map<string, number>()
      const desiredDl = new Map<string, { d: ParsedDeadline; data: Prisma.DeadlineUncheckedCreateInput }>()
      for (const d of input.deadlines) {
        const course = d.course
        const base = `${course?.name ?? d.courseLabel}|${d.number ?? ''}`
        const n = (occ.get(base) ?? 0) + 1
        occ.set(base, n)
        const key = `dl:${semesterKey}:${sha(`${base}|${n}`)}`
        const { y, m, dd } = (() => {
          const p = ymd(d.date)
          return { y: p.y, m: p.m, dd: p.d }
        })()
        const firstLine = d.text.split('\n')[0].trim()
        desiredDl.set(key, {
          d,
          data: {
            groupId: input.groupId,
            semesterId: semester?.id ?? null,
            subjectId: course ? subjectId.get(course) ?? null : null,
            subgroupId: course?.kind === 'elective' ? subgroupId.get(sgKey(course, null)) ?? null : null,
            kind: d.number != null ? 'HOMEWORK' : 'OTHER',
            number: d.number,
            title: (firstLine || d.courseLabel).slice(0, 200),
            details: d.text || null,
            dueAt: zonedTimeToUtc(y, m, dd, 23, 59),
            allDay: true,
            submissionChannel: submissionChannelOf(d.links[0]),
            submissionTarget: d.links[0] ?? null,
            links: d.links.map((url) => ({ url })),
            externalKey: key,
            sourceType: 'SHEET_IMPORT',
            sourceRef: `${input.sourceRef}#deadline-row=${d.row}`,
            sourceAt: now,
            isActive: true,
          },
        })
      }
      const existingDl = semester ? await tx.deadline.findMany({ where: { externalKey: { startsWith: `dl:${semester.id}:` } }, include: { subject: true } }) : []
      const oldByKey = new Map(existingDl.map((x) => [x.externalKey!, x]))
      for (const [key, { d, data }] of desiredDl) {
        const old = oldByKey.get(key)
        const subjectName = d.course?.name ?? d.courseLabel
        if (!old) {
          summary.deadlines.added++
          deadlineChanges.push({ deadlineKey: key, change: { kind: 'DEADLINE_ADDED', title: data.title, subject: subjectName, after: { due: d.date } } })
          if (!input.dryRun) await tx.deadline.create({ data })
          continue
        }
        const same = old.isActive && old.dueAt.getTime() === (data.dueAt as Date).getTime() && old.title === data.title && old.details === data.details
        if (same) {
          summary.deadlines.unchanged++
          continue
        }
        summary.deadlines.changed++
        deadlineChanges.push({
          deadlineKey: key,
          change: {
            kind: 'DEADLINE_CHANGED',
            title: data.title,
            subject: subjectName,
            before: { due: old.dueAt.toISOString(), title: old.title },
            after: { due: d.date, title: data.title },
          },
        })
        if (!input.dryRun) await tx.deadline.update({ where: { id: old.id }, data })
      }
      for (const old of existingDl) {
        if (desiredDl.has(old.externalKey!) || !old.isActive) continue
        summary.deadlines.removed++
        deadlineChanges.push({ deadlineKey: old.externalKey!, change: { kind: 'DEADLINE_REMOVED', title: old.title, subject: old.subject?.name ?? '' } })
        if (!input.dryRun) await tx.deadline.update({ where: { id: old.id }, data: { isActive: false, sourceAt: now } })
      }
    }

    // Placement ------------------------------------------------------------------
    if (input.placements) {
      const students = await tx.user.findMany({
        where: { groupId: input.groupId, role: 'student' },
        select: { id: true, name: true, firstName: true, lastName: true, middleName: true },
      })
      const byName = new Map<string, string>()
      for (const s of students) {
        const variants = [
          [s.lastName, s.firstName, s.middleName],
          [s.lastName, s.firstName],
          [s.firstName, s.lastName],
          [s.name],
        ]
        for (const v of variants) {
          const key = normaliseName(v.filter(Boolean).join(' '))
          if (key && !byName.has(key)) byName.set(key, s.id)
        }
      }
      summary.placements.students = input.placements.length
      for (const p of input.placements) {
        const full = normaliseName(p.studentName)
        const userId = byName.get(full) ?? byName.get(full.split(' ').slice(0, 2).join(' '))
        if (!userId) {
          summary.placements.unmatched.push(p.studentName)
          continue
        }
        summary.placements.matched++
        for (const a of p.assignments) {
          const target = subgroupId.get(sgKey(a.course, a.number))
          if (!target) continue
          const courseSubgroups = [...subgroupId.entries()].filter(([k]) => k.startsWith(`${a.course.index}:`)).map(([, id]) => id)
          const current = target.startsWith('new-')
            ? []
            : await tx.subgroupStudent.findMany({ where: { userId, subgroupId: { in: courseSubgroups } } })
          if (current.length === 1 && current[0].subgroupId === target) continue
          summary.placements.membershipsChanged++
          if (input.dryRun) continue
          await tx.subgroupStudent.deleteMany({ where: { userId, subgroupId: { in: courseSubgroups } } })
          await tx.subgroupStudent.create({ data: { userId, subgroupId: target } })
        }
      }
    }

    summary.changes = [...scheduleChanges.map((c) => c.change), ...deadlineChanges.map((c) => c.change)]

    // Record the import and, after the first one, its changes ----------------------
    if (!input.dryRun && semester) {
      const record = await tx.timetableImport.create({
        data: {
          groupId: input.groupId,
          semesterId: semester.id,
          sourceRef: input.sourceRef,
          importedById: input.importedById,
          summary: JSON.parse(JSON.stringify({ ...summary, changes: summary.changes.slice(0, 500) })),
        },
      })
      summary.importId = record.id
      if (!summary.firstImport) {
        const schedulesByKey = new Map(
          (await tx.schedule.findMany({ where: { externalKey: { in: scheduleChanges.map((c) => c.scheduleKey) } }, select: { id: true, externalKey: true, subjectId: true, subgroupId: true } })).map((s) => [s.externalKey!, s])
        )
        const deadlinesByKey = new Map(
          (await tx.deadline.findMany({ where: { externalKey: { in: deadlineChanges.map((c) => c.deadlineKey) } }, select: { id: true, externalKey: true, subjectId: true, subgroupId: true } })).map((d) => [d.externalKey!, d])
        )
        const rows: Prisma.AnnouncementCreateManyInput[] = [
          ...scheduleChanges.map(({ change, scheduleKey }) => {
            const s = schedulesByKey.get(scheduleKey)
            return {
              groupId: input.groupId,
              subjectId: s?.subjectId ?? null,
              subgroupId: s?.subgroupId ?? null,
              scheduleId: s?.id ?? null,
              kind: change.kind,
              title: change.title,
              details: JSON.parse(JSON.stringify({ subject: change.subject, before: change.before, after: change.after })),
              importId: record.id,
              sourceType: 'SHEET_IMPORT',
              sourceRef: input.sourceRef,
              authorId: input.importedById,
            }
          }),
          ...deadlineChanges.map(({ change, deadlineKey }) => {
            const d = deadlinesByKey.get(deadlineKey)
            return {
              groupId: input.groupId,
              subjectId: d?.subjectId ?? null,
              subgroupId: d?.subgroupId ?? null,
              deadlineId: d?.id ?? null,
              kind: change.kind,
              title: change.title,
              details: JSON.parse(JSON.stringify({ subject: change.subject, before: change.before, after: change.after })),
              importId: record.id,
              sourceType: 'SHEET_IMPORT',
              sourceRef: input.sourceRef,
              authorId: input.importedById,
            }
          }),
        ]
        if (rows.length > 0) await tx.announcement.createMany({ data: rows })
        summary.notifyScheduleIds = scheduleChanges
          .filter((c) => c.change.kind !== 'SCHEDULE_REMOVED')
          .map((c) => schedulesByKey.get(c.scheduleKey)?.id)
          .filter((id): id is string => !!id)
      }
    }
  }

  if (input.dryRun) await run(prisma as unknown as Tx)
  else await prisma.$transaction(run, { timeout: 120_000, maxWait: 10_000 })
  return summary
}
