import * as XLSX from 'xlsx'

/**
 * A synthetic workbook shaped like the programme spreadsheet: a legend that
 * maps subgroups to columns D..S with merged cells, dated rows below it, a
 * deadline table and a placement table. Names are invented.
 */

const D = 3 // first grid column (D)
const S = 18 // last grid column (S)
const serial = (y: number, m: number, d: number) => (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000

/** The first timetable date; every other date keeps its distance from it. */
const ORIGINAL_START = '2026-09-05'
let shiftDays = 0

function sheetFrom(rows: Array<Array<string | number | null>>, merges: XLSX.Range[], dateRows: Array<[number, string]> = []) {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!merges'] = merges
  for (const [r, iso] of dateRows) {
    const [y, m, d] = iso.split('-').map(Number)
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = { t: 'n', v: serial(y, m, d) + shiftDays, z: 'dd/mm/yy' }
  }
  return ws
}

const span = (r: number, c1: number, c2: number): XLSX.Range => ({ s: { r, c: c1 }, e: { r, c: c2 } })
const row = (cells: Record<number, string | number>): Array<string | number | null> => {
  const out: Array<string | number | null> = new Array(S + 2).fill(null)
  for (const [c, v] of Object.entries(cells)) out[Number(c)] = v
  return out
}

/**
 * The workbook as xlsx bytes. `startDate` (YYYY-MM-DD) moves every date so
 * the first class falls on it, for tests that need upcoming dates.
 */
export function buildTimetableWorkbookBytes(startDate: string = ORIGINAL_START): Buffer {
  const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86400000
  shiftDays = day(startDate) - day(ORIGINAL_START)
  const timetable = sheetFrom(
    [
      row({}),
      row({ 0: 'Timetable, semester 3' }),
      row({}),
      row({ 0: 'Venture development (Tutorial)', [D]: 'Subgroup 1/Ann Lee', 7: 'Subgroup 2/Bo Chen', 11: 'Subgroup 3/Cy Dahl', 15: 'Subgroup 4/Di Eve' }),
      row({ 0: 'Finance and investment', [D]: 'Subgroup 1/Ed Fox', 11: 'Subgroup 2/Ed Fox' }),
      row({ 0: 'Statistical thinking', [D]: 'Subgroup 1/Fay Gu', 8: 'Subgroup 2/Gil Ho', 14: 'Subgroup 3/Hal Ito' }),
      row({ 0: 'Branding in innovation', [D]: 'No subgroups/Ivy Jo' }),
      row({ 0: 'Systems engineering', [D]: 'Elective/Jay Ko' }),
      row({ 0: 'Internet of things', 11: 'Elective/Kim Lu' }),
      row({ 0: 'Institute events' }),
      row({ 0: 'Date', 1: 'Day', 2: 'Time', [D]: 'Subject' }),
      row({ 1: 6, 2: 'all day', [D]: 'Fest.Tech 2026' }),
      row({ 1: 6, 2: '11:00-13:55', [D]: 'Finance and investment. Webinar 1 (until 13:15)', 11: 'Tutorial. Review 1', 15: 'Tutorial. Review 1', 19: 'https://meet.example.test/abc' }),
      row({ 1: 7, 2: '10:00-12:55', [D]: 'Statistcal thinking. Webinar 1', 8: 'Statistcal thinking. Webinar 1', 14: 'Statistcal thinking. Webinar 1' }),
      row({ 1: 7, 2: '14:00-16:55', [D]: 'Tutorial. Topic 2' }),
      row({ 1: 6, 2: '16:05-18:20', [D]: 'Systems engineering. Webinar 1', 11: 'Internet of things. Consultation 1' }),
      row({ 1: 6, 2: '10:00-12:00', [D]: 'Branding in innovation.' }),
    ],
    [
      span(1, 0, S),
      span(3, D, 6), span(3, 7, 10), span(3, 11, 14), span(3, 15, S),
      span(4, D, 10), span(4, 11, S),
      span(5, D, 7), span(5, 8, 13), span(5, 14, S),
      span(6, D, S),
      span(7, D, 10),
      span(8, 11, S),
      span(9, D, S),
      span(11, D, S),
      span(12, D, 10), span(12, 11, 14), span(12, 15, S),
      span(13, D, 7), span(13, 8, 13), span(13, 14, S),
      span(14, D, S),
      span(15, D, 10), span(15, 11, S),
      span(16, D, S),
    ],
    [[11, '2026-09-05'], [12, '2026-09-19'], [13, '2026-09-27'], [14, '2026-10-04'], [15, '2026-09-26'], [16, '2026-10-10']]
  )

  const deadlines = sheetFrom(
    [
      ['Date', 'No.', 'Subject', 'Task'],
      [null, 1, 'Finance and investment', 'HW 1: https://forms.gle/abc123 '],
      [null, 2, 'Tutorial', 'HW 2: partner selection'],
      [null, 1, 'Internet of things', 'Intro task: https://disk.yandex.ru/i/xyz'],
      [null, null, 'General', 'Upload the project passport: https://drive.google.com/drive/folders/f1'],
    ],
    [],
    [[1, '2026-09-18'], [2, '2026-10-10'], [3, '2026-10-03'], [4, '2026-09-30']]
  )

  const placement = sheetFrom(
    [
      ['Student', 'Finance and investment', 'Tutorial', 'Elective', 'Statistical thinking'],
      ['Doe John Paul', 1, 3, 'Systems engineering', 2],
      ['Roe Jane', 2, 1, 'Internet of things', 3],
    ],
    []
  )

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, timetable, 'Timetable')
  XLSX.utils.book_append_sheet(wb, deadlines, 'Deadlines')
  XLSX.utils.book_append_sheet(wb, placement, 'Placement')
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

