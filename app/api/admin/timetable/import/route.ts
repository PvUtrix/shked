import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logActivity } from '@/lib/activity-log'
import { parseDeadlineSheet, parsePlacementSheet, parseTimetableSheet } from '@/lib/timetable/parse'
import { applyTimetable } from '@/lib/timetable/apply'
import { notifyScheduleChange } from '@/lib/bot/notifications'
import { checkUpload, fetchGoogleSheet, guessSheets, readWorkbook, SourceError } from '@/lib/timetable/source'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const ALLOWED_ROLES = ['admin', 'education_office_head']

/**
 * POST /api/admin/timetable/import (multipart form)
 *
 * - file: an .xlsx workbook, or url: a docs.google.com spreadsheet link
 * - mode: "inspect" (list sheets and guess their roles), "preview" (dry run)
 *   or "apply"
 * - groupId, semesterNumber, semesterTitle: for preview and apply
 * - timetableSheet, deadlinesSheet, placementSheet: sheet names
 * - notify: "false" to skip bot notifications about changed classes
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const form = await request.formData()
    const mode = String(form.get('mode') ?? 'inspect')
    const file = form.get('file')
    const url = String(form.get('url') ?? '').trim()

    let data: ArrayBuffer
    let sourceRef: string
    if (file instanceof File && file.size > 0) {
      checkUpload(file)
      data = await file.arrayBuffer()
      sourceRef = `upload:${file.name}`
    } else if (url) {
      ;({ data, sourceRef } = await fetchGoogleSheet(url))
    } else {
      return NextResponse.json({ error: 'Attach an .xlsx file or paste a Google Sheets link.' }, { status: 400 })
    }

    const wb = readWorkbook(Buffer.from(data))
    if (mode === 'inspect') {
      return NextResponse.json({ sourceRef, ...guessSheets(wb) })
    }

    const groupId = String(form.get('groupId') ?? '')
    const semesterNumber = Number(form.get('semesterNumber'))
    const semesterTitle = String(form.get('semesterTitle') ?? '').trim() || `Semester ${semesterNumber}`
    const timetableSheet = String(form.get('timetableSheet') ?? '')
    const deadlinesSheet = String(form.get('deadlinesSheet') ?? '')
    const placementSheet = String(form.get('placementSheet') ?? '')
    if (!groupId || !Number.isInteger(semesterNumber) || semesterNumber < 1) {
      return NextResponse.json({ error: 'Pick a group and a semester number.' }, { status: 400 })
    }
    if (!wb.Sheets[timetableSheet]) {
      return NextResponse.json({ error: 'Pick the timetable sheet.' }, { status: 400 })
    }
    const group = await prisma.group.findUnique({ where: { id: groupId }, select: { id: true } })
    if (!group) return NextResponse.json({ error: 'Group not found.' }, { status: 404 })

    const timetable = parseTimetableSheet(wb.Sheets[timetableSheet])
    const deadlineResult = wb.Sheets[deadlinesSheet]
      ? parseDeadlineSheet(wb.Sheets[deadlinesSheet], timetable.courses, timetable.generalCourse)
      : null
    const placementResult = wb.Sheets[placementSheet] ? parsePlacementSheet(wb.Sheets[placementSheet], timetable.courses) : null

    const summary = await applyTimetable({
      groupId,
      semester: { number: semesterNumber, title: semesterTitle },
      sourceRef,
      timetable: { ...timetable, warnings: [...timetable.warnings, ...(deadlineResult?.warnings ?? []), ...(placementResult?.warnings ?? [])] },
      deadlines: deadlineResult?.deadlines,
      placements: placementResult?.placements,
      dryRun: mode !== 'apply',
      importedById: session.user.id,
    })

    if (mode === 'apply' && form.get('notify') !== 'false') {
      // Tell the students who see each changed class, through their bots. Not
      // awaited: delivery must not hold the admin's request.
      void (async () => {
        for (const id of summary.notifyScheduleIds) {
          await notifyScheduleChange(id).catch((e) => console.error('Change notification failed:', e))
        }
      })()
    }

    if (mode === 'apply') {
      await logActivity({
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'TimetableImport',
        entityId: summary.importId,
        request,
        details: { after: { sourceRef, schedules: summary.schedules, deadlines: summary.deadlines } },
        result: 'SUCCESS',
      })
    }

    const { notifyScheduleIds: _ids, ...publicSummary } = summary
    return NextResponse.json({ sourceRef, summary: publicSummary })
  } catch (error) {
    if (error instanceof SourceError) return NextResponse.json({ error: error.message }, { status: 400 })
    console.error('Timetable import failed:', error)
    return NextResponse.json({ error: 'The import failed. Check that this is the programme timetable workbook.' }, { status: 500 })
  }
}
