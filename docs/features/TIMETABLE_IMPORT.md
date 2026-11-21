# Timetable import, deadlines and the calendar feed

The programme office keeps the timetable in a spreadsheet: one sheet with the
classes, one with the homework deadlines and one with the subgroup placement.
Shked imports that workbook and becomes the one place students check. A
re-import updates what changed and records it, and every student's calendar
follows without anyone editing it by hand.

## Importing (admin, education office)

`/admin/timetable`:

1. Upload the workbook (`.xlsx`) or paste a Google Sheets link. A link works
   only if the sheet is shared with "anyone with the link"; otherwise use
   File → Download → Microsoft Excel and upload the file.
2. Check the guessed sheets (timetable, deadlines, placement), the group and
   the semester number.
3. **Preview changes** runs the import without writing anything and lists
   what would be added, changed or removed, the subjects and subgroups it
   would create, students it could not match, and warnings.
4. **Apply** writes it.

API: `POST /api/admin/timetable/import` (multipart), modes `inspect`,
`preview` and `apply`. Code: `lib/timetable/` (`parse.ts` reads the workbook,
`apply.ts` writes the diff, `source.ts` fetches and guesses sheets).

## How the workbook is read

Nothing in the code names a course or a subgroup; the importer reads the
structure the sheet already has.

- **Legend.** Above the timetable, one row per course: the course name in
  column A and, to the right, merged cells marking which columns belong to
  which subgroup ("Subgroup 2/Teacher"). A marker with a number is a
  subgroup; an unnumbered marker across the whole grid means the course has
  no subgroups; an unnumbered marker across part of the grid is an elective,
  which becomes a subgroup that enrolled students belong to. A row with a
  merged but empty marker holds general events.
- **Classes.** Each row below the header has a date in column A and a time
  ("10:00-12:15", or anything else for an all-day event) just left of the
  grid. A cell's merged span says which subgroups the class is for; a cell
  across all of a course's subgroups is for the whole group. The text before
  the first full stop names the course; spelling slips are tolerated. A
  trailing "(... 13:15)" is an earlier end. A link right of the grid is the
  meeting link.
- **Deadlines.** Rows with a date, a number, a course and the task text;
  links in the text become the submission target, and its host sets the
  channel (form, Google Drive, Yandex Disk, chat).
- **Placement.** One row per student: a subgroup number per split course, or
  the name of the elective they chose. Students are matched by full name to
  the group's student accounts; unmatched names are listed in the preview.

## What a re-import does

Every imported class and deadline has a stable key (course, subgroup, title
and occurrence), so importing the edited sheet again:

- updates entries whose date, time or link changed;
- adds new ones;
- deactivates entries that left the sheet (nothing is deleted);
- records each change as an **announcement** with the sheet as its source,
  except on a semester's first import;
- sends a bot notification about each added or changed class to the
  students who see it (form field `notify=false` turns this off).

Students see the last two weeks of changes on `/student/deadlines`.

## Deadlines

`Deadline` is a first-class record: due date, subject, the subgroup or
elective it applies to (none means everyone in the group), the submission
channel and target, an optional file-naming rule, links, and where it came
from. `/student/deadlines` lists a student's open deadlines.

## Personal calendar feed

On `/student/calendar` a student gets a personal subscription link
(`/api/calendar/<token>`) to add to Google Calendar, Apple Calendar or
Outlook. It carries the classes they see (whole-group plus their subgroups)
and their deadlines as all-day events, from 60 days back to a year ahead.
The token is the only credential, because calendar apps cannot sign in; the
student can replace it, which stops the old link. Times are written in UTC,
computed from the timetable's wall-clock times in `APP_TIME_ZONE`.
