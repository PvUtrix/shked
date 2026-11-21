import { prisma } from '@/lib/db'
import { BOT_CHANNELS, channelStats, listRecipients, sendText, sendToUser, type BotChannel, type ChannelStats, type RecipientFilter } from './channels'
import { botT, formatDeadline, formatInAppZone, type BotT } from './i18n'
import { formatClass, paragraphs, statusLabel } from './format'
import { getScheduleForDay, getScheduleBetween, appDayRange, isoWeekday } from './schedule-data'

/**
 * Notifications go to every messenger a user has linked with notifications
 * on. Functions return how many deliveries succeeded.
 */

export interface BroadcastResult {
  sent: number
  total: number
}

/** "Class starts in N minutes". */
export async function sendScheduleReminder(userId: string, scheduleId: string, minutes: number, t: BotT = botT()): Promise<number> {
  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId }, include: { subject: true } })
  if (!schedule) return 0
  const text = paragraphs(
    t('notify.reminderTitle'),
    [
      `📚 *${schedule.subject.name}*`,
      t('notify.reminderStarts', { minutes, time: schedule.startTime }),
      `📍 ${schedule.location || t('notify.locationUnknown')}`,
      `👨‍🏫 ${schedule.subject.instructor || t('notify.instructorUnknown')}`,
    ].join('\n'),
    schedule.description && `📝 ${schedule.description}`,
    t('notify.reminderFooter')
  )
  return sendToUser(userId, () => text)
}

/** The users who see a schedule entry: its subgroup, or else its group. */
export async function audienceOfSchedule(schedule: { groupId: string | null; subgroupId: string | null }): Promise<string[]> {
  if (schedule.subgroupId) {
    const members = await prisma.subgroupStudent.findMany({ where: { subgroupId: schedule.subgroupId }, select: { userId: true } })
    return members.map((m) => m.userId)
  }
  if (schedule.groupId) {
    const users = await prisma.user.findMany({ where: { groupId: schedule.groupId }, select: { id: true } })
    return users.map((u) => u.id)
  }
  return []
}

/** Tell everyone who sees a class that it changed. */
export async function notifyScheduleChange(scheduleId: string, t: BotT = botT()): Promise<BroadcastResult> {
  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId }, include: { subject: true } })
  if (!schedule) return { sent: 0, total: 0 }
  const text = paragraphs(
    t('notify.changeTitle'),
    [
      `📚 *${schedule.subject.name}*`,
      `📅 ${formatInAppZone(schedule.date, { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
      `⏰ ${schedule.startTime} - ${schedule.endTime}`,
      `📍 ${schedule.location || t('notify.locationUnknown')}`,
      `👨‍🏫 ${schedule.subject.instructor || t('notify.instructorUnknown')}`,
    ].join('\n'),
    schedule.description && `📝 ${schedule.description}`,
    t('notify.changeFooter')
  )
  const userIds = await audienceOfSchedule(schedule)
  let sent = 0
  for (const userId of userIds) sent += await sendToUser(userId, () => text)
  return { sent, total: userIds.length }
}

/** Morning summary of today's classes. */
export async function sendDailySummary(userId: string, t: BotT = botT()): Promise<number> {
  const items = await getScheduleForDay(userId, 0)
  const text =
    items.length === 0
      ? paragraphs(t('notify.morning'), t('notify.morningNone'))
      : `${t('notify.morning')}\n\n${t('schedule.todayTitle')}\n\n` + items.map((s, i) => formatClass(s, i)).join('') + t('notify.dayFooter')
  return sendToUser(userId, () => text)
}

async function broadcast(message: string, filter: RecipientFilter, channel?: BotChannel): Promise<BroadcastResult> {
  let sent = 0
  let total = 0
  for (const ch of channel ? [channel] : BOT_CHANNELS) {
    const recipients = await listRecipients(ch, filter)
    total += recipients.length
    for (const r of recipients) if (await sendText(ch, r.chatId, message)) sent++
  }
  return { sent, total }
}

export function broadcastToGroup(groupId: string, message: string, channel?: BotChannel): Promise<BroadcastResult> {
  return broadcast(message, { groupId }, channel)
}

export function broadcastToAll(message: string, role?: string, channel?: BotChannel): Promise<BroadcastResult> {
  return broadcast(message, role ? { role } : {}, channel)
}

/** A test message to one user, on one channel or all of theirs. */
export async function sendTestMessage(userId: string, channel?: BotChannel, t: BotT = botT()): Promise<boolean> {
  const text = paragraphs(
    t('notify.testTitle'),
    t('notify.testBody', { time: formatInAppZone(new Date(), { dateStyle: 'short', timeStyle: 'short' }) })
  )
  if (!channel) return (await sendToUser(userId, () => text)) > 0
  const [account] = await listRecipients(channel, { userIds: [userId] })
  return account ? sendText(channel, account.chatId, text) : false
}

/** "Homework due in N hours". */
export async function sendHomeworkDeadlineReminder(userId: string, homeworkId: string, hoursLeft: number, t: BotT = botT()): Promise<number> {
  const homework = await prisma.homework.findUnique({
    where: { id: homeworkId },
    include: { subject: true, submissions: { where: { userId } } },
  })
  if (!homework) return 0
  const submission = homework.submissions[0]
  const submitted = submission?.status === 'SUBMITTED' || submission?.status === 'REVIEWED'
  const text = paragraphs(
    t('notify.deadlineTitle'),
    [
      `📚 *${homework.title}*`,
      `📖 ${homework.subject.name}`,
      t('notify.deadlineIn', { hours: hoursLeft }),
      t('homework.status', { status: statusLabel(t, submission?.status) }),
    ].join('\n'),
    homework.description && `📝 ${homework.description}`,
    homework.taskUrl && t('notify.openTask', { url: homework.taskUrl }),
    submitted ? t('notify.deadlineDone') : t('notify.deadlinePending')
  )
  return sendToUser(userId, () => text)
}

/** Tell a homework's group that it was published. */
export async function notifyNewHomework(homeworkId: string, t: BotT = botT()): Promise<BroadcastResult> {
  const homework = await prisma.homework.findUnique({ where: { id: homeworkId }, include: { subject: true } })
  if (!homework?.groupId) return { sent: 0, total: 0 }
  const text = paragraphs(
    t('notify.newHomeworkTitle'),
    [`📚 *${homework.title}*`, `📖 ${homework.subject.name}`, t('homework.deadline', { deadline: formatDeadline(homework.deadline) })].join('\n'),
    homework.description && `📝 ${homework.description}`,
    homework.taskUrl && t('notify.openTask', { url: homework.taskUrl }),
    t('notify.newHomeworkFooter')
  )
  return broadcastToGroup(homework.groupId, text)
}

/** Tell a student their submission was reviewed. */
export async function notifyHomeworkReviewed(submissionId: string, t: BotT = botT()): Promise<number> {
  const submission = await prisma.homeworkSubmission.findUnique({
    where: { id: submissionId },
    include: { homework: { include: { subject: true } } },
  })
  if (!submission) return 0
  const text = paragraphs(
    t('notify.reviewedTitle'),
    [
      `📚 *${submission.homework.title}*`,
      `📖 ${submission.homework.subject.name}`,
      submission.grade != null && t('notify.reviewedGrade', { grade: submission.grade }),
      t('homework.status', { status: t('status.reviewed') }),
    ]
      .filter(Boolean)
      .join('\n'),
    submission.comment && t('notify.reviewedComment', { comment: submission.comment })
  )
  return sendToUser(submission.userId, () => text)
}

/** Monday summary of the homework due this week. */
export async function sendWeeklyHomeworkSummary(userId: string, t: BotT = botT()): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { groupId: true } })
  if (!user?.groupId) return 0
  const weekday = isoWeekday(new Date())
  const from = appDayRange(1 - weekday).start
  const to = appDayRange(7 - weekday).end
  const homework = await prisma.homework.findMany({
    where: { groupId: user.groupId, isActive: true, deadline: { gte: from, lte: to } },
    include: { subject: true, submissions: { where: { userId } } },
    orderBy: { deadline: 'asc' },
  })
  let text: string
  if (homework.length === 0) {
    text = t('notify.weeklyNone')
  } else {
    text = `${t('notify.weeklyTitle')}\n\n`
    homework.forEach((hw, i) => {
      const submission = hw.submissions[0]
      text += `${i + 1}. *${hw.title}*\n   📚 ${hw.subject.name}\n   ⏰ ${formatDeadline(hw.deadline)}\n   📊 ${statusLabel(t, submission?.status)}\n`
      if (submission?.grade != null) text += `   ${t('notify.reviewedGrade', { grade: submission.grade })}\n`
      text += '\n'
    })
    text += t('notify.weekFooter')
  }
  return sendToUser(userId, () => text)
}

export function getNotificationStats(channel: BotChannel): Promise<ChannelStats> {
  return channelStats(channel)
}

// Re-exported for the cron jobs, which pick classes in a time window.
export { getScheduleBetween }
