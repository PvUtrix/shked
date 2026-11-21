import * as XLSX from 'xlsx'

/**
 * Parser for the programme timetable workbook (one sheet per semester for
 * the timetable, the deadlines and the subgroup placement).
 *
 * Nothing here knows course or subgroup names. The structure is read from
 * the sheet itself:
 * - Legend rows above the timetable name each course in column A and mark,
 *   with merged cells, which columns belong to which of its subgroups. A
 *   marker with a number ("Subgroup 2/Teacher") is a subgroup; an unnumbered
 *   marker over the whole grid means "no subgroups"; an unnumbered marker
 *   over part of the grid is an elective (only enrolled students attend).
 * - Each timetable row has a date in column A and a time ("10:00-12:15") in
 *   the column before the grid. An event cell's merged span says which
 *   subgroups it is for. Its text starts with the course ("Course. Webinar 2")
 *   and may end with an earlier finish, "(... 13:15)".
 */

export type CourseKind = 'whole' | 'split' | 'elective' | 'general'

export interface Band {
  /** Subgroup number; null for a course without subgroups or an elective. */
  number: number | null
  /** Marker text before "/" (e.g. "Subgroup 1"). */
  label: string
  instructor?: string
  fromCol: number
  toCol: number
}

export interface Course {
  /** Row of the legend, for stable ordering. */
  index: number
  name: string
  kind: CourseKind
  bands: Band[]
}

export interface TimetableEvent {
  /** 1-based sheet row, for traceability. */
  row: number
  /** Calendar date, YYYY-MM-DD. */
  date: string
  allDay: boolean
  start: string
  end: string
  course: Course
  /** The subgroup bands it is for; null when it is for the whole course. */
  band: Band | null
  title: string
  meetingUrl?: string
}

export interface ParsedTimetable {
  courses: Course[]
  generalCourse: Course | null
  events: TimetableEvent[]
  warnings: string[]
}

export interface ParsedDeadline {
  row: number
  date: string
  number: number | null
  course: Course | null
  courseLabel: string
  text: string
  links: string[]
}

export interface ParsedPlacement {
  row: number
  studentName: string
  /** Course -> subgroup number (split courses) or true (elective enrolment). */
  assignments: Array<{ course: Course; number: number | null }>
  unknownColumns: string[]
}

type Sheet = XLSX.WorkSheet

const URL_RE = /https?:\/\/[^\s"'<>]+/g
const TIME_RANGE_RE = /(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})/
/** "(until 13:15)" in any language: a parenthesis that ends with a time. */
const EARLY_END_RE = /\(([^()]*?)(\d{1,2}):(\d{2})\)\s*$/

export function readWorkbook(data: ArrayBuffer | Buffer): XLSX.WorkBook {
  return XLSX.read(data, { cellNF: true })
}

function cell(ws: Sheet, r: number, c: number): XLSX.CellObject | undefined {
  return ws[XLSX.utils.encode_cell({ r, c })]
}

function text(ws: Sheet, r: number, c: number): string {
  const v = cell(ws, r, c)?.v
  return v == null ? '' : String(v).replace(/\s+/g, ' ').trim()
}

/** YYYY-MM-DD when the cell holds a date, else null. */
function dateOf(ws: Sheet, r: number, c: number): string | null {
  const x = cell(ws, r, c)
  if (!x) return null
  if (x.t === 'n' && x.z && XLSX.SSF.is_date(x.z as string)) {
    const d = XLSX.SSF.parse_date_code(x.v as number)
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
  }
  if (x.t === 'd' && x.v instanceof Date) return x.v.toISOString().slice(0, 10)
  if (x.t === 's') {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(x.v)) ?? /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(x.v))
    if (m) return m[1].length === 4 ? `${m[1]}-${m[2]}-${m[3]}` : `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }
  return null
}

function hhmm(h: string | number, m: string | number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** The merged range a cell starts, or a one-cell range. */
function spanAt(ws: Sheet, r: number, c: number): { fromCol: number; toCol: number } {
  for (const m of ws['!merges'] ?? []) {
    if (m.s.r === r && m.s.c === c) return { fromCol: m.s.c, toCol: m.e.c }
  }
  return { fromCol: c, toCol: c }
}

/** Is (r, c) covered by a merge that starts elsewhere? */
function coveredByMerge(ws: Sheet, r: number, c: number): boolean {
  return (ws['!merges'] ?? []).some((m) => r >= m.s.r && r <= m.e.r && c >= m.s.c && c <= m.e.c && !(m.s.r === r && m.s.c === c))
}

function sheetRange(ws: Sheet) {
  return XLSX.utils.decode_range(ws['!ref'] ?? 'A1:A1')
}

// ---------------------------------------------------------------------------
// Course matching

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/\u0451/g, '\u0435') // yo -> ye
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function bigrams(s: string): Map<string, number> {
  const out = new Map<string, number>()
  const t = s.replace(/\s+/g, ' ')
  for (let i = 0; i < t.length - 1; i++) {
    const g = t.slice(i, i + 2)
    out.set(g, (out.get(g) ?? 0) + 1)
  }
  return out
}

/** Dice similarity of two strings (0..1). */
export function similarity(a: string, b: string): number {
  const A = bigrams(a)
  const B = bigrams(b)
  let overlap = 0
  let total = 0
  for (const [g, n] of A) {
    overlap += Math.min(n, B.get(g) ?? 0)
    total += n
  }
  for (const n of B.values()) total += n
  return total === 0 ? 0 : (2 * overlap) / total
}

/**
 * Which course a label ("Finance", "Tutorial", "Stats thinking") refers to.
 * Exact or contained names win; otherwise the closest name by bigram
 * similarity, against the full name and any part in parentheses.
 */
export function matchCourse(label: string, courses: Course[]): Course | null {
  const p = normalise(label)
  if (!p) return null
  let best: { course: Course; score: number } | null = null
  for (const course of courses) {
    const full = normalise(course.name)
    const parts = [full, ...[...course.name.matchAll(/\(([^)]+)\)/g)].map((m) => normalise(m[1]))]
    let score = 0
    for (const n of parts) {
      if (n === p) score = Math.max(score, 1)
      else if (n.startsWith(p + ' ') || n.endsWith(' ' + p) || n.includes(' ' + p + ' ')) score = Math.max(score, 0.95)
      else if (p.startsWith(n)) score = Math.max(score, 0.9)
      else score = Math.max(score, similarity(p, n))
    }
    if (!best || score > best.score) best = { course, score }
  }
  return best && best.score >= 0.75 ? best.course : null
}

// ---------------------------------------------------------------------------
// Timetable

/** Parse "Subgroup 2/Teacher Name" into its number, label and instructor. */
function parseMarker(raw: string): { number: number | null; label: string; instructor?: string } {
  const [head, ...rest] = raw.split('/')
  const instructor = rest.join('/').trim() || undefined
  const num = /(\d+)/.exec(head)
  return { number: num ? Number(num[1]) : null, label: head.trim(), instructor }
}

export function parseTimetableSheet(ws: Sheet): ParsedTimetable {
  const warnings: string[] = []
  const range = sheetRange(ws)

  // The first row whose column A is a date starts the timetable.
  let firstEventRow = -1
  for (let r = range.s.r; r <= range.e.r; r++) {
    if (dateOf(ws, r, 0)) {
      firstEventRow = r
      break
    }
  }
  if (firstEventRow < 0) return { courses: [], generalCourse: null, events: [], warnings: ['No dated rows found.'] }
  const headerRow = firstEventRow - 1

  // Legend: rows above the header with a name in A and markers to the right.
  const legend: Array<{ r: number; name: string; markers: Array<{ raw: string; fromCol: number; toCol: number }> }> = []
  for (let r = range.s.r; r < headerRow; r++) {
    const name = text(ws, r, 0)
    if (!name) continue
    const markers: Array<{ raw: string; fromCol: number; toCol: number }> = []
    for (let c = 1; c <= range.e.c; c++) {
      if (coveredByMerge(ws, r, c)) continue
      const span = spanAt(ws, r, c)
      const raw = text(ws, r, c)
      // A label-less merge across the grid still marks a (general) course.
      if (raw || span.toCol > span.fromCol) markers.push({ raw, ...span })
    }
    // The title row is one cell merged across the whole sheet with no markers.
    const aSpan = spanAt(ws, r, 0)
    if (markers.length === 0 && aSpan.toCol >= range.e.c - 1) continue
    legend.push({ r, name, markers })
  }

  const markerCols = legend.flatMap((l) => l.markers.flatMap((m) => [m.fromCol, m.toCol]))
  if (markerCols.length === 0) return { courses: [], generalCourse: null, events: [], warnings: ['No course legend found above the timetable.'] }
  const gridFrom = Math.min(...markerCols)
  const gridTo = Math.max(...markerCols)
  const timeCol = gridFrom - 1

  let generalCourse: Course | null = null
  const courses: Course[] = []
  for (const l of legend) {
    const labelled = l.markers.filter((m) => m.raw)
    if (labelled.length === 0) {
      // A course row without any marker text: general and admin events.
      generalCourse = { index: l.r, name: l.name, kind: 'general', bands: [{ number: null, label: '', fromCol: gridFrom, toCol: gridTo }] }
      continue
    }
    const bands: Band[] = labelled.map((m) => ({ ...parseMarker(m.raw), fromCol: m.fromCol, toCol: m.toCol }))
    const numbered = bands.filter((b) => b.number !== null)
    let kind: CourseKind
    if (numbered.length > 0) {
      kind = 'split'
      // Bands are contiguous: each runs to the column before the next one.
      const sorted = [...numbered].sort((a, b) => a.fromCol - b.fromCol)
      sorted.forEach((b, i) => {
        b.toCol = Math.max(b.toCol, i + 1 < sorted.length ? sorted[i + 1].fromCol - 1 : gridTo)
      })
    } else if (bands.length === 1 && bands[0].fromCol <= gridFrom && bands[0].toCol >= gridTo) {
      kind = 'whole'
    } else {
      kind = 'elective'
    }
    courses.push({ index: l.r, name: l.name, kind, bands: numbered.length > 0 ? numbered : bands.slice(0, 1) })
  }

  const events: TimetableEvent[] = []
  for (let r = firstEventRow; r <= range.e.r; r++) {
    const date = dateOf(ws, r, 0)
    if (!date) continue
    const timeText = text(ws, r, timeCol)
    const tm = TIME_RANGE_RE.exec(timeText)
    const allDay = !tm
    const rowStart = tm ? hhmm(tm[1], tm[2]) : '00:00'
    const rowEnd = tm ? hhmm(tm[3], tm[4]) : '23:59'

    // A link in any column right of the grid is the meeting link.
    let meetingUrl: string | undefined
    for (let c = gridTo + 1; c <= range.e.c; c++) {
      const url = text(ws, r, c).match(URL_RE)?.[0]
      if (url) meetingUrl = url
    }

    for (let c = gridFrom; c <= gridTo; c++) {
      if (coveredByMerge(ws, r, c)) continue
      const raw = text(ws, r, c)
      if (!raw) continue
      const span = spanAt(ws, r, c)

      let end = rowEnd
      let title = raw
      const early = EARLY_END_RE.exec(raw)
      if (early && !allDay) {
        end = hhmm(early[2], early[3])
        title = raw.slice(0, early.index).trim()
      }

      const label = title.includes('.') ? title.slice(0, title.indexOf('.')) : title
      const course = matchCourse(label, courses) ?? generalCourse
      if (!course) {
        warnings.push(`Row ${r + 1}: "${title}" matches no course and there is no general row; skipped.`)
        continue
      }

      const base = { row: r + 1, date, allDay, start: rowStart, end, course, title, meetingUrl }
      if (course.kind === 'split') {
        const covered = course.bands.filter((b) => b.fromCol <= span.toCol && b.toCol >= span.fromCol)
        if (covered.length === 0) {
          warnings.push(`Row ${r + 1}: "${title}" lies outside every subgroup column of "${course.name}"; shown to the whole group.`)
          events.push({ ...base, band: null })
        } else if (covered.length === course.bands.length) {
          events.push({ ...base, band: null })
        } else {
          for (const band of covered) events.push({ ...base, band })
        }
      } else if (course.kind === 'elective') {
        events.push({ ...base, band: course.bands[0] })
      } else {
        events.push({ ...base, band: null })
      }
    }
  }

  return { courses, generalCourse, events, warnings }
}

// ---------------------------------------------------------------------------
// Deadlines

export function parseDeadlineSheet(ws: Sheet, courses: Course[], generalCourse: Course | null): { deadlines: ParsedDeadline[]; warnings: string[] } {
  const range = sheetRange(ws)
  const deadlines: ParsedDeadline[] = []
  const warnings: string[] = []
  for (let r = range.s.r; r <= range.e.r; r++) {
    const date = dateOf(ws, r, 0)
    if (!date) continue
    const numText = text(ws, r, 1)
    const courseLabel = text(ws, r, 2)
    const body = String(cell(ws, r, 3)?.v ?? '').trim()
    if (!body && !courseLabel) continue
    const course = matchCourse(courseLabel, courses) ?? generalCourse
    if (!course) warnings.push(`Deadline row ${r + 1}: "${courseLabel}" matches no course.`)
    deadlines.push({
      row: r + 1,
      date,
      number: /^\d+(\.0+)?$/.test(numText) ? Number(numText) : null,
      course,
      courseLabel,
      text: body,
      links: [...new Set(body.match(URL_RE) ?? [])].map((u) => u.replace(/[).,;]+$/, '')),
    })
  }
  return { deadlines, warnings }
}

// ---------------------------------------------------------------------------
// Placement (who is in which subgroup)

export function parsePlacementSheet(ws: Sheet, courses: Course[]): { placements: ParsedPlacement[]; warnings: string[] } {
  const range = sheetRange(ws)
  const warnings: string[] = []
  const headerRow = range.s.r
  const columns: Array<{ c: number; course: Course | null; header: string }> = []
  for (let c = 1; c <= range.e.c; c++) {
    const header = text(ws, headerRow, c)
    if (!header) continue
    columns.push({ c, header, course: matchCourse(header, courses) })
  }

  const placements: ParsedPlacement[] = []
  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const studentName = text(ws, r, 0)
    if (!studentName) continue
    const assignments: ParsedPlacement['assignments'] = []
    const unknownColumns: string[] = []
    for (const col of columns) {
      const value = text(ws, r, col.c)
      if (!value) continue
      const n = /^(\d+)(\.0+)?$/.exec(value)
      if (n && col.course?.kind === 'split') {
        assignments.push({ course: col.course, number: Number(n[1]) })
        continue
      }
      // A course name in the cell: enrolment in that elective (or course).
      const named = matchCourse(value, courses)
      if (named && named.kind === 'elective') {
        assignments.push({ course: named, number: null })
      } else if (n && !col.course) {
        unknownColumns.push(col.header)
      }
    }
    placements.push({ row: r + 1, studentName, assignments, unknownColumns })
  }
  const unknown = new Set(placements.flatMap((p) => p.unknownColumns))
  if (unknown.size > 0) warnings.push(`Placement columns with subgroup numbers that match no course: ${[...unknown].join(', ')}.`)
  return { placements, warnings }
}
