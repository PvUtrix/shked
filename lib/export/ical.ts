/**
 * Утилиты для экспорта расписания в iCal формат
 * Совместимо с Google Calendar, Apple Calendar, Outlook и др.
 */

export interface ICalEvent {
  uid: string
  title: string
  description?: string
  location?: string
  start: Date
  end: Date
  /** All-day event on start's calendar date (YYYY-MM-DD in allDayDate). */
  allDayDate?: string
  url?: string
  organizer?: {
    name: string
    email: string
  }
  attendees?: Array<{
    name: string
    email: string
  }>
}

/**
 * Форматирует дату в iCal формат (UTC)
 * @param date Date объект
 * @returns Строка в формате YYYYMMDDTHHMMSSZ
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const minute = String(date.getUTCMinutes()).padStart(2, '0')
  const second = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}${month}${day}T${hour}${minute}${second}Z`
}

/**
 * Экранирует специальные символы для iCal
 * @param text Текст для экранирования
 * @returns Экранированный текст
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Разбивает длинные строки на строки по 75 символов (требование iCal)
 * @param line Строка для разбиения
 * @returns Массив строк
 */
function foldLine(line: string): string {
  // RFC 5545: lines are at most 75 octets; continuation lines start with a space.
  const encoder = new TextEncoder()
  const out: string[] = []
  let current = ''
  let size = 0
  for (const ch of line) {
    const n = encoder.encode(ch).length
    const limit = out.length === 0 ? 75 : 74
    if (size + n > limit) {
      out.push(current)
      current = ''
      size = 0
    }
    current += ch
    size += n
  }
  out.push(current)
  return out.map((l, i) => (i === 0 ? l : ' ' + l)).join('\r\n')
}

/**
 * Создаёт iCal календарь из событий
 * @param events Массив событий
 * @param calendarName Название календаря
 * @returns Строка в формате iCal
 */
export function createICalendar(events: ICalEvent[], calendarName: string = 'Расписание ШКЭД'): string {
  const now = formatICalDate(new Date())

  let ical = 'BEGIN:VCALENDAR\r\n'
  ical += 'VERSION:2.0\r\n'
  ical += 'PRODID:-//SHKED//Schedule Export//RU\r\n'
  ical += 'CALSCALE:GREGORIAN\r\n'
  ical += 'METHOD:PUBLISH\r\n'
  ical += foldLine(`X-WR-CALNAME:${escapeICalText(calendarName)}`) + '\r\n'
  ical += 'X-WR-TIMEZONE:Europe/Moscow\r\n'
  ical += foldLine(`X-WR-CALDESC:${escapeICalText(calendarName)}`) + '\r\n'

  events.forEach((event) => {
    ical += 'BEGIN:VEVENT\r\n'
    ical += foldLine(`UID:${event.uid}@shked.ru`) + '\r\n'
    ical += `DTSTAMP:${now}\r\n`
    if (event.allDayDate) {
      const day = event.allDayDate.replace(/-/g, '')
      const next = new Date(`${event.allDayDate}T00:00:00Z`)
      next.setUTCDate(next.getUTCDate() + 1)
      ical += `DTSTART;VALUE=DATE:${day}\r\n`
      ical += `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, '')}\r\n`
    } else {
      ical += `DTSTART:${formatICalDate(event.start)}\r\n`
      ical += `DTEND:${formatICalDate(event.end)}\r\n`
    }
    ical += foldLine(`SUMMARY:${escapeICalText(event.title)}`) + '\r\n'

    if (event.description) {
      ical += foldLine(`DESCRIPTION:${escapeICalText(event.description)}`) + '\r\n'
    }

    if (event.location) {
      ical += foldLine(`LOCATION:${escapeICalText(event.location)}`) + '\r\n'
    }

    if (event.url) {
      ical += foldLine(`URL:${event.url}`) + '\r\n'
    }

    if (event.organizer) {
      ical += foldLine(
        `ORGANIZER;CN="${escapeICalText(event.organizer.name)}":mailto:${event.organizer.email}`
      ) + '\r\n'
    }

    if (event.attendees && event.attendees.length > 0) {
      event.attendees.forEach((attendee) => {
        ical += foldLine(
          `ATTENDEE;CN="${escapeICalText(attendee.name)}";ROLE=REQ-PARTICIPANT:mailto:${attendee.email}`
        ) + '\r\n'
      })
    }

    ical += 'STATUS:CONFIRMED\r\n'
    ical += 'SEQUENCE:0\r\n'
    ical += 'END:VEVENT\r\n'
  })

  ical += 'END:VCALENDAR\r\n'

  return ical
}

/**
 * Создаёт ответ с iCal файлом для скачивания
 * @param icalContent Содержимое iCal файла
 * @param filename Имя файла для скачивания
 * @returns Response с заголовками для скачивания
 */
export function createICalResponse(icalContent: string, filename: string): Response {
  return new Response(icalContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': Buffer.from(icalContent, 'utf-8').length.toString(),
    },
  })
}
