# Homework System Integration with MDXEditor

## Overview

Integrate MDXEditor (modern React WYSIWYG Markdown editor) to create a comprehensive homework management system for Shked (Шкед). This will allow admins to create assignments with deadlines, students to submit homework in Markdown format, and admins to grade and provide feedback.

## Database Schema Changes

Update `prisma/schema.prisma` to add three new models:

1. **Assignment Model** - homework assignments created by admins

- Fields: id, title, description, subjectId, groupId, dueDate, maxScore, instructions (Markdown), createdAt, updatedAt
- Relations: Subject, Group, Submissions

2. **Submission Model** - student homework submissions

- Fields: id, assignmentId, userId, content (Markdown text), submittedAt, status (draft/submitted/graded), score, feedback (Markdown), gradedAt, gradedBy
- Relations: Assignment, User (student), User (grader)

3. **Update User Model** - add relation to submissions

## Package Installation

Install required packages:

- `@mdxeditor/editor` - Modern React Markdown WYSIWYG editor with TypeScript support
- `react-markdown` - For rendering Markdown content
- `remark-gfm` - GitHub Flavored Markdown support

## API Routes

Create new API endpoints following existing patterns from `app/api/schedules/route.ts`:

### `/api/assignments/route.ts`

- GET: List assignments (filtered by role - admin sees all, students see their group's)
- POST: Create assignment (admin only)

### `/api/assignments/[id]/route.ts`

- GET: Get assignment details
- PUT: Update assignment (admin only)
- DELETE: Delete assignment (admin only)

### `/api/submissions/route.ts`

- GET: List submissions (students see their own, admins see all)
- POST: Create/submit homework

### `/api/submissions/[id]/route.ts`

- GET: Get submission details
- PUT: Update submission (students update content, admins grade)
- DELETE: Delete submission

## UI Components

### Admin Components (`components/admin/`)

1. **`assignment-form.tsx`** - Create/edit assignment form

- Subject and group selection
- MDXEditor for instructions
- Due date picker, max score input
- Form validation with react-hook-form + zod

2. **`assignments-list.tsx`** - Display all assignments

- Table with subject, group, due date, submissions count
- Filter by subject/group
- Edit/delete actions

3. **`grading-interface.tsx`** - Grade student submissions

- View student submission (rendered Markdown)
- MDXEditor for feedback
- Score input, grade submission action

### Student Components (`components/student/`)

1. **`homework-card.tsx`** - Display assignment card

- Assignment title, subject, due date
- Status badge (pending/submitted/graded)
- View/submit button

2. **`homework-editor.tsx`** - Markdown editor for submission

- MDXEditor with toolbar (bold, italic, lists, code blocks)
- Auto-save draft functionality
- Character/word count
- Submit button with confirmation

3. **`homework-view.tsx`** - View graded submission

- Rendered Markdown content
- Score and feedback display
- Resubmission option if allowed

### Shared UI Component

**`components/ui/markdown-editor.tsx`** - Wrapper around MDXEditor

- Configured with plugins for full Markdown support
- Client component with proper TypeScript types
- Toolbar customization options
- Preview mode toggle

## Page Routes

### Admin Pages

**`app/admin/homework/page.tsx`** - Homework management dashboard

- Stats cards (total assignments, pending submissions, graded)
- Assignments list with create button
- Recent submissions section

**`app/admin/homework/[id]/page.tsx`** - Assignment detail page

- Assignment info, edit button
- List of all student submissions
- Quick grading interface

**`app/admin/homework/[id]/grade/[submissionId]/page.tsx`** - Full grading page

- Student info, submission content
- Grading interface with feedback editor

### Student Pages

**`app/student/homework/page.tsx`** - Student homework dashboard

- Filter by subject, status (pending/submitted/graded)
- Cards showing all assignments
- Due date sorting

**`app/student/homework/[id]/page.tsx`** - Assignment view/submit page

- Assignment instructions (rendered Markdown)
- Submission editor if not submitted
- View submission and feedback if graded

## Navigation Updates

Update navigation components:

- `components/admin/admin-nav.tsx` - Add "Домашние задания" menu item
- `components/student/student-nav.tsx` - Add "Домашние задания" menu item

## Type Definitions

Update `lib/types.ts` with new interfaces:

- `Assignment`, `AssignmentWithRelations`
- `Submission`, `SubmissionWithRelations`
- `SubmissionStatus` enum type

## Key Implementation Details

1. **MDXEditor Configuration**: Client-only component with dynamic import to avoid SSR issues
2. **Auto-save**: Implement debounced auto-save for draft submissions using useEffect
3. **Validation**: Use Zod schemas for API request validation following existing patterns
4. **Permissions**: Check user roles in API routes (admin vs student access)
5. **Russian Language**: All UI text in Russian, date formatting with ru-RU locale
6. **Responsive Design**: Mobile-first approach with Tailwind breakpoints
7. **Error Handling**: Toast notifications for errors using existing sonner integration

## Testing Checklist

- Admin can create assignments with Markdown instructions
- Students see only their group's assignments
- Students can save drafts and submit homework
- Markdown renders correctly in preview
- Admins can grade submissions and provide feedback
- Notifications for approaching deadlines
- Proper permission checks in all API routes