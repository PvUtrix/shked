# Feature Specification: iCal Schedule Export

**Feature Number**: 3
**Feature Name**: iCal/ICS Schedule Export for Calendar Integration
**Created**: 2025-11-10
**Status**: Draft
**Priority**: 🔴 High (Phase 1 - Quick Win)
**Parent Spec**: КТП Master Specification (US-016, FR-022, SC-010)

---

## Overview

### Feature Summary

Enable students, instructors, and mentors to export their personalized schedules in iCal/ICS format for integration with Google Calendar, Apple Calendar, Outlook, and other calendar applications. Users should be able to subscribe to a live calendar feed that automatically updates when schedules change.

### Problem Statement

Currently, students must manually check the web interface for schedule information. This leads to:
- Missed classes due to forgotten schedule checks
- Manual calendar entry (error-prone, time-consuming)
- No automatic updates when schedules change
- Inability to overlay academic schedule with personal commitments

According to SC-010, **85% of students should successfully integrate schedule with personal calendar on first attempt**.

### User Value

- **Students**: One-click calendar integration, automatic schedule updates, mobile notifications for upcoming classes
- **Instructors**: Simplified schedule visibility across multiple subjects/groups
- **Mentors**: Combined view of student meetings + academic schedule
- **Administrators**: Reduced support requests about schedule access

---

## User Scenarios

### Primary Scenario: Student Subscribes to Personal Schedule

**Actor**: Student (role: `student`)

**Preconditions**:
- Student is authenticated
- Student is assigned to a group/subgroup
- Schedule entries exist for student's subgroup

**Main Flow**:
1. Student navigates to "My Calendar" page (`/student/calendar`)
2. Student clicks "Subscribe to Calendar" button
3. System generates personalized iCal subscription URL (authenticated)
4. Student selects calendar application (Google Calendar, Apple Calendar, Outlook, Other)
5. System displays step-by-step integration instructions for selected app
6. Student copies subscription URL or clicks "Open in Calendar App" button
7. Calendar app imports events from subscription URL
8. Student sees all classes with:
   - Class title (Subject name + type: lecture/tutorial/exam)
   - Start/end time
   - Location (for in-person) or Zoom link (for online)
   - Description with instructor names, homework due dates
   - Event type category (class, exam, mentor meeting)

**Postconditions**:
- Calendar automatically syncs every 1-4 hours (calendar app dependent)
- When admin changes schedule, student's calendar updates within sync interval
- Subscription remains active until student unsubscribes

**Alternative Flows**:
- **A1**: Student has no upcoming classes → Calendar shows empty state with message "No classes scheduled"
- **A2**: Subscription URL expires (after 1 year) → System sends renewal reminder via Telegram
- **A3**: Student changes subgroup → Subscription URL remains valid, automatically shows new subgroup schedule

---

### Secondary Scenario: Instructor Exports Subject Schedule

**Actor**: Instructor (role: `lector`, `co_lecturer`, `assistant`)

**Main Flow**:
1. Instructor navigates to "My Schedule" page (`/lector/schedule`)
2. Instructor optionally filters by specific subject
3. Instructor clicks "Export to Calendar"
4. System generates iCal file with all classes for instructor's subjects
5. Browser downloads `schedule_[instructor-name]_[date].ics` file
6. Instructor imports file into calendar app (one-time import, not subscription)

**Difference from student scenario**: One-time export (`.ics` file download) vs. subscription feed

---

### Tertiary Scenario: Mentor Exports Combined Schedule

**Actor**: Mentor (role: `mentor`)

**Main Flow**:
1. Mentor navigates to "Mentor Dashboard"
2. Mentor clicks "Export My Schedule"
3. System generates iCal including:
   - Scheduled mentor meetings (`MentorMeeting` model)
   - Classes for groups they mentor
4. Mentor downloads `.ics` file

---

## Functional Requirements

### FR-3.1: Subscription Feed Generation
- **REQ-3.1.1**: System SHALL provide endpoint `/api/schedules/export/ical/subscribe` accepting authenticated user token
- **REQ-3.1.2**: Endpoint SHALL return `Content-Type: text/calendar; charset=utf-8`
- **REQ-3.1.3**: Endpoint SHALL support query parameter `?user=[userId]&token=[auth_token]` for authentication
- **REQ-3.1.4**: Subscription feed SHALL update in real-time (no caching beyond 5 minutes)
- **REQ-3.1.5**: System SHALL generate unique, non-guessable subscription URLs (HMAC-SHA256 signed tokens)

### FR-3.2: One-Time Export
- **REQ-3.2.1**: System SHALL provide endpoint `/api/schedules/export/ical` for one-time export
- **REQ-3.2.2**: Endpoint SHALL support filters: `subjectId`, `groupId`, `fromDate`, `toDate`, `userId`
- **REQ-3.2.3**: Endpoint SHALL return downloadable `.ics` file with `Content-Disposition: attachment`

### FR-3.3: iCal Event Formatting
- **REQ-3.3.1**: Each Schedule entry SHALL map to iCal `VEVENT` with:
  - `UID`: Unique identifier (Schedule.id + domain)
  - `SUMMARY`: Subject name + event type (e.g., "Algorithms - Lecture")
  - `DESCRIPTION`: Instructor names, Zoom link (if online), homework info
  - `DTSTART`: ISO 8601 datetime in UTC
  - `DTEND`: Calculated from startTime + duration
  - `LOCATION`: `Schedule.location` (in-person) or "Online (Zoom)" with link
  - `CATEGORIES`: "CLASS", "EXAM", "MENTOR_MEETING"
  - `STATUS`: "CONFIRMED" (for scheduled), "CANCELLED" (for cancelled classes)
  - `SEQUENCE`: Increment on schedule change (for update detection)
  - `LAST-MODIFIED`: Timestamp of last schedule update
- **REQ-3.3.2**: Exam entries (`Exam` model) SHALL be included with `SUMMARY`: "Exam: [Subject]"
- **REQ-3.3.3**: Mentor meetings SHALL be included with `SUMMARY`: "Mentor Meeting: [Mentor Name]"

### FR-3.4: Authorization
- **REQ-3.4.1**: Students can export only their own schedule (filtered by `User.groupId` + subgroups)
- **REQ-3.4.2**: Instructors can export schedules for subjects they teach (via `SubjectLector`)
- **REQ-3.4.3**: Mentors can export schedules for groups they mentor
- **REQ-3.4.4**: Admins can export any schedule without restrictions
- **REQ-3.4.5**: Unauthenticated requests to subscription feed SHALL return HTTP 401

### FR-3.5: UI Integration
- **REQ-3.5.1**: "My Calendar" page SHALL display "Subscribe to Calendar" button
- **REQ-3.5.2**: Clicking button SHALL open modal with:
  - Subscription URL (with copy-to-clipboard button)
  - Dropdown to select calendar app (Google/Apple/Outlook/Other)
  - Step-by-step instructions based on selection
  - "Open in Calendar App" button (deep link for supported apps)
- **REQ-3.5.3**: Page SHALL display subscription status (active/expired)
- **REQ-3.5.4**: Page SHALL allow regenerating subscription URL (invalidates old URL)

---

## Non-Functional Requirements

### Performance
- **NFR-3.1**: iCal generation for 100 events SHALL complete within 2 seconds
- **NFR-3.2**: Subscription feed SHALL be cacheable for 5 minutes (HTTP `Cache-Control` header)
- **NFR-3.3**: Database query SHALL use indexes on `Schedule.date`, `Schedule.groupId`, `Schedule.subgroupId`

### Security
- **NFR-3.4**: Subscription tokens SHALL expire after 1 year (renewable)
- **NFR-3.5**: Tokens SHALL be signed with HMAC-SHA256 using server secret
- **NFR-3.6**: Token SHALL embed userId + expiration timestamp
- **NFR-3.7**: Brute-force protection: Rate limit to 10 exports per user per hour

### Compatibility
- **NFR-3.8**: iCal output SHALL comply with RFC 5545 (iCalendar specification)
- **NFR-3.9**: Events SHALL render correctly in:
  - Google Calendar (web + mobile)
  - Apple Calendar (macOS + iOS)
  - Microsoft Outlook (desktop + web)
  - Thunderbird

### Usability
- **NFR-3.10**: Instructions SHALL include screenshots for each calendar app
- **NFR-3.11**: Deep links SHALL work on mobile devices (iOS/Android)
- **NFR-3.12**: Error messages SHALL be user-friendly (avoid technical jargon)

---

## Success Criteria

1. **Functional Success**:
   - Student can subscribe to calendar feed in < 2 minutes
   - Calendar events appear in user's calendar app within 1 hour
   - Schedule changes reflect in calendar within 4 hours (typical sync interval)
   - iCal file opens correctly in all 4 major calendar apps

2. **Performance Success**:
   - 100-event export completes in < 2 seconds
   - Subscription feed endpoint response time p95 < 500ms
   - Zero timeout errors for export requests

3. **Usability Success** (SC-010):
   - **85% of students successfully integrate calendar on first attempt**
   - Average time to complete integration: < 3 minutes
   - Support tickets about calendar integration: < 5 per month

4. **Security Success**:
   - Zero unauthorized access incidents
   - Tokens expire and renew correctly
   - Rate limiting prevents abuse

---

## Data Model

### New Models

**SubscriptionToken** (optional enhancement)
```prisma
model SubscriptionToken {
  id          String   @id @default(uuid())
  userId      String
  token       String   @unique
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  lastUsedAt  DateTime?
  isActive    Boolean  @default(true)

  user        User     @relation(fields: [userId], references: [id])
}
```

*Note*: Can also generate tokens on-the-fly using JWT without database storage.

### Existing Models Used

- `Schedule`: Source of calendar events
- `Exam`: Additional calendar events
- `MentorMeeting`: For mentors' calendars
- `User`: For authorization and filtering
- `Subject`: For event summaries
- `Group` / `Subgroup`: For student schedule filtering

---

## Acceptance Criteria

### AC-3.1: Student Subscription
- [ ] Given I am a student logged into Шкед
- [ ] When I navigate to "My Calendar" and click "Subscribe to Calendar"
- [ ] Then I see a modal with a subscription URL and app selection dropdown
- [ ] When I select "Google Calendar" and click "Copy URL"
- [ ] Then the URL is copied to clipboard and I see confirmation message
- [ ] When I paste URL into Google Calendar subscription settings
- [ ] Then all my classes appear in Google Calendar within 1 hour

### AC-3.2: Schedule Update Propagation
- [ ] Given I have subscribed to my calendar feed
- [ ] When an admin changes my class time in Шкед
- [ ] Then the change appears in my Google Calendar within 4 hours
- [ ] And the event sequence number has incremented

### AC-3.3: Instructor One-Time Export
- [ ] Given I am an instructor teaching "Algorithms" and "Data Structures"
- [ ] When I navigate to "My Schedule" and filter by "Algorithms"
- [ ] And I click "Export to Calendar"
- [ ] Then I download `schedule_algorithms_2025-11-10.ics`
- [ ] And the file contains only Algorithms classes
- [ ] When I import the file into Apple Calendar
- [ ] Then all events display with correct times, locations, and Zoom links

### AC-3.4: Authorization Enforcement
- [ ] Given I am a student in Group CS-101
- [ ] When I attempt to access subscription feed with another student's token
- [ ] Then I receive HTTP 401 Unauthorized
- [ ] And the response message is "Invalid or expired subscription token"

### AC-3.5: iCal Format Validation
- [ ] Given I export a schedule with 50 events
- [ ] When I validate the .ics file against RFC 5545
- [ ] Then it passes validation with zero errors
- [ ] And it contains correct `VEVENT`, `UID`, `SUMMARY`, `DTSTART`, `DTEND` fields

### AC-3.6: Zoom Link Integration
- [ ] Given a class has `Schedule.zoomMeetingId` set
- [ ] When I export the schedule to iCal
- [ ] Then the event `DESCRIPTION` includes the Zoom link
- [ ] And `LOCATION` is set to "Online (Zoom)"

### AC-3.7: Token Expiration
- [ ] Given my subscription token was created 366 days ago
- [ ] When my calendar app tries to sync
- [ ] Then it receives HTTP 401
- [ ] And I receive a Telegram notification to renew subscription

---

## Assumptions

1. Calendar apps sync subscribed calendars every 1-4 hours (user cannot force immediate sync in most apps)
2. Students have access to at least one calendar application (Google/Apple/Outlook)
3. Mobile devices support deep links to calendar apps (`webcal://` protocol)
4. Server can generate HMAC tokens securely (environment variable `ICAL_SECRET_KEY`)
5. Schedule changes are relatively infrequent (< 10 per day)

---

## Dependencies

### Internal
- `Schedule` model with complete data (date, startTime, endTime, location, zoomMeetingId)
- `NextAuth` session for authentication
- RBAC helpers for authorization checks

### External
- iCal library: `ical-generator` (npm package) for RFC 5545 compliance
- JWT library: `jsonwebtoken` (already in dependencies) for token generation
- Date handling: `date-fns` (already in dependencies)

---

## Out of Scope

- Real-time calendar sync (push notifications) - calendar apps pull on interval
- Bi-directional sync (editing events in calendar app updates Шкед) - read-only export only
- Email reminders from calendar events (handled by calendar app, not Шкед)
- Recurring event support for repeated classes (each class is individual event)
- Timezone customization (all events in UTC, calendar app converts to user timezone)

---

## Open Questions

None. Requirements are fully specified.

---

## Risks

1. **Compatibility Risk**: Calendar apps may not support all iCal features
   - **Mitigation**: Use only widely-supported RFC 5545 features, test with 4 major apps

2. **Security Risk**: Leaked subscription URLs allow unauthorized schedule access
   - **Mitigation**: Token expiration (1 year), regeneration option, HMAC signing

3. **Performance Risk**: Large exports (1000+ events) may timeout
   - **Mitigation**: Limit exports to 6 months of future schedule, pagination if needed

4. **Usability Risk**: Users may not understand how to subscribe to calendar feeds
   - **Mitigation**: Step-by-step instructions with screenshots, support for deep links

---

## Implementation Estimate

**Total Effort**: 8-12 hours (1-1.5 days)

### Breakdown:
1. Backend API endpoint (`/api/schedules/export/ical`) - 3 hours
2. iCal generation logic with `ical-generator` - 2 hours
3. Token generation and validation - 2 hours
4. Authorization filters (student/instructor/mentor) - 1 hour
5. UI modal with subscription URL and instructions - 2 hours
6. Testing (manual + integration tests) - 2 hours

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-10 | Claude | Initial specification |

---

**Next Steps**:
1. Review and approve specification
2. Run `/speckit.plan` to create technical implementation plan
3. Run `/speckit.tasks` to break down into actionable tasks
4. Run `/speckit.implement` to execute implementation
