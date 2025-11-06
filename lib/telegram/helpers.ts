import { ScheduleData } from './llm'

/**
 * Форматировать расписание для Telegram
 */
export function formatSchedule(schedules: ScheduleData[]): string {
  if (schedules.length === 0) {
    return '📅 Занятий нет.'
  }

  let message = '📅 *Расписание:*\n\n'
  
  schedules.forEach((schedule, index) => {
    message += `${index + 1}. *${schedule.subject.name}*\n`
    message += `   ⏰ ${schedule.startTime} - ${schedule.endTime}\n`
    if (schedule.location) {
      message += `   📍 ${schedule.location}\n`
    }
    if (schedule.subject.instructor) {
      message += `   👨‍🏫 ${schedule.subject.instructor}\n`
    }
    if (schedule.eventType) {
      message += `   📚 ${schedule.eventType}\n`
    }
    if (schedule.description) {
      message += `   📝 ${schedule.description}\n`
    }
    message += `\n`
  })

  return message
}

/**
 * Форматировать следующее занятие
 */
export function formatNextClass(schedule: ScheduleData | null): string {
  if (!schedule) {
    return '📅 Следующих занятий нет.'
  }

  let message = `⏰ *Следующее занятие:*\n\n`
  message += `📚 *${schedule.subject.name}*\n`
  message += `📅 ${schedule.date.toLocaleDateString('ru-RU')}\n`
  message += `⏰ ${schedule.startTime} - ${schedule.endTime}\n`
  if (schedule.location) {
    message += `📍 ${schedule.location}\n`
  }
  if (schedule.subject.instructor) {
    message += `👨‍🏫 ${schedule.subject.instructor}\n`
  }
  if (schedule.eventType) {
    message += `📚 ${schedule.eventType}\n`
  }
  return message
}

/**
 * Парсинг даты на русском языке
 */
export function parseRussianDate(dateStr: string): Date | null {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const lowerStr = dateStr.toLowerCase().trim()

  if (lowerStr.includes('сегодня') || lowerStr.includes('today')) {
    return today
  }

  if (lowerStr.includes('завтра') || lowerStr.includes('tomorrow')) {
    return tomorrow
  }

  if (lowerStr.includes('понедельник') || lowerStr.includes('monday')) {
    return getNextWeekday(today, 1)
  }

  if (lowerStr.includes('вторник') || lowerStr.includes('tuesday')) {
    return getNextWeekday(today, 2)
  }

  if (lowerStr.includes('среда') || lowerStr.includes('wednesday')) {
    return getNextWeekday(today, 3)
  }

  if (lowerStr.includes('четверг') || lowerStr.includes('thursday')) {
    return getNextWeekday(today, 4)
  }

  if (lowerStr.includes('пятница') || lowerStr.includes('friday')) {
    return getNextWeekday(today, 5)
  }

  if (lowerStr.includes('суббота') || lowerStr.includes('saturday')) {
    return getNextWeekday(today, 6)
  }

  if (lowerStr.includes('воскресенье') || lowerStr.includes('sunday')) {
    return getNextWeekday(today, 0)
  }

  // Попытка парсинга даты в формате DD.MM.YYYY или DD/MM/YYYY
  const dateRegex = /(\d{1,2})[./](\d{1,2})[./](\d{4})/
  const match = dateStr.match(dateRegex)
  
  if (match) {
    const day = parseInt(match[1])
    const month = parseInt(match[2]) - 1 // месяцы в JS начинаются с 0
    const year = parseInt(match[3])
    return new Date(year, month, day)
  }

  return null
}

/**
 * Получить следующий день недели
 */
function getNextWeekday(fromDate: Date, targetDay: number): Date {
  const result = new Date(fromDate)
  const currentDay = result.getDay()
  const daysUntilTarget = (targetDay - currentDay + 7) % 7
  result.setDate(result.getDate() + daysUntilTarget)
  return result
}

/**
 * Форматировать время в читаемый вид
 */
export function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const minute = parseInt(minutes)
  
  if (hour < 12) {
    return `${hour}:${minutes} (утро)`
  } else if (hour < 18) {
    return `${hour}:${minutes} (день)`
  } else {
    return `${hour}:${minutes} (вечер)`
  }
}

/**
 * Получить эмодзи для типа занятия
 */
export function getEventTypeEmoji(eventType?: string): string {
  if (!eventType) return '📚'
  
  const type = eventType.toLowerCase()
  
  if (type.includes('лекция') || type.includes('lecture')) {
    return '🎓'
  }
  
  if (type.includes('семинар') || type.includes('seminar')) {
    return '💬'
  }
  
  if (type.includes('практика') || type.includes('practice')) {
    return '🔬'
  }
  
  if (type.includes('экзамен') || type.includes('exam')) {
    return '📝'
  }
  
  if (type.includes('зачет') || type.includes('test')) {
    return '✅'
  }
  
  return '📚'
}

/**
 * Экранировать специальные символы для Telegram MarkdownV2
 * Для MarkdownV2 необходимо экранировать: _*[]()~`>#+-=|{}.!\
 * https://core.telegram.org/bots/api#markdownv2-style
 */
export function escapeMarkdown(text: string): string {
  // Экранируем все специальные символы MarkdownV2, включая обратный слеш
  return text.replace(/[_*[\]()~`>#+=|{}.!-\\]/g, '\\$&')
}

/**
 * Обрезать текст до указанной длины
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Форматировать дату в русском стиле
 */
export function formatRussianDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  
  return date.toLocaleDateString('ru-RU', options)
}

/**
 * Получить относительное время (через сколько времени)
 */
export function getRelativeTime(targetDate: Date): string {
  const now = new Date()
  const diffMs = targetDate.getTime() - now.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMinutes < 0) {
    return 'уже прошло'
  }
  
  if (diffMinutes < 60) {
    return `через ${diffMinutes} мин`
  }
  
  if (diffHours < 24) {
    return `через ${diffHours} ч`
  }
  
  return `через ${diffDays} дн`
}

/**
 * Проверить, является ли дата сегодняшней
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

/**
 * Проверить, является ли дата завтрашней
 */
export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date.toDateString() === tomorrow.toDateString()
}

/**
 * Получить название дня недели на русском
 */
export function getRussianWeekday(date: Date): string {
  const weekdays = [
    'воскресенье',
    'понедельник',
    'вторник',
    'среда',
    'четверг',
    'пятница',
    'суббота'
  ]
  
  return weekdays[date.getDay()]
}
