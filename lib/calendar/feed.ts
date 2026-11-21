import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { createICalendar, type ICalEvent } from '@/lib/export/ical'
import { getUserScheduleScope, scheduleVisibilityWhere } from '@/lib/schedule/visibility'
import { classInstant, zonedDate, APP_TIME_ZONE } from '@/lib/schedule/time'
import { botT, type BotT } from '@/lib/bot/i18n'

/**
 * The personal calendar feed: the classes a student sees (group-wide plus
 * their subgroups) and their deadlines, as an iCal subscription. Calendar
 * apps re-read it on their own schedule, so a re-imported timetable reaches
 * every subscribed calendar without anyone editing it by hand.
 */

const PAST_DAYS = 60
const FUTURE_DAYS = 365

export function newCalendarToken(): string {
  return crypto.randomBytes(24).toString('base64url')
}

export function calendarFeedUrl(token: string): string {
  const base = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
  return `${base}/api/calendar/${token}`
}

/** Deadlines a user must meet: their group's, except other subgroups' ones. */
export async function deadlinesForUser(userId: string, from: Date, to?: Date) {
  const scope = await getUserScheduleScope(userId)
  if (!scope.groupId) return []
  return prisma.deadline.findMany({
    where: {
      groupId: scope.groupId,
      isActive: true,
      dueAt: { gte: from, ...(to ? { lte: to } : {}) },
      OR: [{ subgroupId: null }, { subgroupId: { in: scope.subgroupIds } }],
    },
    include: { subject: { select: { name: true } } },
    orderBy: { dueAt: 'asc' },
  })
}

export async function buildCalendarFeed(userId: string, t: BotT = botT()): Promise<string> {
  const now = Date.now()
  const from = new Date(now - PAST_DAYS * 24 * 60 * 60 * 1000)
  const to = new Date(now + FUTURE_DAYS * 24 * 60 * 60 * 1000)
  const scope = await getUserScheduleScope(userId)

  const [schedules, deadlines] = await Promise.all([
    prisma.schedule.findMany({
      where: { isActive: true, date: { gte: from, lte: to }, ...scheduleVisibilityWhere(scope.groupId, scope.subgroupIds) },
      include: { subject: { select: { name: true } }, subgroup: { select: { name: true, instructor: true } } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    }),
    deadlinesForUser(userId, from, to),
  ])

  const events: ICalEvent[] = schedules.map((s) => {
    const allDay = s.startTime === '00:00' && s.endTime === '23:59'
    const { y, m, d } = zonedDate(s.date)
    const title = s.description || s.subject.name
    return {
      uid: `schedule-${s.id}`,
      title: s.subgroup ? `${title} (${s.subgroup.name})` : title,
      description: [s.subject.name, s.subgroup?.instructor, s.meetingUrl].filter(Boolean).join('\n'),
      location: s.location || s.meetingUrl || undefined,
      url: s.meetingUrl || undefined,
      start: classInstant(s.date, s.startTime),
      end: classInstant(s.date, s.endTime),
      allDayDate: allDay ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : undefined,
    }
  })

  for (const dl of deadlines) {
    const { y, m, d } = zonedDate(dl.dueAt)
    const subject = dl.subject?.name
    events.push({
      uid: `deadline-${dl.id}`,
      title: t('calendar.deadline', { title: subject ? `${subject}: ${dl.title}` : dl.title }),
      description: [dl.details, dl.submissionTarget && t('calendar.submitTo', { target: dl.submissionTarget })].filter(Boolean).join('\n\n'),
      url: dl.submissionTarget || undefined,
      start: dl.dueAt,
      end: dl.dueAt,
      allDayDate: dl.allDay ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : undefined,
    })
  }

  return createICalendar(events, t('calendar.name')).replace('X-WR-TIMEZONE:Europe/Moscow', `X-WR-TIMEZONE:${APP_TIME_ZONE}`)
}
