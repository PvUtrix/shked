/**
 * Time-zone arithmetic for the timetable. Class times ("10:00") are wall-clock
 * times in APP_TIME_ZONE (default Europe/Moscow), whatever zone the server
 * runs in. Only Intl is used, so no dependency is needed.
 */

export const APP_TIME_ZONE = process.env.APP_TIME_ZONE || 'Europe/Moscow'

/** Offset of `timeZone` from UTC at the given instant, in milliseconds. */
export function zoneOffsetMs(at: Date, timeZone: string = APP_TIME_ZONE): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asUtc - Math.floor(at.getTime() / 1000) * 1000
}

/** Calendar date (y, m, d) of an instant in the zone. */
export function zonedDate(at: Date, timeZone: string = APP_TIME_ZONE): { y: number; m: number; d: number } {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(at)
    .split('-')
    .map(Number)
  return { y, m, d }
}

/** The UTC instant of a wall-clock time in the zone. */
export function zonedTimeToUtc(y: number, m: number, d: number, hh: number, mm: number, timeZone: string = APP_TIME_ZONE): Date {
  const guess = Date.UTC(y, m - 1, d, hh, mm)
  // Two passes settle the offset around DST changes.
  const first = guess - zoneOffsetMs(new Date(guess), timeZone)
  return new Date(guess - zoneOffsetMs(new Date(first), timeZone))
}

/** Start and end of a calendar day in the zone (0 = today, 1 = tomorrow). */
export function appDayRange(offsetDays = 0, now: Date = new Date(), timeZone: string = APP_TIME_ZONE): { start: Date; end: Date } {
  const { y, m, d } = zonedDate(now, timeZone)
  const start = zonedTimeToUtc(y, m, d + offsetDays, 0, 0, timeZone)
  const next = zonedTimeToUtc(y, m, d + offsetDays + 1, 0, 0, timeZone)
  return { start, end: new Date(next.getTime() - 1) }
}

/** ISO weekday (1 = Monday ... 7 = Sunday) of an instant in the zone. */
export function isoWeekday(at: Date, timeZone: string = APP_TIME_ZONE): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(at)
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(name) + 1
}

/**
 * When a class starts: the calendar day of `date` in the zone at the
 * wall-clock `time` ("HH:MM"). `date` may be stored at any time of that day.
 */
export function classInstant(date: Date, time: string, timeZone: string = APP_TIME_ZONE): Date {
  const { y, m, d } = zonedDate(date, timeZone)
  const [hh, mm] = time.split(':').map(Number)
  return zonedTimeToUtc(y, m, d, hh || 0, mm || 0, timeZone)
}
