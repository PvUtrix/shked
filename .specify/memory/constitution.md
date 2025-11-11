# Шкед (SmartSchedule) Project Constitution

## Core Principles

### I. Type Safety First
All code must be written in TypeScript with strict mode enabled. Type safety is non-negotiable:
- No `any` types without explicit justification and TODO comments
- All API contracts must have corresponding TypeScript interfaces
- Prisma schema changes must be reflected in type definitions
- Database queries must use Prisma's type-safe client
- Component props must have explicit type definitions

**Rationale**: The project's current TypeScript errors demonstrate the cost of type safety violations. Strict typing prevents runtime errors, improves maintainability, and enables confident refactoring.

### II. Role-Based Access Control (RBAC) Consistency
All features must respect the 8-role system (admin, lector, student, mentor, assistant, co-lector, director, educator):
- API routes must verify user roles using NextAuth session
- UI components must conditionally render based on user permissions
- Database models must maintain referential integrity for role-based data
- Test fixtures must cover all relevant role scenarios

**Rationale**: Educational management systems require strict access control. RBAC violations can expose sensitive student data or allow unauthorized grade modifications.

### III. Database-First Design
Schema changes must follow the Prisma workflow:
- Define schema changes in `prisma/schema.prisma` first
- Generate migration files: `prisma migrate dev`
- Update seed data in `scripts/seed.ts` if needed
- Test migrations against production-like data volumes
- Never directly modify the database schema outside migrations

**Rationale**: Schema drift and manual database changes cause deployment failures and data consistency issues.

### IV. Test Coverage for Business Logic
Critical business logic must have test coverage:
- Authentication and authorization flows (unit + E2E)
- Grade calculations and homework submission logic
- Schedule conflict detection
- Attendance tracking algorithms
- API route handlers for CRUD operations

**Rationale**: Educational data is sensitive. Bugs in grade calculations or attendance can have real-world consequences for students.

### V. API Contract Stability
Public API routes must maintain backward compatibility:
- Use API versioning for breaking changes (`/api/v2/...`)
- Deprecate endpoints gradually with warnings
- Document all API changes in commit messages
- Maintain OpenAPI/Swagger documentation (future goal)

**Rationale**: The Telegram bot and potential mobile apps depend on API stability. Breaking changes without versioning cause integration failures.

## Technology Constraints

### Stack Requirements
- **Frontend**: React 18+ with Next.js App Router (no Pages Router)
- **Backend**: Next.js API Routes (serverless)
- **Database**: PostgreSQL 14+ with Prisma ORM 6.7+
- **Authentication**: NextAuth.js 4.x with JWT strategy
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: Zustand for global state, React hooks for local state

### Deployment Environment
- Docker containers for production
- Environment variables managed via `.env` (never commit credentials)
- Database connection pooling for serverless environments
- CDN for static assets

## Development Workflow

### Code Quality Gates
1. **ESLint**: Must pass with max 500 warnings (gradually reduce to 0)
2. **TypeScript Compilation**: Zero errors required for PR approval
3. **Tests**:
   - Unit tests: `npm run test:unit` must pass
   - Integration tests: `npm run test:integration` must pass (requires local DB)
   - E2E tests: `npm run test:e2e` must pass before merge
4. **Git Hooks**: Husky pre-commit hooks enforce linting and formatting

### Feature Development Process
1. Create feature branch from `main`: `feature/description` or `fix/description`
2. Write failing tests first (TDD encouraged, not strictly enforced)
3. Implement feature with type safety
4. Update documentation if API/schema changes
5. Create PR with descriptive title and body
6. Address review comments
7. Squash merge to `main` after approval

### Testing Strategy
- **Unit Tests**: Pure functions in `lib/`, `hooks/`, utilities
- **Integration Tests**: API routes, database operations
- **Component Tests**: Complex interactive components (currently limited)
- **E2E Tests**: Critical user journeys (auth, admin CRUD, student workflows)
- **Manual Testing**: UI/UX validation before major releases

## Specific Architectural Patterns

### Authentication Flow
```
Client → NextAuth signIn() → CredentialsProvider → authorize() callback
→ Prisma user lookup → Password validation (bcryptjs)
→ JWT token generation → Session with role & groupId
```

### API Route Pattern
```typescript
// app/api/resource/route.ts
export async function GET(request: Request) {
  // 1. Authenticate via getServerSession()
  // 2. Authorize based on role
  // 3. Parse & validate query params (Zod recommended)
  // 4. Execute Prisma query with error handling
  // 5. Return NextResponse.json() with appropriate status
}
```

### Component Organization
- **Pages**: `app/[role]/[feature]/page.tsx`
- **Components**: `components/[role]/[feature]/ComponentName.tsx`
- **Shared UI**: `components/ui/*` (Radix-based primitives)
- **Hooks**: `hooks/use[Feature].ts`
- **Utilities**: `lib/[domain]/[utility].ts`

## Governance

### Constitution Amendments
- Amendments require:
  1. Proposal via GitHub issue with "constitution" label
  2. Team discussion and consensus
  3. Documentation update
  4. Migration plan if affects existing code
- Version bump: MAJOR for principle changes, MINOR for additions, PATCH for clarifications

### Compliance Review
- All PRs must demonstrate alignment with this constitution
- Violations should be flagged in code review
- Persistent violations require architectural discussion
- Emergency hotfixes may bypass process but require retroactive review

### Known Technical Debt
As of **2025-11-10**, known issues to address:
1. Deprecated `lectorId` field usage (replace with SubjectLector join table)
2. Component test rendering issues (testing-library compatibility)
3. Prisma mocking complexity in unit tests
4. TypeScript strict mode errors (tracked in TYPESCRIPT_FIXES_NEEDED.md)

**Version**: 1.0.0 | **Ratified**: 2025-11-10 | **Last Amended**: 2025-11-10
