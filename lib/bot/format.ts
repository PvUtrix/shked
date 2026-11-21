import type { BotT } from './i18n'
import type { ScheduleItem } from './schedule-data'

/** One numbered class block, as the bot has always shown it. */
export function formatClass(item: ScheduleItem, index: number, opts: { withType?: boolean } = {}): string {
  let s = `${index + 1}. *${item.subject.name}*\n`
  s += `   ⏰ ${item.startTime} - ${item.endTime}\n`
  if (item.location) s += `   📍 ${item.location}\n`
  if (item.subject.instructor) s += `   👨‍🏫 ${item.subject.instructor}\n`
  if (opts.withType && item.eventType) s += `   📚 ${item.eventType}\n`
  return s + '\n'
}

export function formatDay(t: BotT, title: string, items: ScheduleItem[]): string {
  return `${title}\n\n` + items.map((item, i) => formatClass(item, i, { withType: true })).join('')
}

/** A week grouped by weekday (1 = Monday). */
export function formatWeek(t: BotT, items: ScheduleItem[]): string {
  let message = `${t('schedule.weekTitle')}\n\n`
  for (let day = 1; day <= 7; day++) {
    const dayItems = items.filter((item) => item.dayOfWeek === day)
    if (dayItems.length === 0) continue
    message += `*${t(`schedule.weekday.${day}`)}*\n`
    message += dayItems.map((item, i) => formatClass(item, i)).join('')
  }
  return message
}

export type SubmissionStatus = 'REVIEWED' | 'SUBMITTED' | string

export function statusLabel(t: BotT, status: SubmissionStatus | undefined): string {
  if (status === 'REVIEWED') return t('status.reviewed')
  if (status === 'SUBMITTED') return t('status.submitted')
  return t('status.notSubmitted')
}

/** Lines joined with blank-line separation, skipping empty ones. */
export function paragraphs(...parts: Array<string | false | null | undefined>): string {
  return parts.filter((p): p is string => typeof p === 'string' && p.trim() !== '').join('\n\n')
}
