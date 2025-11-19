# ADR-003: NextAuth.js для аутентификации

**Статус**: ✅ Принято  
**Дата**: Январь 2024  
**Авторы**: Павел Шершнёв  
**Связи**: [[Аутентификация]], [[User]], [[Middleware аутентификации]]

## Контекст и проблема

Системе требуется надежная аутентификация и авторизация с поддержкой:
- Email/Password authentication
- JWT сессии
- Role-based access control (RBAC)
- Защита API routes
- Защита страниц через middleware
- Возможность добавления OAuth провайдеров в будущем

## Рассмотренные варианты

### 1. NextAuth.js ✅
**Описание**: Де-факто стандарт аутентификации для Next.js

**Плюсы**:
- ✅ Разработан специально для Next.js
- ✅ Поддержка JWT и Database sessions
- ✅ Встроенная интеграция с Prisma
- ✅ Легкое добавление OAuth провайдеров
- ✅ Callbacks для кастомизации
- ✅ Автоматические API endpoints (`/api/auth/*`)
- ✅ TypeScript поддержка
- ✅ Активное сообщество

**Минусы**:
- ⚠️ Может быть избыточным для простых случаев
- ⚠️ Специфичная конфигурация

### 2. Auth0
**Описание**: SaaS решение для аутентификации

**Плюсы**:
- ✅ Полнофункциональный из коробки
- ✅ Managed service

**Минусы**:
- ❌ Платный (при масштабировании)
- ❌ Зависимость от внешнего сервиса
- ❌ Избыточен для университетского проекта

### 3. Passport.js
**Описание**: Middleware для Node.js

**Плюсы**:
- ✅ Гибкий

**Минусы**:
- ❌ Не оптимизирован для Next.js
- ❌ Больше настройки
- ❌ Нужна интеграция с API Routes

### 4. Собственное решение
**Описание**: JWT + bcrypt вручную

**Плюсы**:
- ✅ Полный контроль

**Минусы**:
- ❌ Больше кода для поддержки
- ❌ Безопасность на нашей ответственности
- ❌ Нужно реализовывать все функции

## Решение

**Выбран NextAuth.js**

### Обоснование

1. **Интеграция с Next.js**: Разработан специально для Next.js App Router и Pages Router

2. **Prisma Adapter**: Встроенная поддержка Prisma для хранения sessions

3. **JWT Strategy**: Легковесные сессии без нагрузки на БД

4. **Расширяемость**: Легко добавить Google/GitHub OAuth в будущем

5. **RBAC**: Простая реализация через callbacks

## Архитектура

### Конфигурация
**Файл**: `lib/auth.ts`

```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './db'
import bcrypt from 'bcrypt'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 дней
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  }
}
```

### API Route
**Файл**: `app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

### Middleware Protection
**Файл**: `middleware.ts`

```typescript
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Проверка доступа к /admin
    if (path.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Проверка доступа к /Lector
    if (path.startsWith('/Lector') && token?.role !== 'lector') {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // И т.д. для других ролей
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: ['/admin/:path*', '/student/:path*', '/Lector/:path*', '/mentor/:path*']
}
```

## Модели данных

### User
**Модель**: [[User]]

Основная модель с полем `role`:
```prisma
model User {
  id       String @id @default(cuid())
  email    String @unique
  password String
  role     String @default("student")
  // ...
}
```

### Account (NextAuth)
Для OAuth провайдеров (будущее использование):
```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(...)
}
```

### Session (опционально)
Для database sessions (не используем, т.к. JWT):
```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(...)
}
```

## TypeScript типы

**Файл**: `types/next-auth.d.ts`

```typescript
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
```

## Использование в компонентах

### Server Component
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }
  
  return <div>Привет, {session.user.name}!</div>
}
```

### Client Component
```typescript
'use client'

import { useSession } from 'next-auth/react'

export function UserProfile() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>Загрузка...</div>
  if (status === 'unauthenticated') return <div>Не авторизован</div>
  
  return <div>Email: {session.user.email}</div>
}
```

### API Route
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Логика
}
```

## Последствия

### Положительные

- ✅ **Быстрая реализация**: Аутентификация работает из коробки
- ✅ **Безопасность**: Проверенное решение с best practices
- ✅ **Расширяемость**: Легко добавить OAuth провайдеры
- ✅ **Type-safety**: Полная типизация сессий
- ✅ **Middleware**: Автоматическая защита роутов

### Негативные

- ⚠️ **Специфичная конфигурация**: Нужно изучить API NextAuth
- ⚠️ **Callbacks**: Иногда сложно понять порядок выполнения
- ⚠️ **Обновления**: Breaking changes между major версиями

### Смягчения

1. **Документация**: Все конфигурации в [[Аутентификация]]
2. **Типизация**: Строгие TypeScript типы предотвращают ошибки
3. **Централизация**: Вся auth логика в `lib/auth.ts`

## Примеры использования

### Вход в систему
```typescript
// components/auth/login-form.tsx
import { signIn } from 'next-auth/react'

async function handleSubmit(email: string, password: string) {
  const result = await signIn('credentials', {
    email,
    password,
    redirect: false
  })
  
  if (result?.error) {
    toast.error('Неверный email или пароль')
  } else {
    router.push('/dashboard')
  }
}
```

### Выход из системы
```typescript
// components/auth/logout-button.tsx
import { signOut } from 'next-auth/react'

<button onClick={() => signOut({ callbackUrl: '/login' })}>
  Выйти
</button>
```

### Проверка роли
```typescript
// Функция-helper
export function hasRole(session: Session | null, role: string): boolean {
  return session?.user?.role === role
}

// Использование
if (hasRole(session, 'admin')) {
  // Показать админ-функции
}
```

## Безопасность

### Хеширование паролей
- ✅ bcrypt с 10 salt rounds
- ✅ Пароли никогда не логируются
- ✅ Хеши не передаются на frontend

### JWT Security
- ✅ Подписаны через NEXTAUTH_SECRET
- ✅ HttpOnly cookies (защита от XSS)
- ✅ SameSite=Lax (защита от CSRF)
- ✅ Secure в production (только HTTPS)

### Environment Variables
```bash
NEXTAUTH_URL=https://shked.example.com
NEXTAUTH_SECRET=<strong-random-secret>  # openssl rand -base64 32
```

## Влияние на другие компоненты

### Затронутые области
- [[User]] - модель с ролями
- [[Middleware аутентификации]] - защита роутов
- [[API Routes]] - проверка auth в каждом endpoint
- [[Admin]] / [[Student]] / [[Lector]] / [[Mentor]] - ролевой доступ
- [[Login форма]] - UI для входа

### Связанные решения
- [[ADR-001 Next.js 14 App Router]] - интеграция с Next.js
- [[ADR-002 Prisma ORM]] - хранение пользователей

## Ссылки

### Документация
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [NextAuth.js with Next.js 13/14](https://next-auth.js.org/configuration/nextjs)
- [Prisma Adapter](https://authjs.dev/reference/adapter/prisma)

### Внутренние ресурсы
- [[Аутентификация]] - общая документация
- [[User]] - модель пользователя
- [[Middleware аутентификации]] - защита роутов

## История обновлений

- **2024-01**: Первоначальное решение
- **2024-02**: Добавлена JWT strategy
- **2024-10**: Обновлены TypeScript типы

---

#adr #architecture #authentication #nextauth #security #decision

