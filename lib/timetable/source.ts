import type * as XLSX from 'xlsx'
import { matchCourse, parseDeadlineSheet, parsePlacementSheet, parseTimetableSheet, readWorkbook } from './parse'

const MAX_BYTES = 20 * 1024 * 1024
const GOOGLE_SHEET_RE = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([A-Za-z0-9_-]{20,})/

/**
 * Download a Google Sheet as xlsx. Only docs.google.com spreadsheet links are
 * accepted, so this cannot be pointed at arbitrary hosts. The sheet must be
 * shared with "anyone with the link"; otherwise upload the file instead.
 */
export async function fetchGoogleSheet(url: string): Promise<{ data: ArrayBuffer; sourceRef: string }> {
  const m = GOOGLE_SHEET_RE.exec(url.trim())
  if (!m) throw new SourceError('Only docs.google.com/spreadsheets links are supported.')
  const exportUrl = `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=xlsx`
  const response = await fetch(exportUrl, { redirect: 'follow' })
  const type = response.headers.get('content-type') ?? ''
  if (!response.ok || !/spreadsheetml|octet-stream/.test(type)) {
    throw new SourceError('Could not download the sheet. Share it with "anyone with the link" or upload the file.')
  }
  const data = await response.arrayBuffer()
  if (data.byteLength > MAX_BYTES) throw new SourceError('The sheet is larger than 20 MB.')
  return { data, sourceRef: `https://docs.google.com/spreadsheets/d/${m[1]}` }
}

export class SourceError extends Error {}

export function checkUpload(file: File): void {
  if (file.size > MAX_BYTES) throw new SourceError('The file is larger than 20 MB.')
  if (!/\.xlsx$/i.test(file.name)) throw new SourceError('Upload an .xlsx file (File > Download > Microsoft Excel).')
}

export interface SheetGuess {
  sheets: string[]
  timetable: string | null
  deadlines: string | null
  placement: string | null
  /** Events found per sheet, to help the admin pick. */
  eventCounts: Record<string, number>
}

/**
 * Guess which sheet is the timetable (most events), which the deadline table
 * (most rows whose course column names a course) and which the placement
 * (most subgroup assignments), from their structure alone.
 */
export function guessSheets(wb: XLSX.WorkBook): SheetGuess {
  const eventCounts: Record<string, number> = {}
  let timetable: string | null = null
  for (const name of wb.SheetNames) {
    const n = parseTimetableSheet(wb.Sheets[name]).events.length
    eventCounts[name] = n
    if (n > 0 && (!timetable || n > eventCounts[timetable])) timetable = name
  }
  if (!timetable) return { sheets: wb.SheetNames, timetable: null, deadlines: null, placement: null, eventCounts }

  const parsed = parseTimetableSheet(wb.Sheets[timetable])
  let deadlines: string | null = null
  let deadlineScore = 0
  let placement: string | null = null
  let placementScore = 0
  for (const name of wb.SheetNames) {
    if (name === timetable || eventCounts[name] > 0) continue
    const d = parseDeadlineSheet(wb.Sheets[name], parsed.courses, null).deadlines.filter((x) => matchCourse(x.courseLabel, parsed.courses)).length
    if (d > deadlineScore) {
      deadlineScore = d
      deadlines = name
    }
    const p = parsePlacementSheet(wb.Sheets[name], parsed.courses).placements.reduce((sum, x) => sum + x.assignments.length, 0)
    if (p > placementScore) {
      placementScore = p
      placement = name
    }
  }
  return { sheets: wb.SheetNames, timetable, deadlines, placement, eventCounts }
}

export { readWorkbook }
