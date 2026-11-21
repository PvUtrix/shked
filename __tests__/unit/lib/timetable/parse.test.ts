import { describe, it, expect } from '@jest/globals'
import { matchCourse, parseDeadlineSheet, parsePlacementSheet, parseTimetableSheet, readWorkbook, similarity } from '@/lib/timetable/parse'
import { submissionChannelOf } from '@/lib/timetable/apply'
import { buildTimetableWorkbookBytes } from '../../../fixtures/timetable-workbook'

// Round-trip through xlsx bytes, as an uploaded file would be read.
const buildWorkbook = () => readWorkbook(buildTimetableWorkbookBytes())

describe('lib/timetable/parse', () => {
  const wb = buildWorkbook()
  const tt = parseTimetableSheet(wb.Sheets.Timetable)
  const byName = (name: string) => tt.courses.find((c) => c.name.startsWith(name))!

  it('reads courses and their subgroup columns from the legend', () => {
    expect(tt.warnings).toEqual([])
    expect(byName('Venture').kind).toBe('split')
    expect(byName('Venture').bands.map((b) => [b.number, b.fromCol, b.toCol])).toEqual([[1, 3, 6], [2, 7, 10], [3, 11, 14], [4, 15, 18]])
    expect(byName('Statistical').bands.map((b) => [b.number, b.fromCol, b.toCol])).toEqual([[1, 3, 7], [2, 8, 13], [3, 14, 18]])
    expect(byName('Finance').bands[0].instructor).toBe('Ed Fox')
    expect(byName('Branding').kind).toBe('whole')
    expect(byName('Systems').kind).toBe('elective')
    expect(byName('Internet').kind).toBe('elective')
    expect(tt.generalCourse?.name).toBe('Institute events')
  })

  it('places each event on its subgroups, with an earlier end and the meeting link', () => {
    const row13 = tt.events.filter((e) => e.row === 13)
    const finance = row13.find((e) => e.course.name.startsWith('Finance'))!
    expect(finance).toMatchObject({ date: '2026-09-19', start: '11:00', end: '13:15', title: 'Finance and investment. Webinar 1', meetingUrl: 'https://meet.example.test/abc' })
    expect(finance.band?.number).toBe(1)
    const tutorials = row13.filter((e) => e.course.name.startsWith('Venture')).map((e) => [e.band?.number, e.end])
    expect(tutorials).toEqual([[3, '13:55'], [4, '13:55']])
  })

  it('matches a misspelt course name and splits per subgroup', () => {
    const stats = tt.events.filter((e) => e.row === 14)
    expect(stats.map((e) => [e.course.name, e.band?.number])).toEqual([
      ['Statistical thinking', 1],
      ['Statistical thinking', 2],
      ['Statistical thinking', 3],
    ])
  })

  it('treats a cell across every subgroup as a whole-group class', () => {
    const topic = tt.events.find((e) => e.row === 15)!
    expect(topic.course.name).toMatch(/^Venture/)
    expect(topic.band).toBeNull()
  })

  it('sends elective classes to the elective only, and unknown events to the general row', () => {
    const electives = tt.events.filter((e) => e.row === 16)
    expect(electives.map((e) => [e.course.name, e.course.kind, e.band?.number ?? null])).toEqual([
      ['Systems engineering', 'elective', null],
      ['Internet of things', 'elective', null],
    ])
    const fest = tt.events.find((e) => e.row === 12)!
    expect(fest).toMatchObject({ allDay: true, start: '00:00', end: '23:59', band: null })
    expect(fest.course).toBe(tt.generalCourse)
  })

  it('reads deadlines with their course and links', () => {
    const { deadlines, warnings } = parseDeadlineSheet(wb.Sheets.Deadlines, tt.courses, tt.generalCourse)
    expect(warnings).toEqual([])
    expect(deadlines.map((d) => [d.date, d.number, d.course?.name])).toEqual([
      ['2026-09-18', 1, 'Finance and investment'],
      ['2026-10-10', 2, 'Venture development (Tutorial)'],
      ['2026-10-03', 1, 'Internet of things'],
      ['2026-09-30', null, 'Institute events'],
    ])
    expect(deadlines[0].links).toEqual(['https://forms.gle/abc123'])
  })

  it('reads the placement: subgroup numbers and elective enrolment', () => {
    const { placements } = parsePlacementSheet(wb.Sheets.Placement, tt.courses)
    expect(placements[0].studentName).toBe('Doe John Paul')
    expect(placements[0].assignments.map((a) => [a.course.name, a.number])).toEqual([
      ['Finance and investment', 1],
      ['Venture development (Tutorial)', 3],
      ['Systems engineering', null],
      ['Statistical thinking', 2],
    ])
  })
})

describe('course matching and submission channels', () => {
  it('scores similar names highly and unrelated ones low', () => {
    expect(similarity('statistical thinking', 'statistcal thinking')).toBeGreaterThan(0.8)
    expect(similarity('finance', 'branding')).toBeLessThan(0.4)
    expect(matchCourse('Fest', [])).toBeNull()
  })

  it('names where a link says to submit', () => {
    expect(submissionChannelOf('https://forms.gle/abc')).toBe('FORM')
    expect(submissionChannelOf('https://docs.google.com/forms/d/e/x/viewform')).toBe('FORM')
    expect(submissionChannelOf('https://drive.google.com/drive/folders/1')).toBe('DRIVE')
    expect(submissionChannelOf('https://disk.yandex.ru/i/x')).toBe('YANDEX_DISK')
    expect(submissionChannelOf('https://telemost.360.yandex.ru/join#x')).toBe('CHAT')
    expect(submissionChannelOf(undefined)).toBeNull()
  })
})
