import { describe, it, expect } from '@jest/globals'
import { createICalendar } from '@/lib/export/ical'

describe('lib/export/ical', () => {
  const ics = createICalendar(
    [
      {
        uid: 'a',
        title: 'Long title with multibyte letters '.repeat(4) + '\u00e9\u00e9\u00e9\u044f\u044f\u044f'.repeat(10),
        start: new Date('2026-11-21T11:15:00Z'),
        end: new Date('2026-11-21T13:30:00Z'),
      },
      { uid: 'b', title: 'Due: HW 4', start: new Date('2026-12-12T20:59:00Z'), end: new Date('2026-12-12T20:59:00Z'), allDayDate: '2026-12-12' },
    ],
    'Studies'
  )
  const lines = ics.split('\r\n')

  it('keeps every line within 75 octets, folding multibyte text', () => {
    for (const line of lines) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75)
    const unfolded = ics.replace(/\r\n /g, '')
    expect(unfolded).toContain('\u00e9\u00e9\u00e9\u044f\u044f\u044f')
  })

  it('writes timed events in UTC and all-day events as dates', () => {
    expect(lines).toContain('DTSTART:20261121T111500Z')
    expect(lines).toContain('DTSTART;VALUE=DATE:20261212')
    expect(lines).toContain('DTEND;VALUE=DATE:20261213')
  })
})
