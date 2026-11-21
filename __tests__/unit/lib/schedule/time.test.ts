import { describe, it, expect } from '@jest/globals'
import { appDayRange, classInstant, isoWeekday, zonedTimeToUtc } from '@/lib/schedule/time'

const MSK = 'Europe/Moscow'

describe('lib/schedule/time', () => {
  it('turns a Moscow wall-clock time into the right UTC instant', () => {
    expect(zonedTimeToUtc(2026, 11, 21, 14, 15, MSK).toISOString()).toBe('2026-11-21T11:15:00.000Z')
  })

  it('places a class on the Moscow calendar day of its date, whatever time the date carries', () => {
    // Stored as midnight UTC and as midnight Moscow: both are 21 Nov in Moscow.
    expect(classInstant(new Date('2026-11-21T00:00:00Z'), '10:00', MSK).toISOString()).toBe('2026-11-21T07:00:00.000Z')
    expect(classInstant(new Date('2026-11-20T21:00:00Z'), '10:00', MSK).toISOString()).toBe('2026-11-21T07:00:00.000Z')
  })

  it('computes the Moscow day boundaries in UTC', () => {
    const { start, end } = appDayRange(0, new Date('2026-11-21T22:30:00Z'), MSK) // 01:30 on 22 Nov in Moscow
    expect(start.toISOString()).toBe('2026-11-21T21:00:00.000Z')
    expect(end.toISOString()).toBe('2026-11-22T20:59:59.999Z')
    expect(appDayRange(1, new Date('2026-11-21T10:00:00Z'), MSK).start.toISOString()).toBe('2026-11-21T21:00:00.000Z')
  })

  it('handles a zone with daylight saving', () => {
    // Berlin is UTC+1 in winter and UTC+2 in summer.
    expect(zonedTimeToUtc(2026, 1, 15, 10, 0, 'Europe/Berlin').toISOString()).toBe('2026-01-15T09:00:00.000Z')
    expect(zonedTimeToUtc(2026, 7, 15, 10, 0, 'Europe/Berlin').toISOString()).toBe('2026-07-15T08:00:00.000Z')
  })

  it('gives the ISO weekday in the zone', () => {
    // 23:30 UTC on Sunday 22 Nov is already Monday in Moscow.
    expect(isoWeekday(new Date('2026-11-22T23:30:00Z'), MSK)).toBe(1)
    expect(isoWeekday(new Date('2026-11-22T12:00:00Z'), MSK)).toBe(7)
  })
})
