# Feature Specification: Attendance Report Export

**Feature Number**: 1
**Feature Name**: Attendance Report Export
**Created**: 2025-11-10
**Status**: Draft
**Branch**: `1-attendance-report-export`

## Overview

### Feature Summary
Enable lectors, mentors, and administrators to export attendance data in CSV format for reporting, analysis, and record-keeping purposes. The export should support flexible filtering by date range, student, group, and subject.

### Problem Statement
Currently, attendance data can only be viewed in the web interface. Educational institutions require exportable attendance records for:
- Administrative reporting to department heads
- Student performance reviews
- Compliance with university attendance policies
- Integration with external analytics tools
- Long-term record archival

### User Value
- **Lectors**: Export attendance for their subjects to track student engagement
- **Mentors**: Generate reports for mentored student groups
- **Administrators**: Create institution-wide attendance analytics
- **Students**: Request their own attendance records for appeals or verification

---

## User Scenarios

### Primary Scenario: Lector Exports Subject Attendance

**Actor**: Lector (role: `lector` or `co-lector`)

**Preconditions**:
- Lector is authenticated and assigned to at least one subject
- Attendance records exist for the subject
- Lector has navigated to the attendance view page

**Main Flow**:
1. Lector selects a subject from their taught subjects list
2. Lector optionally filters by:
   - Date range (from date, to date)
   - Specific group(s) enrolled in the subject
   - Specific student(s) in the group
3. Lector clicks "Export to CSV" button
4. System validates lector has access to the selected subject (via SubjectLector relationship)
5. System queries attendance records matching filters
6. System generates CSV file with columns:
   - Date
   - Subject Name
   - Group Name
   - Student Name
   - Student Email
   - Attendance Status (present/absent/late/excused)
   - Notes (if any)
7. Browser downloads CSV file named `attendance_[subject]_[daterange].csv`

**Postconditions**:
- CSV file contains all matching records
- No data is modified in the database
- Action is logged for audit purposes

**Alternative Flows**:
- **A1**: No records match filters → System returns empty CSV with headers only and shows warning message
- **A2**: Lector not assigned to subject → System returns 403 Forbidden error
- **A3**: Date range invalid (to_date < from_date) → System shows validation error

---

### Secondary Scenario: Admin Exports All Attendance

**Actor**: Administrator (role: `admin`)

**Main Flow**:
1. Admin navigates to admin dashboard → attendance reports section
2. Admin selects export scope:
   - All subjects
   - All groups
   - Custom date range (e.g., semester or academic year)
3. Admin clicks "Export All Attendance"
4. System generates comprehensive CSV including all subjects and groups
5. CSV includes additional admin-level columns:
   - Lector Name(s) for the subject
   - Group ID and metadata
6. Browser downloads `attendance_full_[daterange].csv`

**Authorization**: Only users with `admin` role can export all attendance

---

### Tertiary Scenario: Student Requests Own Attendance

**Actor**: Student (role: `student`)

**Main Flow**:
1. Student navigates to "My Attendance" page
2. Student selects date range (default: current semester)
3. Student clicks "Download My Attendance"
4. System exports CSV containing only that student's records
5. CSV includes columns:
   - Date
   - Subject Name
   - Lector Name
   - Attendance Status
   - Notes from lector

**Privacy**: Students can only access their own attendance data

---

## Functional Requirements

### FR1: Export Endpoint
- **REQ-1.1**: System shall provide an API endpoint `/api/attendance/export` accepting GET requests
- **REQ-1.2**: Endpoint shall support query parameters:
  - `subjectId` (optional): Filter by subject UUID
  - `groupId` (optional): Filter by group UUID
  - `studentId` (optional): Filter by student UUID
  - `fromDate` (optional): ISO 8601 date string (inclusive)
  - `toDate` (optional): ISO 8601 date string (inclusive)
  - `format` (optional): Export format, default `csv` (future: `xlsx`, `json`)
- **REQ-1.3**: Endpoint shall return `Content-Type: text/csv` with proper headers for browser download
- **REQ-1.4**: Endpoint shall return HTTP 200 for successful exports, even if zero records match

### FR2: Authorization Rules
- **REQ-2.1**: Lectors can export attendance for subjects where they appear in SubjectLector table
- **REQ-2.2**: Mentors can export attendance for students in groups they mentor (via User.groupId)
- **REQ-2.3**: Admins can export all attendance without restrictions
- **REQ-2.4**: Students can export only their own attendance records
- **REQ-2.5**: Unauthorized access attempts return HTTP 403 Forbidden

### FR3: Data Formatting
- **REQ-3.1**: CSV shall use comma delimiter with double-quote escaping for fields containing commas/newlines
- **REQ-3.2**: First row shall contain column headers in English
- **REQ-3.3**: Dates shall be formatted as `YYYY-MM-DD`
- **REQ-3.4**: Timestamps (if included) shall be formatted as `YYYY-MM-DD HH:MM:SS` in UTC
- **REQ-3.5**: Status values shall be human-readable: "Present", "Absent", "Late", "Excused"

### FR4: Performance
- **REQ-4.1**: Exports with < 1000 records shall complete within 3 seconds
- **REQ-4.2**: Exports with 1000-10000 records shall complete within 10 seconds
- **REQ-4.3**: Exports with > 10000 records shall be paginated or queued (future enhancement)

### FR5: UI Integration
- **REQ-5.1**: Attendance list page shall display "Export to CSV" button
- **REQ-5.2**: Button shall open export options modal with filter controls
- **REQ-5.3**: Modal shall show loading spinner during export generation
- **REQ-5.4**: Success notification shall appear when download starts
- **REQ-5.5**: Error notifications shall display user-friendly messages for failures

---

## Non-Functional Requirements

### Security
- **NFR-1**: Endpoint must require authentication via NextAuth session
- **NFR-2**: All database queries must use Prisma's parameterized queries (no SQL injection)
- **NFR-3**: Authorization checks must occur before any data retrieval
- **NFR-4**: Exported files must not be cached or logged with sensitive data

### Performance
- **NFR-5**: Database queries must use indexes on `date`, `subjectId`, `groupId`, `studentId`
- **NFR-6**: Memory usage must stay under 100MB for exports < 10K records
- **NFR-7**: Streaming responses should be used for large exports (future)

### Usability
- **NFR-8**: CSV files must be compatible with Excel, Google Sheets, and LibreOffice Calc
- **NFR-9**: Filename must be descriptive and include date range
- **NFR-10**: UI should provide preview of export filters before generation

### Compliance
- **NFR-11**: Export action must be logged with user ID, timestamp, and filters used
- **NFR-12**: Student data export must comply with FERPA/GDPR privacy requirements

---

## Success Criteria

1. **Functional Success**:
   - Lector can export attendance for their subjects with 100% accuracy
   - Admin can export institution-wide attendance
   - Students can access their own records
   - CSV files open correctly in Excel without formatting issues

2. **Performance Success**:
   - 95% of exports complete within 5 seconds
   - No memory errors for exports up to 10,000 records
   - Server CPU usage < 50% during export

3. **Usability Success**:
   - Users complete export workflow in < 30 seconds
   - Zero support tickets about export failures in first month
   - 90% of exports use at least one filter parameter

4. **Security Success**:
   - Zero unauthorized data access incidents
   - All export attempts logged for audit
   - No SQL injection vulnerabilities in security testing

---

## Key Entities

### Database Models Involved

- **Attendance**: Primary data source
  - Fields: id, date, status, notes, createdAt
  - Relations: student (User), subject, group

- **Subject**: For filtering and display
  - Fields: id, name
  - Relations: SubjectLector (many-to-many with User)

- **Group**: For group-level exports
  - Fields: id, name, semester, year
  - Relations: students (User[])

- **User**: Students and lectors
  - Fields: id, name, email, role, groupId
  - Relations: attendance records

---

## Acceptance Criteria

### AC1: Lector Export
- [ ] Given I am a lector assigned to "Algorithms" subject
- [ ] When I navigate to attendance page and click "Export to CSV"
- [ ] Then I receive a CSV file with all attendance records for my subject
- [ ] And the CSV contains correct columns (Date, Subject, Group, Student, Status, Notes)
- [ ] And the filename is `attendance_algorithms_2025-01-01_2025-06-30.csv`

### AC2: Filtered Export
- [ ] Given I am a lector viewing attendance for "Data Structures"
- [ ] When I filter by Group "CS-101" and date range 2025-03-01 to 2025-03-31
- [ ] And I click "Export to CSV"
- [ ] Then the CSV contains only records matching the filters
- [ ] And the CSV has exactly 15 records (matching test fixture data)

### AC3: Authorization Enforcement
- [ ] Given I am a lector NOT assigned to "Physics" subject
- [ ] When I attempt to export attendance for Physics via API: `/api/attendance/export?subjectId=physics-uuid`
- [ ] Then I receive HTTP 403 Forbidden
- [ ] And the response body explains "You do not have access to this subject"

### AC4: Student Self-Export
- [ ] Given I am logged in as student "Ivan Petrov"
- [ ] When I navigate to "My Attendance" and click "Download"
- [ ] Then I receive a CSV with only my attendance records
- [ ] And the CSV does not include other students' data

### AC5: Empty Results Handling
- [ ] Given there are no attendance records for the selected filters
- [ ] When I export with date range 2025-12-01 to 2025-12-31 (future dates)
- [ ] Then I receive a CSV file with headers only
- [ ] And a warning message: "No attendance records found for the specified filters"

### AC6: Error Handling
- [ ] Given the database is temporarily unavailable
- [ ] When I attempt to export attendance
- [ ] Then I see user-friendly error: "Unable to generate report. Please try again."
- [ ] And the error is logged with stack trace for debugging

---

## Assumptions

1. CSV is the primary export format; Excel (.xlsx) is future enhancement
2. Exports are synchronous (< 10 seconds); async job queue is future enhancement
3. All users have stable internet connections for downloads
4. Attendance records are not deleted, only marked inactive (soft delete)
5. Date ranges default to current semester if not specified

---

## Dependencies

- **Internal**:
  - Attendance model exists in Prisma schema with relations to User, Subject, Group
  - NextAuth session provides user role and ID
  - Existing RBAC helper functions for role checks

- **External**:
  - CSV generation library (e.g., `csv-stringify` or native Node.js string building)
  - Date handling library (existing: `date-fns`)

---

## Out of Scope

- Excel (.xlsx) format export
- PDF export with formatted tables
- Scheduled/automated exports
- Email delivery of reports
- Real-time export progress updates
- Export of attendance statistics/aggregates (separate feature)
- Bulk export of multiple subjects in single file
- Import functionality (CSV → Attendance)

---

## Open Questions

None. All requirements are sufficiently clear for planning phase.

---

## Risks

1. **Performance Risk**: Large exports (10K+ records) may timeout
   - **Mitigation**: Implement pagination or async jobs in future iteration

2. **Security Risk**: CSV injection if notes contain formulas
   - **Mitigation**: Sanitize cell values starting with `=`, `+`, `-`, `@`

3. **Usability Risk**: Users may not understand filter options
   - **Mitigation**: Add tooltips and "Reset Filters" button

---

## Revision History

| Version | Date       | Author | Changes           |
|---------|------------|--------|-------------------|
| 1.0     | 2025-11-10 | Claude | Initial draft     |
