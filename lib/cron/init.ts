import cron from 'node-cron'
import { prisma } from '@/lib/db'
import { APP_TIME_ZONE, classInstant } from '@/lib/schedule/time'
import {
  audienceOfSchedule,
  sendDailySummary,
  sendHomeworkDeadlineReminder,
  sendScheduleReminder,
  sendWeeklyHomeworkSummary,
} from '@/lib/bot/notifications'
import { BOT_CHANNELS, listRecipients } from '@/lib/bot/channels'

/**
 * Scheduled bot notifications. Times are in APP_TIME_ZONE (the timetable's
 * zone), not the server's. Each notification goes to every messenger a user
 * has linked.
 */

const REMINDER_TICK_MINUTES = 5

export async function initializeCronJobs() {
  if (!process.env.DATABASE_URL) {
    console.error('Cron jobs skipped: DATABASE_URL is not set')
    return
  }
  if (process.env.NODE_ENV === 'test' || process.env.CI === 'true') {
    console.error('Cron jobs skipped: test environment')
    return
  }
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (error) {
    console.error('Cron jobs skipped: database unreachable:', error instanceof Error ? error.message : error)
    return
  }

  const options = { timezone: APP_TIME_ZONE }
  cron.schedule(`*/${REMINDER_TICK_MINUTES} * * * *`, () => run('class reminders', checkScheduleReminders), options)
  cron.schedule('0 7 * * *', () => run('daily summaries', sendDailySummaries), options)
  cron.schedule('0 */2 * * *', () => run('homework deadlines', checkHomeworkDeadlines), options)
  cron.schedule('0 8 * * 1', () => run('weekly homework summaries', sendWeeklyHomeworkSummaries), options)
  console.error(`Cron jobs scheduled (${APP_TIME_ZONE})`)
}

async function run(name: string, job: () => Promise<void>) {
  try {
    await job()
  } catch (error) {
    console.error(`Cron job "${name}" failed:`, error)
  }
}

/** Notifications run when at least one bot is active and they are enabled. */
async function notificationSettings() {
  const settings = await prisma.botSettings.findFirst({ orderBy: { createdAt: 'desc' } })
  if (!settings?.notificationsEnabled || !(settings.isActive || settings.maxIsActive)) return null
  return settings
}

/** Everyone with at least one linked messenger and notifications on. */
async function notifiableUserIds(): Promise<string[]> {
  const ids = new Set<string>()
  for (const channel of BOT_CHANNELS) for (const r of await listRecipients(channel)) ids.add(r.user.id)
  return [...ids]
}

/**
 * Remind each class's audience `reminderMinutes` before it starts. Each class
 * falls into exactly one 5-minute tick, so a reminder is sent once.
 */
export async function checkScheduleReminders(now: Date = new Date()) {
  const settings = await notificationSettings()
  if (!settings) return
  const lead = (settings.reminderMinutes || 30) * 60 * 1000
  const windowStart = now.getTime() + lead - REMINDER_TICK_MINUTES * 60 * 1000
  const windowEnd = now.getTime() + lead

  // Candidates: classes dated today or tomorrow; exact start times are checked below.
  const candidates = await prisma.schedule.findMany({
    where: {
      isActive: true,
      date: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), lte: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true, date: true, startTime: true, groupId: true, subgroupId: true },
  })

  const minutes = settings.reminderMinutes || 30
  for (const schedule of candidates) {
    const start = classInstant(schedule.date, schedule.startTime).getTime()
    if (start <= windowStart || start > windowEnd) continue
    for (const userId of await audienceOfSchedule(schedule)) {
      await sendScheduleReminder(userId, schedule.id, minutes)
    }
  }
}

async function sendDailySummaries() {
  if (!(await notificationSettings())) return
  for (const userId of await notifiableUserIds()) await sendDailySummary(userId)
}

/** Remind 24 hours and 2 hours before a homework deadline. */
async function checkHomeworkDeadlines() {
  if (!(await notificationSettings())) return
  const now = new Date()
  const homework = await prisma.homework.findMany({
    where: { isActive: true, groupId: { not: null }, deadline: { gte: now, lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) } },
    select: { id: true, deadline: true, groupId: true },
  })
  const notifiable = new Set(await notifiableUserIds())
  for (const hw of homework) {
    const hoursLeft = Math.ceil((hw.deadline.getTime() - now.getTime()) / (60 * 60 * 1000))
    const due = (hoursLeft <= 24 && hoursLeft > 22) || (hoursLeft <= 2 && hoursLeft > 0)
    if (!due || !hw.groupId) continue
    const students = await prisma.user.findMany({ where: { groupId: hw.groupId }, select: { id: true } })
    for (const { id } of students) if (notifiable.has(id)) await sendHomeworkDeadlineReminder(id, hw.id, hoursLeft)
  }
}

async function sendWeeklyHomeworkSummaries() {
  if (!(await notificationSettings())) return
  for (const userId of await notifiableUserIds()) await sendWeeklyHomeworkSummary(userId)
}

export function stopCronJobs() {
  cron.getTasks().forEach((task) => task.stop())
}
