# ADR-001: Использование Next.js 14 App Router

**Статус**: ✅ Принято  
**Дата**: Январь 2024  
**Авторы**: Павел Шершнёв  
**Связи**: [[Технологический стек]], [[App Router структура]], [[Карта проекта]]

## Контекст и проблема

При разработке веб-платформы Шкед необходимо было выбрать фреймворк, который обеспечит:
- Server-Side Rendering (SSR) для SEO
- Производительность и быструю загрузку
- Удобную работу с TypeScript
- Масштабируемую архитектуру
- API endpoints из коробки
- Активное сообщество и документацию

## Рассмотренные варианты

### 1. Next.js 14 App Router ✅
**Описание**: Современный фреймворк от Vercel с новой парадигмой App Router

**Плюсы**:
- ✅ React Server Components (RSC) по умолчанию
- ✅ Улучшенная производительность через streaming
- ✅ Встроенный роутинг API через `/api`
- ✅ TypeScript из коробки
- ✅ Автоматическая оптимизация (code splitting, lazy loading)
- ✅ SEO-friendly SSR/SSG
- ✅ Middleware для защиты роутов
- ✅ Layouts и nested routing
- ✅ Активная поддержка и документация
- ✅ Простая интеграция с Prisma и NextAuth

**Минусы**:
- ⚠️ Новая парадигма (learning curve для команды)
- ⚠️ Некоторые библиотеки несовместимы с RSC (требуют "use client")
- ⚠️ Меньше примеров и Stack Overflow ответов по App Router

### 2. Next.js Pages Router
**Описание**: Традиционный подход Next.js

**Плюсы**:
- ✅ Проверенный временем
- ✅ Больше примеров и туториалов
- ✅ Проще для начинающих

**Минусы**:
- ❌ Устаревает (фокус Vercel на App Router)
- ❌ Нет Server Components
- ❌ Хуже производительность
- ❌ Более сложная структура `getServerSideProps`

### 3. React + Vite + Express
**Описание**: SPA на Vite + отдельный Express сервер

**Плюсы**:
- ✅ Полный контроль над архитектурой
- ✅ Быстрый dev server (Vite)

**Минусы**:
- ❌ Нет SSR из коробки (плохо для SEO)
- ❌ Больше настройки (routing, API, auth)
- ❌ Две кодовые базы (frontend + backend)
- ❌ Сложнее деплой

## Решение

**Выбран Next.js 14 App Router**

### Обоснование

1. **Производительность**: RSC позволяют рендерить компоненты на сервере, уменьшая bundle size и ускоряя загрузку

2. **Масштабируемость**: App Router упрощает организацию кода через layouts, loading.tsx, error.tsx

3. **SEO**: SSR из коробки критичен для университетской платформы

4. **TypeScript**: Первоклассная поддержка типов, включая автогенерацию из Prisma

5. **API интеграция**: Единая кодовая база для frontend и backend упрощает разработку

6. **Экосистема**: Легкая интеграция с:
   - [[Prisma ORM]] для БД
   - [[NextAuth.js аутентификация]] для auth
   - [[Tailwind CSS]] для UI
   - [[Radix UI]] для компонентов

## Последствия

### Положительные

- ✅ **Быстрая разработка**: Не нужно настраивать routing, API, SSR
- ✅ **Лучший DX**: Hot reload, TypeScript, встроенные инструменты
- ✅ **Производительность**: Automatic code splitting, image optimization
- ✅ **Единая кодовая база**: Frontend и backend в одном проекте

### Негативные

- ⚠️ **Learning curve**: Команде нужно изучить RSC и новые конвенции
- ⚠️ **"use client" директивы**: Нужно помечать интерактивные компоненты
- ⚠️ **Vendor lock-in**: Зависимость от Next.js и Vercel экосистемы

### Смягчения негативных последствий

1. **Обучение команды**: Документация в [[Паттерны разработки]], примеры в коде
2. **Четкие конвенции**: [[Server Components паттерн]] и [[Client Components паттерн]]
3. **Минимизация vendor lock-in**: Бизнес-логика в отдельных модулях (`lib/`), легко портировать

## Влияние на другие компоненты

### Затронутые области
- [[Структура проекта]] - организация папок по App Router
- [[Admin компоненты]] - использование Server Components где возможно
- [[Student компоненты]] - использование Server Components где возможно
- [[API Routes]] - все в `app/api/`
- [[Middleware аутентификации]] - защита роутов через middleware.ts
- [[Deployment]] - оптимизация для Vercel/Docker

### Связанные решения
- [[ADR-002 Prisma ORM]] - легкая интеграция с Next.js
- [[ADR-003 NextAuth.js аутентификация]] - разработана для Next.js
- [[ADR-007 Tailwind + Radix UI]] - совместимы с RSC

## Примеры использования

### Server Component (по умолчанию)
```typescript
// app/admin/groups/page.tsx
import { prisma } from '@/lib/db'

export default async function GroupsPage() {
  const groups = await prisma.group.findMany() // Запрос на сервере
  
  return (
    <div>
      {groups.map(group => (
        <div key={group.id}>{group.name}</div>
      ))}
    </div>
  )
}
```

### Client Component (интерактивность)
```typescript
// components/admin/group-form.tsx
'use client'

import { useState } from 'react'

export function GroupForm() {
  const [name, setName] = useState('')
  
  return (
    <form>
      <input value={name} onChange={(e) => setName(e.target.value)} />
    </form>
  )
}
```

### API Route
```typescript
// app/api/groups/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const groups = await prisma.group.findMany()
  return NextResponse.json({ data: groups })
}
```

## Ссылки

### Документация
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)

### Внутренние ресурсы
- [[Технологический стек]]
- [[Структура проекта]]
- [[Server Components паттерн]]
- [[Client Components паттерн]]

### Официальная документация проекта
- [docs/development/STRUCTURE.md](../../docs/development/STRUCTURE.md)

## История обновлений

- **2024-01**: Первоначальное решение
- **2024-10**: Подтверждено после 10 месяцев использования

---

#adr #architecture #nextjs #decision #core

