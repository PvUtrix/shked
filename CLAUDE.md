# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SmartSchedule (Шкед)** is a comprehensive schedule management platform for MIPT (Moscow Institute of Physics and Technology). The platform manages schedules, homework, attendance, exams, and communication for all educational stakeholders.

**Tech Stack**: Next.js 16 (App Router), React 18, TypeScript, Prisma ORM, PostgreSQL, NextAuth.js, Tailwind CSS, Radix UI

**Node/npm requirements**: Node.js ≥20.0.0, npm ≥9.0.0

## Key Development Commands

### Development & Building
```bash
npm run dev                    # Start development server (http://localhost:3000)
npm run build                  # Build production (includes prisma generate)
npm start                      # Start production server
npm run lint                   # Run ESLint (max 500 warnings allowed)
```

### Database Operations
```bash
npx prisma migrate dev         # Create and apply new migration
npx prisma db seed             # Seed database with initial data
npx prisma generate            # Generate Prisma client types
npx prisma studio              # Open Prisma Studio GUI
npm run fix:demo-student       # Fix demo student group assignment
```

### Testing
```bash
npm test                       # Run Jest unit/integration tests
npm run test:watch             # Run tests in watch mode
npm run test:coverage          # Generate coverage report
npm run test:unit              # Run unit tests only (__tests__/unit)
npm run test:integration       # Run integration tests only (__tests__/integration)
npm run test:e2e               # Run Playwright E2E tests
npm run test:e2e:ui            # Run E2E tests with Playwright UI
npm run test:e2e:headed        # Run E2E tests in headed mode
npm run test:all               # Run all tests (Jest + Playwright)
npm run playwright:install     # Install Playwright browsers
```

### Release Management
```bash
npm run release                # Interactive release
npm run release:patch          # Patch version (0.2.0 → 0.2.1)
npm run release:minor          # Minor version (0.2.0 → 0.3.0)
npm run release:major          # Major version (0.2.0 → 1.0.0)
npm run release:beta           # Beta pre-release
npm run changelog              # Generate full changelog
npm run changelog:all          # Update existing changelog
```

## Critical Internationalization (i18n) Rules

**ABSOLUTELY CRITICAL**: This project uses next-intl for internationalization. ALL user-facing strings MUST use translation keys.

### Translation Usage Rules

1. **NEVER hardcode Russian text in UI components** - always use translation keys
2. **Client Components**: Use `useTranslations()` hook
3. **Server Components**: Use `getTranslations()` function
4. **All new strings**: Add to `messages/ru.json` first

### Client Component Example
```typescript
'use client'
import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations()
  return <button>{t('common.buttons.save')}</button>
}
```

### Server Component Example
```typescript
import { getTranslations } from 'next-intl/server'

export default async function MyPage() {
  const t = await getTranslations()
  return <div>{t('admin.nav.schedule')}</div>
}
```

### Translation Files
- **Location**: `messages/ru.json` (Russian), `messages/en.json` (future English)
- **Structure**: Flat structure with dot notation keys (`admin.nav.schedule`)
- **Config**: `i18n/config.ts`, utilities in `i18n/request.ts`

## User Roles & Permissions

The platform has 8 user roles with hierarchical permissions:

| Role | Value | Permission Level | Routes |
|------|-------|------------------|--------|
| Admin | `admin` | 100 | `/admin/*` |
| Education Office Head | `education_office_head` | 90 | `/education-office/*` |
| Department Admin | `department_admin` | 80 | `/department/*` |
| Lector (Teacher) | `lector` | 50 | `/lector/*` |
| Co-Lector | `co_lecturer` | 45 | `/lector/*` |
| Assistant | `assistant` | 40 | `/lector/*` |
| Mentor | `mentor` | 30 | `/mentor/*` |
| Student | `student` | 10 | `/student/*` |

**Important Notes**:
- Route path uses `lector` (not `teacher`) - e.g., `/lector/homework`
- Database enum uses `lector` for teachers
- Permission helpers in `lib/api-helpers.ts`: `hasRole()`, `hasAnyRole()`
- Authentication via NextAuth.js with JWT strategy (config in `lib/auth.ts`)

## Architecture & Project Structure

### App Router Organization (Next.js 16)
```
app/
├── admin/           # Admin pages (all admin-level roles)
├── lector/          # Teacher/lector pages
├── mentor/          # Mentor pages (curator functionality)
├── student/         # Student pages
├── api/            # API routes
│   ├── auth/       # NextAuth routes
│   ├── telegram/   # Telegram bot webhook & operations
│   ├── max/        # Max messenger integration
│   └── [entities]/ # CRUD operations for entities
├── login/          # Login page
└── change-password/ # Password change page
```

### Components Organization
```
components/
├── ui/             # Radix UI components (shadcn/ui style)
├── admin/          # Admin-specific components
├── lector/         # Teacher-specific components
├── mentor/         # Mentor-specific components
├── student/        # Student-specific components
└── auth/           # Authentication components
```

### Library Code
```
lib/
├── auth.ts         # NextAuth configuration
├── db.ts           # Prisma client singleton
├── types.ts        # Shared TypeScript types
├── validations.ts  # Zod validation schemas
├── api-helpers.ts  # API utilities (auth, roles, error handling)
├── api-error.ts    # Standardized API error responses
├── activity-log.ts # Activity logging system
├── rate-limit.ts   # Rate limiting utilities
├── telegram/       # Telegram bot integration
├── max/            # Max messenger integration (Russian messenger)
└── cron/           # Cron job initialization
```

## Key Database Models (Prisma)

**Core Entities**:
- `User` - All users with role-based access, links to Group and TelegramUser/MaxUser
- `Group` - Student groups with subgroups support
- `Subject` - Academic subjects with multiple lectors via `SubjectLector` join table
- `Schedule` - Class schedule entries
- `Homework` - Homework assignments with submissions and comments
- `HomeworkSubmission` - Student homework submissions with status tracking
- `Attendance` - Attendance tracking per schedule entry
- `ExamResult` - Exam/test results storage
- `MentorMeeting` - Meeting scheduling between mentors and students
- `ForumTopic` & `ForumPost` - Discussion forum
- `ActivityLog` - Comprehensive audit log of all user actions

**Integrations**:
- `TelegramUser` - Links User to Telegram account for notifications
- `MaxUser` - Links User to Max messenger (Russian messaging platform)
- `BotSettings` - Telegram bot configuration

**Important Fields**:
- `User.status` - Values: `ACTIVE`, `EXPELLED`, `ACADEMIC_LEAVE`
- `User.mustChangePassword` - Forces password change on next login
- `User.mentorGroupIds` - JSON array of group IDs for mentors
- All models use `cuid()` for IDs

## Bot Integrations

### Telegram Bot
- **Location**: `lib/telegram/`
- **Webhook**: `/api/telegram/webhook` (POST endpoint)
- **Config API**: `/api/telegram/config` (GET/POST)
- **Features**: Schedule notifications, homework reminders, OpenAI integration
- **Settings**: Stored in `BotSettings` model

### Max Messenger Bot
- **Location**: `lib/max/`
- **Webhook**: `/api/max/webhook` (POST endpoint)
- **Package**: `@maxhub/max-bot-api`
- **Features**: Native Russian messenger integration, similar to Telegram
- **Important**: Max uses string IDs (`chatId` is string, not number)

### Cron Jobs
- **Initialization**: `lib/cron/init.ts`
- **Important**: Cron jobs MUST NOT initialize in test environment
- **Check**: Use `process.env.NODE_ENV !== 'test'` guard

## API Route Patterns

### Standard Response Format
All API routes should use standardized responses from `lib/api-error.ts`:
```typescript
import { ApiErrors } from '@/lib/api-error'

// Success response
return NextResponse.json({ data: result }, { status: 200 })

// Error responses
throw ApiErrors.unauthorized('Not authorized')
throw ApiErrors.forbidden('Insufficient permissions')
throw ApiErrors.notFound('Resource not found')
throw ApiErrors.badRequest('Invalid input')
throw ApiErrors.internal('Server error')
```

### Authentication & Authorization
```typescript
import { requireAuth, requireRole } from '@/lib/api-helpers'

// Require any authenticated user
const session = await requireAuth()

// Require specific role or higher
const session = await requireRole('lector')

// Check specific roles
const session = await requireRoles(['admin', 'lector'])
```

## Code Style & Conventions

### Naming Conventions
- **Variables/Functions**: camelCase (English) - `userName`, `createdAt`, `fetchSchedule`
- **Components**: PascalCase (English) - `LoginForm`, `StudentList`, `ScheduleCalendar`
- **Constants**: UPPER_SNAKE_CASE - `MAX_FILE_SIZE`, `API_TIMEOUT`
- **CSS Classes**: kebab-case - `login-form`, `submit-button`
- **API Routes**: kebab-case - `/api/telegram/webhook`, `/api/schedules`

### Comments & Documentation
- **All comments MUST be in Russian** (except code documentation in English where standard)
- Explain "why", not "what"
- Use `//` for single-line, `/* */` for multi-line

### TypeScript Guidelines
- Strict typing required (tsconfig strict mode enabled)
- Export shared types from `lib/types.ts`
- Use interfaces for data structures
- Validation schemas in `lib/validations.ts` using Zod

### Component Guidelines
- Use **Server Components by default** (Next.js 16 App Router)
- Use **Client Components** only when necessary (`'use client'`):
  - State management (useState, useReducer)
  - Effects (useEffect, useLayoutEffect)
  - Event handlers (onClick, onChange)
  - Browser APIs (window, document)
  - Custom hooks that use client features
- Always use translation keys for text content

## Testing Guidelines

### Test Structure
- **Unit tests**: `__tests__/unit/` - Test pure functions, utilities, helpers
- **Integration tests**: `__tests__/integration/` - Test API routes, database operations
- **E2E tests**: Use Playwright for end-to-end testing
- **Coverage**: Focus on business logic in `lib/` and `hooks/` directories

### Running Single Tests
```bash
# Run specific test file
npm test path/to/test.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should validate user"

# Run single test suite with watch
npm run test:watch -- path/to/test.test.ts
```

### Test Configuration
- Jest config: `jest.config.js`
- Playwright config: `playwright.config.ts`
- Test setup: `jest.setup.js`
- Coverage excludes UI components and Next.js pages

## Security Considerations

1. **Authentication**: All protected routes require NextAuth session
2. **Authorization**: Use role hierarchy from `lib/api-helpers.ts`
3. **SQL Injection**: Prisma provides automatic protection
4. **XSS**: React provides automatic escaping
5. **CSRF**: NextAuth handles CSRF tokens
6. **Input Validation**: All API inputs validated with Zod schemas (`lib/validations.ts`)
7. **Activity Logging**: Use `logActivity()` from `lib/activity-log.ts` for audit trail

## Environment Variables

Required variables (see `.env.example`):
```env
DATABASE_URL              # PostgreSQL connection string
NEXTAUTH_SECRET          # NextAuth secret key
NEXTAUTH_URL             # Application URL
TELEGRAM_BOT_TOKEN       # Telegram bot token (optional)
TELEGRAM_WEBHOOK_URL     # Telegram webhook URL (optional)
MAX_BOT_TOKEN            # Max messenger token (optional)
MAX_WEBHOOK_URL          # Max webhook URL (optional)
OPENAI_API_KEY           # OpenAI API key (optional, for bot)
```

## Common Patterns

### Creating New API Route
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-helpers'
import { ApiErrors } from '@/lib/api-error'
import { prisma } from '@/lib/db'
import { createSchema } from '@/lib/validations'
import { logActivity } from '@/lib/activity-log'

export async function POST(req: NextRequest) {
  try {
    // Проверка аутентификации и роли
    const session = await requireRole('lector')

    // Валидация входных данных
    const body = await req.json()
    const validatedData = createSchema.parse(body)

    // Бизнес-логика
    const result = await prisma.entity.create({
      data: validatedData
    })

    // Логирование активности
    await logActivity(
      session.user.id,
      'CREATE',
      'Entity',
      result.id,
      `Created entity: ${result.name}`
    )

    return NextResponse.json({ data: result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ApiErrors.badRequest('Invalid input', error.errors)
    }
    throw ApiErrors.internal('Failed to create entity')
  }
}
```

### Adding New Translation Keys
1. Add key to `messages/ru.json`:
```json
{
  "myFeature": {
    "title": "Название функции",
    "description": "Описание функции"
  }
}
```

2. Use in component:
```typescript
const t = useTranslations()
<h1>{t('myFeature.title')}</h1>
```

## Troubleshooting

### Common Issues

**Prisma Client Not Generated**:
```bash
npx prisma generate
```

**Database Out of Sync**:
```bash
npx prisma migrate reset  # WARNING: Deletes all data
npx prisma db seed
```

**Telegram/Max Bot Not Receiving Updates**:
- Check webhook URL is publicly accessible
- Verify bot token in environment variables
- Check bot settings in database via `/api/telegram/config` or `/api/max/config`

**Type Errors After Schema Changes**:
```bash
npx prisma generate  # Regenerate types
npm run build        # Rebuild project
```

**Tests Failing Due to Cron Initialization**:
- Ensure cron jobs check `process.env.NODE_ENV !== 'test'`
- Check `lib/cron/init.ts` has proper guards

## Important Notes

1. **Route naming**: Use `lector` (not `teacher`) for teacher routes
2. **Max messenger**: `chatId` is a string, not a number (unlike Telegram)
3. **Subgroups**: Groups can have multiple subgroups for lab/seminar divisions
4. **Activity logging**: Log all significant user actions for audit trail
5. **Password changes**: Use `mustChangePassword` flag for forced password resets
6. **Deployment**: Prisma generate runs automatically on build via `npm run build`
7. **Russian language**: Comments in Russian, but code/variables in English (standard practice)
