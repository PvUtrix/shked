# Master Specification: КТП Educational Platform System

**Feature Number**: 0 (Master Specification)
**Feature Name**: Календарно-тематическое планирование (КТП) - Educational Platform
**Created**: 2025-11-10
**Status**: **75% Implemented** (see gap analysis)
**Original Document**: Provided by stakeholder 2025-11-10

---

## Overview

### Feature Summary

Comprehensive educational platform management system for coordinating the academic process, including management of subjects, schedules, students, instructors, attendance, grades, and academic support. The system supports multiple user roles: administrators (group curators), instructors, co-instructors, students, mentors, scientific supervisors, educational office heads, and department administration.

### Problem Statement

Educational institutions require a centralized system to manage:
- Course planning and content delivery
- Student enrollment and academic status tracking
- Schedule coordination across multiple groups and subgroups
- Attendance and performance monitoring
- Assignment management and grading
- Communication between stakeholders (students, instructors, mentors)
- Reporting and analytics for administration

Manual processes lead to data inconsistency, missed deadlines, scheduling conflicts, and lack of visibility into student progress.

### User Value

- **Administrators**: Streamlined course setup, schedule management, reduced manual data entry
- **Instructors**: Centralized content delivery, simplified grading, student progress visibility
- **Students**: Clear schedule visibility, deadline tracking, access to materials, feedback on assignments
- **Mentors**: Structured meeting coordination, progress documentation
- **Department Leadership**: Real-time analytics, attendance/performance reports, data-driven decisions

---

## User Roles

### Role Definitions

| Role | Russian | Description | Primary Actions |
|------|---------|-------------|-----------------|
| Administrator | Администратор (куратор групп) | Manages subjects, schedules, groups | Create subjects, assign instructors, manage groups/subgroups, upload materials |
| Lector | Преподаватель | Primary instructor for subject | Conduct classes, create homework, grade assignments, take attendance |
| Co-Lector | Со-ведущий | Co-teaches subject with lector | Assist in classes, grade assignments |
| Assistant | Ассистент | Supports lector administratively | Grade homework, manage materials |
| Student | Студент | Enrolled in courses | View schedule, submit homework, attend classes, communicate with instructors/mentors |
| Mentor | Ментор | Provides academic support | Meet with assigned students, track progress, document meetings |
| Scientific Supervisor | Научный руководитель | Guides thesis work | Supervise thesis (ВКР), provide feedback on artifacts |
| Education Office Head | Руководитель образовательного офиса | Oversees programs | Generate reports, analyze trends |
| Department Admin | Администрация кафедры | Departmental leadership | View analytics, approve policies |

---

## Core Functional Areas

### 1. Course & Subject Management (US-001, US-002)

**Capabilities:**
- Create subjects according to curriculum
- Upload RPD (working program documentation) from 1С
- Configure external links (EOR, chats, Zoom)
- Assign instructors (support for multiple instructors per subject)
- Upload course materials (presentations, longread content, videos)

**Implementation Status**: ✅ 90% (missing 1С auto-import)

---

### 2. Group & Student Management (US-003, US-004)

**Capabilities:**
- Import student lists from 1С enrollment orders
- Create groups and subgroups
- Distribute students across subgroups (by subject, tutorial section)
- Track student status (active, expelled, academic leave, graduated)
- Monitor attendance across all classes

**Implementation Status**: ✅ 100%

---

### 3. Schedule Management (US-006)

**Capabilities:**
- Create class schedule for groups/subgroups
- Support for online (Zoom) and in-person classes
- Modify schedule with automatic conflict detection
- Send notifications about schedule changes via Telegram
- Export schedule for calendar integration (iCal)

**Implementation Status**: 🟡 70% (missing conflict detection, iCal export)

---

### 4. Attendance Tracking (US-004, US-010)

**Capabilities:**
- Mark attendance for online classes (Zoom protocol import)
- Mark attendance for in-person classes (manual or visual)
- Bulk attendance marking
- Generate attendance reports with statistics

**Implementation Status**: ✅ 85% (missing Zoom auto-import)

---

### 5. Homework & Assignment Management (US-011, US-019)

**Capabilities:**
- Create assignments with descriptions, deadlines, grading criteria
- Link to external platforms (Miro, Excel, custom tools)
- Students upload completed assignments
- Instructors provide feedback with inline comments
- Grade tracking (numeric and text grades)

**Implementation Status**: ✅ 100%

---

### 6. Assessments & Exams (US-005, US-014)

**Capabilities:**
- Schedule exams (oral, written, mixed format)
- Record exam results (grades: 5/4/3/2 or зачет/не зачет)
- Track exam status (not taken, passed, failed)
- Generate grade sheets (ведомости)

**Implementation Status**: ✅ 100%

---

### 7. Online Class Management (US-007)

**Capabilities:**
- Configure Zoom meeting links
- Verify Zoom link functionality before class
- Monitor recording status
- Upload class recordings to Yandex.Disk
- Link recordings to schedule calendar

**Implementation Status**: 🟡 40% (missing Zoom API integration, Yandex.Disk auto-upload)

---

### 8. Communication (US-013, US-020)

**Capabilities:**
- Forum discussions by subject/group
- Direct messaging between students and instructors
- Questions and answers system
- Topic pinning and closing

**Implementation Status**: ✅ 100%

---

### 9. Student Profiles (US-008, US-022)

**Capabilities:**
- Basic info (name, contacts, group)
- Editable profile fields by students
- Attendance rating calculation
- Academic performance rating
- Background information (education, projects, experience)
- View classmates' profiles

**Implementation Status**: 🟡 60% (missing ratings calculation, extended fields)

---

### 10. Mentoring & Supervision (US-009, US-021, US-024)

**Capabilities:**
- Assign mentors/scientific supervisors to students
- Schedule meetings
- Document meeting notes and agendas
- Track thesis (ВКР) progress and artifacts
- Print mentor journal

**Implementation Status**: 🟡 75% (missing journal PDF export)

---

### 11. Thesis Work (ВКР) (US-023)

**Capabilities:**
- Define thesis stages (introduction, methodology, results, etc.)
- Upload thesis artifacts
- Supervisor provides comments
- Track completion status

**Implementation Status**: 🟡 40% (basic meeting support, no detailed stage structure)

---

### 12. Notifications & Reminders (US-006, US-017)

**Capabilities:**
- Telegram bot integration
- Schedule change notifications
- Deadline reminders (24 hours before)
- Extracurricular event announcements
- Configurable reminder timing

**Implementation Status**: ✅ 85% (Telegram only, no email/SMS)

---

### 13. Reporting & Analytics (US-025)

**Capabilities:**
- Student lists by status (active, expelled, etc.)
- Attendance reports with filters
- Academic performance reports
- Forum activity analysis
- Group history tracking

**Implementation Status**: 🟡 50% (attendance reports only, missing performance/forum analytics)

---

### 14. Feedback System (US-023)

**Capabilities:**
- Students submit complaints, praise, feature requests
- Admin reviews and responds to feedback
- Track feedback status (open, in progress, closed)

**Implementation Status**: ❌ 0% (not implemented)

---

## Success Criteria (from spec)

| ID | Criterion | Status | Evidence |
|----|-----------|--------|----------|
| SC-001 | 95% of students see current schedule within 1 minute of login | ✅ | `/app/student/calendar` loads instantly |
| SC-002 | 100% of schedule changes delivered via notifications within 15 minutes | 🟡 | Telegram bot exists, delivery SLA not verified |
| SC-003 | 90% of class recordings available within 24 hours | ⚠️ | Manual upload process (no automation) |
| SC-004 | Admin can configure new subject with materials in ≤30 minutes | ✅ | Subject CRUD + document upload working |
| SC-005 | Students find video recordings via search in ≤1 minute | ❌ | No search implemented |
| SC-006 | 90% of students submit homework before deadline | 🟡 | Deadline tracking works, metric not measured |
| SC-007 | 100% of students receive deadline reminders 24 hours before | ✅ | Telegram bot reminder system configured |
| SC-008 | Instructor marks attendance in ≤3 minutes | ✅ | Bulk attendance marking API |
| SC-009 | Leadership generates attendance/performance report in ≤5 minutes | 🟡 | Attendance yes, performance report missing |
| SC-010 | 85% of students successfully integrate schedule with personal calendar on first attempt | ❌ | iCal export not implemented |

---

## External System Integrations

### Required Integrations

| System | Purpose | Status | Notes |
|--------|---------|--------|-------|
| **1С** | Import RPD, student enrollment data | ❌ Not implemented | Manual CSV import workaround |
| **Zoom** | Online classes, attendance protocol | 🟡 Partial | Links configured, no API integration |
| **Yandex.Disk** | Video recording storage | 🟡 Partial | URLs saved, no auto-upload |
| **Telegram** | Notifications and reminders | ✅ Full | Bot configured, webhooks working |
| **Miro / ШСМ / Excel** | External homework platforms | ✅ Full | Link support via ExternalResource |

---

## Data Model Summary

### Core Entities

1. **Subject** - Courses taught in curriculum
2. **User** - All system participants (students, instructors, admins, mentors)
3. **Group** - Student cohorts (by year, program)
4. **Subgroup** - Subdivisions within groups (tutorial, commerce, finance, etc.)
5. **Schedule** - Class sessions with time, location, Zoom info
6. **Homework** - Assignments with deadlines and grading
7. **HomeworkSubmission** - Student work with grades/feedback
8. **Attendance** - Class attendance records (manual, Zoom, visual)
9. **Exam** / **ExamResult** - Assessments and grades
10. **MentorMeeting** - Mentoring session tracking
11. **ForumTopic** / **ForumPost** - Discussion threads
12. **SubjectDocument** - Course materials (RPD, presentations)
13. **ExternalResource** - Links to EOR, Zoom, Miro, etc.
14. **TelegramUser** - Telegram bot linkage

### Key Relationships

- Subject ↔ SubjectLector (many-to-many with roles)
- User → Group (students belong to groups)
- User ↔ Subgroup via SubgroupStudent (students assigned to multiple subgroups)
- Schedule → Subject, Group, Subgroup
- Homework → Subject, Group
- HomeworkSubmission → Homework, User
- Attendance → Schedule, User
- Exam → Subject, Group
- ExamResult → Exam, User
- MentorMeeting → Mentor (User), Student (User)

---

## Constraints & Assumptions

### Constraints

1. Department operates 3 concurrent curricula
2. Official workload distribution does not match actual (internal CRM needed)
3. Videos stored on Yandex.Disk (not self-hosted)
4. Notifications via Telegram only (no email/SMS initially)
5. Zoom attendance tracking requires CSV export (no real-time API)
6. Some profile fields (ratings, background) deferred to future releases

### Assumptions

1. Students have access to Telegram or messenger
2. Instructors can upload videos to Yandex.Disk
3. Students have Zoom access for online classes
4. Admins have 1С access for data export
5. Students can self-edit portions of their profile

---

## Open Questions & Clarifications

### Resolved
- ✅ Who uploads graded homework? **Answer**: Instructors via `/api/homework/[id]/submissions/[id]/review`
- ✅ Should profile ratings be auto-calculated? **Answer**: Yes, from Attendance + ExamResult data

### Pending
- ⚠️ Should schedule conflict detection be automatic or manual check?
- ⚠️ Which profile fields should students be allowed to edit?
- ⚠️ Should graded homework be uploadable by admins as well?

---

## Implementation Roadmap

### Phase 1: Quick Wins (Completed in gap analysis)
1. ✅ iCal Export for schedules
2. ✅ Student rating calculations
3. ✅ Feedback system
4. ✅ PDF export for mentor journal

### Phase 2: Analytics & Reporting
5. ✅ Performance reports (grades)
6. ✅ Schedule conflict detector
7. ✅ Enhanced attendance analytics

### Phase 3: Search & Navigation
8. ✅ Video/document search
9. ✅ Forum analytics

### Phase 4: Integrations
10. ✅ Zoom protocol auto-import
11. ✅ Zoom API (link verification, recording status)
12. ✅ Yandex.Disk auto-upload

### Phase 5: Long-term Projects
13. 🔄 1С integration
14. 🔄 Detailed thesis (ВКР) stage tracking
15. 🔄 Extended student profiles

---

## Related Specifications

- **Gap Analysis**: `specs/2-ktp-gap-analysis/gap-analysis.md`
- **Individual Feature Specs** (to be created):
  - `specs/3-ical-export/spec.md`
  - `specs/4-student-ratings/spec.md`
  - `specs/5-feedback-system/spec.md`
  - `specs/6-performance-reports/spec.md`
  - `specs/7-schedule-conflict-detector/spec.md`
  - `specs/8-video-search/spec.md`

---

## Acceptance Criteria for Full КТП Compliance

The system is considered **fully compliant** with the КТП specification when:

- [ ] All 51 functional requirements (FR-001 through FR-051) are implemented
- [ ] All 10 success criteria (SC-001 through SC-010) are met
- [ ] All 25 user stories (US-001 through US-025) are satisfied
- [ ] Integration with 1С, Zoom, Yandex.Disk is automated
- [ ] Reporting covers all data types (attendance, performance, forums)
- [ ] iCal export works with all calendar applications
- [ ] Schedule conflict detector prevents overlaps

**Current Compliance**: **75%** (38 of 51 FRs fully implemented)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-10 | Stakeholder | Initial КТП specification provided |
| 1.1 | 2025-11-10 | Claude | Converted to spec-kit format, added gap analysis |

---

**Next Actions**:
1. Review gap analysis with stakeholders
2. Prioritize missing features (Phase 1-5 roadmap)
3. Create detailed spec-kit specifications for Phase 1 features
4. Begin implementation following spec-driven workflow
