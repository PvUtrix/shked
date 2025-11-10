# Implementation Plan: Attendance Report Export

**Feature**: 1-attendance-report-export
**Spec**: [spec.md](./spec.md)
**Created**: 2025-11-10
**Status**: Draft

---

## Architecture Overview

### Request Flow
```
User → UI (Export Button) → API Route (/api/attendance/export)
                                    ↓
                            Authorization Check (NextAuth + RBAC)
                                    ↓
                            Prisma Query (with filters)
                                    ↓
                            CSV Generation (in-memory)
                                    ↓
                            HTTP Response (text/csv with download headers)
                                    ↓
                            Browser Download
```

### Technology Choices

1. **API Route**: Next.js API Route (`app/api/attendance/export/route.ts`)
   - **Why**: Serverless, integrates with NextAuth, consistent with existing API structure
   - **Alternative Considered**: tRPC endpoint (rejected: not currently in tech stack)

2. **CSV Generation**: `csv-stringify` library (already in dependencies as part of `csv` package)
   - **Why**: Robust, handles escaping, streaming capable
   - **Alternative**: Manual string concatenation (rejected: error-prone, no escaping)

3. **Authorization**: Custom RBAC helper functions + Prisma queries
   - **Why**: Aligns with Constitution Principle II (RBAC Consistency)
   - **Pattern**: Check session → validate role → filter query by user permissions

4. **Database Query**: Prisma `findMany()` with complex `where` clause
   - **Why**: Type-safe, follows Constitution Principle III (Database-First)
   - **Optimization**: Eager loading of relations (`include`) to avoid N+1 queries

---

## File Changes

### New Files

1. **`app/api/attendance/export/route.ts`** (NEW)
   - GET handler for export endpoint
   - Query param parsing and validation
   - Authorization logic
   - Prisma query with filters
   - CSV generation and streaming
   - Error handling

2. **`components/lector/attendance/ExportButton.tsx`** (NEW)
   - Export button component
   - Filter modal UI (date range, group, student selectors)
   - Loading state during export
   - Error toast notifications
   - Success feedback

3. **`lib/csv/attendance-exporter.ts`** (NEW)
   - CSV column definitions
   - Data transformation logic (DB models → CSV rows)
   - CSV header generation
   - Value sanitization (prevent CSV injection)

4. **`__tests__/integration/api/attendance-export.test.ts`** (NEW)
   - Test authorized exports (lector, admin, student)
   - Test unauthorized access (403 responses)
   - Test empty results
   - Test filter combinations
   - Test CSV format validation

5. **`__tests__/utils/csv-helpers.ts`** (NEW)
   - Parse CSV for testing
   - Validate CSV structure
   - Assert column presence

### Modified Files

1. **`app/lector/attendance/page.tsx`**
   - Import and render `<ExportButton />` component
   - Pass subject context to button

2. **`app/admin/attendance/page.tsx`**
   - Add admin-level export button with "Export All" option

3. **`app/student/attendance/page.tsx`**
   - Add "Download My Attendance" button

4. **`prisma/schema.prisma`** (if changes needed)
   - Verify indexes exist: `@@index([date, subjectId, groupId])`
   - Add index if missing for performance

5. **`lib/auth.ts`** (if new helper needed)
   - Add `canAccessSubject(userId, subjectId)` helper
   - Add `canAccessGroup(userId, groupId)` helper

---

## Database Considerations

### Required Indexes (if not present)

```prisma
model Attendance {
  // ... existing fields ...

  @@index([date])
  @@index([subjectId])
  @@index([groupId])
  @@index([studentId])
  @@index([date, subjectId]) // Compound index for common query pattern
}
```

### Query Example

```typescript
const attendanceRecords = await prisma.attendance.findMany({
  where: {
    date: {
      gte: fromDate,
      lte: toDate,
    },
    subjectId: subjectId ? subjectId : undefined,
    groupId: groupId ? groupId : undefined,
    studentId: studentId ? studentId : undefined,
    // RBAC filter for lector
    subject: lectorRole ? {
      lectors: {
        some: {
          userId: session.user.id
        }
      }
    } : undefined,
  },
  include: {
    student: {
      select: { id: true, name: true, email: true }
    },
    subject: {
      select: { id: true, name: true }
    },
    group: {
      select: { id: true, name: true }
    },
  },
  orderBy: [
    { date: 'desc' },
    { student: { name: 'asc' } }
  ]
});
```

---

## API Contract

### Endpoint: `GET /api/attendance/export`

**Query Parameters**:
```typescript
interface ExportParams {
  subjectId?: string;      // UUID
  groupId?: string;        // UUID
  studentId?: string;      // UUID
  fromDate?: string;       // YYYY-MM-DD
  toDate?: string;         // YYYY-MM-DD
  format?: 'csv';          // Future: 'xlsx', 'json'
}
```

**Success Response** (HTTP 200):
```http
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="attendance_algorithms_2025-01-01_2025-06-30.csv"

Date,Subject,Group,Student Name,Student Email,Status,Notes
2025-03-15,Algorithms,CS-101,Ivan Petrov,ivan@example.com,Present,""
2025-03-15,Algorithms,CS-101,Maria Ivanova,maria@example.com,Absent,"Sick leave"
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Insufficient permissions
- **400 Bad Request**: Invalid query parameters
- **500 Internal Server Error**: Database or CSV generation error

---

## UI/UX Design

### Export Button Placement
- **Lector/Admin Pages**: Top-right of attendance table, next to "Add Attendance" button
- **Student Page**: Below attendance table, labeled "Download My Attendance"

### Export Modal Structure
```
┌─────────────────────────────────────────────┐
│  Export Attendance Records                  │
├─────────────────────────────────────────────┤
│  Date Range:                                │
│  From: [2025-01-01 ▼]  To: [2025-06-30 ▼] │
│                                             │
│  Subject: [Algorithms ▼] (lector only)     │
│  Group:   [All Groups ▼]                   │
│  Student: [All Students ▼]                 │
│                                             │
│  Format: [CSV ▼]                           │
│                                             │
│  [Reset Filters]  [Cancel]  [Export CSV]  │
└─────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core API (2-3 hours)
- [ ] Create `/api/attendance/export/route.ts`
- [ ] Implement GET handler with session check
- [ ] Add Prisma query with basic filters (subjectId, date range)
- [ ] Implement CSV generation using `csv-stringify`
- [ ] Add proper response headers for download
- [ ] Manual testing with Postman/curl

### Phase 2: Authorization (1-2 hours)
- [ ] Implement lector access control (SubjectLector check)
- [ ] Implement admin access control (allow all)
- [ ] Implement student access control (own records only)
- [ ] Add 403 error responses
- [ ] Manual testing with different user roles

### Phase 3: UI Components (2-3 hours)
- [ ] Create `ExportButton.tsx` component
- [ ] Implement filter modal with date pickers
- [ ] Add subject/group/student dropdowns (fetch from API)
- [ ] Implement export trigger (construct URL with query params)
- [ ] Add loading spinner and error toasts
- [ ] Test in browser with real user session

### Phase 4: Integration (1 hour)
- [ ] Add button to lector attendance page
- [ ] Add button to admin attendance page
- [ ] Add button to student attendance page
- [ ] Verify context (subjectId, groupId) passes correctly

### Phase 5: Testing (2-3 hours)
- [ ] Write integration tests for API route
- [ ] Test all authorization scenarios (200, 403, 401)
- [ ] Test filter combinations
- [ ] Test CSV format validation
- [ ] Run E2E test for full export workflow
- [ ] Fix any bugs found

### Phase 6: Polish (1 hour)
- [ ] Add CSV injection sanitization
- [ ] Improve error messages
- [ ] Add tooltips to filter options
- [ ] Verify filename generation
- [ ] Update user documentation

**Total Estimated Time**: 9-13 hours

---

## Testing Strategy

### Unit Tests
- `lib/csv/attendance-exporter.ts`: Test CSV row generation, escaping, sanitization

### Integration Tests
- API route authorization (lector, admin, student, unauthorized)
- Filter logic (date range, subjectId, groupId, studentId)
- Empty results handling
- Error scenarios (invalid dates, missing subject)

### E2E Tests
- Login as lector → navigate to attendance → export → verify download
- Login as student → navigate to "My Attendance" → export → verify data

---

## Security Checklist

- [ ] NextAuth session verified before any data access
- [ ] Prisma parameterized queries (no raw SQL)
- [ ] RBAC checks prevent unauthorized data access
- [ ] CSV injection: sanitize cells starting with `=+-@`
- [ ] No sensitive data in logs or error messages
- [ ] Export action logged with user ID and timestamp

---

## Performance Optimization

### Database
- Verify indexes on `Attendance` table (date, subjectId, groupId)
- Use `select` to limit columns fetched
- Batch query for multiple relations (avoid N+1)

### CSV Generation
- Stream CSV for exports > 5000 records (future)
- Limit exports to 10,000 records initially
- Consider pagination for very large exports

### Caching
- No caching (attendance data changes frequently)

---

## Rollout Plan

1. **Development**: Implement on feature branch `1-attendance-report-export`
2. **Code Review**: Address TypeScript errors, security review
3. **Staging Testing**: Deploy to staging, test with real data
4. **Documentation**: Update user guide with export instructions
5. **Production Release**: Merge to main, deploy
6. **Monitoring**: Watch error logs for first week

---

## Future Enhancements (Out of Scope for v1)

1. Excel (.xlsx) format support
2. Scheduled exports (cron job)
3. Email delivery of reports
4. Export statistics/aggregates (not raw records)
5. Async job queue for large exports
6. Export history/download again

---

## Constitution Alignment

This plan aligns with the Шкед Constitution:

- **Principle I (Type Safety First)**: All API route handlers are TypeScript, Prisma provides type-safe queries
- **Principle II (RBAC Consistency)**: Authorization checks respect 8-role system, queries filtered by user role
- **Principle III (Database-First)**: No schema changes needed, uses existing Prisma models
- **Principle IV (Test Coverage)**: Integration tests for API, E2E tests for user workflow
- **Principle V (API Contract Stability)**: New endpoint, no breaking changes to existing APIs

---

## Approval Checklist

- [ ] Spec reviewed and approved
- [ ] Architecture approved by tech lead
- [ ] Security review complete
- [ ] Estimated effort acceptable (9-13 hours)
- [ ] No blockers or missing dependencies
- [ ] Ready to break down into tasks

---

**Next Step**: Run `/speckit.tasks` to generate actionable task breakdown
