# TypeScript Error Fixes Needed

## Summary
After enabling strict TypeScript checking, we need to fix the following issues:

### 1. Deprecated `lectorId` field usage
Files that still reference the removed `lectorId` field need to be updated to use the `SubjectLector` relation instead.

**Files to fix:**
- `app/api/admin/reset-db/route.ts` - Line 178
- `app/api/homework/[id]/route.ts` - Line 96
- `app/api/homework/[id]/submissions/[submissionId]/comments/route.ts` - Lines 28, 114
- `app/api/homework/[id]/submissions/[submissionId]/review/route.ts` - Line 31
- `app/api/homework/[id]/submissions/[submissionId]/route.ts` - Line 48
- `app/api/subjects/route.ts` - Lines 56, 148, 151, 293, 296
- `scripts/seed.ts` - Line 252

**Fix:** These files need to stop using `lectorId` in queries and updates. Use the `SubjectLector` relation table instead.

### 2. Variable scope issues
`body` variable used outside its scope in catch blocks.

**Files to fix:**
- ✅ `app/api/groups/route.ts` - FIXED
- `app/api/schedules/route.ts` - Lines 514, 519
- `app/api/subjects/route.ts` - Lines 351, 356
- `app/api/users/route.ts` - Lines 551, 556

**Fix:** Remove the body reference from catch blocks or declare it outside try block.

### 3. Missing relations in queries
Some queries expect `homework` or `subject` relations but don't include them.

**Files to fix:**
- `app/api/homework/[id]/route.ts` - Line 114
- `app/api/homework/[id]/submissions/[submissionId]/comments/route.ts` - Lines 46, 47, 132
- `app/api/homework/[id]/submissions/[submissionId]/review/route.ts` - Line 59
- `app/api/homework/[id]/submissions/[submissionId]/route.ts` - Lines 76, 81

**Fix:** Add the missing `include` in Prisma queries or change code to not access those relations.

### 4. Component issues
- Missing `useEffect` import in `components/admin/exam-form.tsx`
- Missing `getFullName` function in `app/mentor/students/page.tsx`
- Zod validation schema issues with enum parameters (changed API in newer Zod)
- Async component type issues in student pages

**Recommendation:** Due to the large number of fixes needed and the fact that we're introducing breaking changes, I suggest:

1. **Temporarily disable strict TypeScript checking** until all issues are resolved incrementally
2. **Create migration tasks** for each file category
3. **Test each fix individually** to ensure nothing breaks

## Quick Fix Option

Edit `next.config.js` and temporarily re-enable:
```javascript
typescript: {
  ignoreBuildErrors: true,
},
```

Then fix issues incrementally in separate commits.
