import { prisma } from '@/lib/db'
import { getUserScheduleScope, scheduleVisibilityWhere } from '@/lib/schedule/visibility'
import { appDayRange, isoWeekday } from '@/lib/schedule/time'

export { appDayRange, isoWeekday }

export interface ScheduleItem {
  id: string
  subject: { name: string; instructor?: string }
  date: Date
  dayOfWeek: number
  startTime: string
  endTime: string
  location?: string
  eventType?: string
  description?: string
}

function toItem(s: {
  id: string
  date: Date
  dayOfWeek: number
  startTime: string
  endTime: string
  location: string | null
  eventType: string | null
  description: string | null
  subject: { name: string; instructor: string | null }
}): ScheduleItem {
  return {
    id: s.id,
    subject: { name: s.subject.name, instructor: s.subject.instructor ?? undefined },
    date: s.date,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    location: s.location ?? undefined,
    eventType: s.eventType ?? undefined,
    description: s.description ?? undefined,
  }
}

/** The classes a user sees between two instants, honouring subgroups. */
export async function getScheduleBetween(userId: string, from: Date, to: Date): Promise<ScheduleItem[]> {
  const scope = await getUserScheduleScope(userId)
  const rows = await prisma.schedule.findMany({
    where: {
      isActive: true,
      date: { gte: from, lte: to },
      ...scheduleVisibilityWhere(scope.groupId, scope.subgroupIds),
    },
    include: { subject: { select: { name: true, instructor: true } } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })
  return rows.map(toItem)
}

/** The classes on one day in the app time zone (0 = today). */
export async function getScheduleForDay(userId: string, offsetDays = 0): Promise<ScheduleItem[]> {
  const { start, end } = appDayRange(offsetDays)
  return getScheduleBetween(userId, start, end)
}

/** Monday to Sunday of the current week in the app time zone. */
export async function getScheduleForWeek(userId: string, now: Date = new Date()): Promise<ScheduleItem[]> {
  const weekday = isoWeekday(now)
  const monday = appDayRange(1 - weekday, now).start
  const sunday = appDayRange(7 - weekday, now).end
  return getScheduleBetween(userId, monday, sunday)
}

/** The next class the user sees, from now on. */
export async function getNextClass(userId: string): Promise<ScheduleItem | null> {
  const scope = await getUserScheduleScope(userId)
  const row = await prisma.schedule.findFirst({
    where: {
      isActive: true,
      date: { gte: appDayRange(0).start },
      ...scheduleVisibilityWhere(scope.groupId, scope.subgroupIds),
    },
    include: { subject: { select: { name: true, instructor: true } } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })
  return row ? toItem(row) : null
}

/** Names of the subgroups a user belongs to, for the assistant's context. */
export async function getSubgroupNames(userId: string): Promise<string[]> {
  const rows = await prisma.subgroupStudent.findMany({
    where: { userId },
    select: { subgroup: { select: { name: true, subject: { select: { name: true } } } } },
  })
  return rows.map((r) => (r.subgroup.subject ? `${r.subgroup.subject.name}: ${r.subgroup.name}` : r.subgroup.name))
}
