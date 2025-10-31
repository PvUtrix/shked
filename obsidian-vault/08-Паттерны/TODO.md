# TODO: Документация паттернов

> Задача на будущее: задокументировать архитектурные паттерны проекта

## Зачем нужно

Документация паттернов поможет разработчикам:
- Писать код в едином стиле
- Понимать когда использовать Server/Client Components
- Правильно создавать API routes
- Следовать best practices проекта

## Список паттернов для документирования

### Next.js 14 паттерны (приоритет: высокий)
- [ ] **Server Components** - когда и как использовать
- [ ] **Client Components** - когда нужен 'use client'
- [ ] **API Routes** - структура и best practices
- [ ] **Middleware** - защита роутов

### Prisma паттерны (приоритет: высокий)
- [ ] **Queries** - типичные запросы с include/select
- [ ] **Transactions** - работа с транзакциями
- [ ] **Relations** - загрузка связанных данных

### Auth паттерны (приоритет: средний)
- [ ] **Session handling** - работа с сессией
- [ ] **Role checking** - проверка ролей в API
- [ ] **Protected pages** - защита страниц

### UI паттерны (приоритет: низкий)
- [ ] **Form handling** - работа с формами
- [ ] **Data fetching** - загрузка данных
- [ ] **Error handling** - обработка ошибок

## Формат документации

Создавать файлы в `obsidian-vault/08-Паттерны/`

```markdown
# Паттерн: Название

> Краткое описание паттерна

## Когда использовать

Описание ситуаций когда нужен этот паттерн.

## Пример

\`\`\`typescript
// Хороший пример
const goodExample = () => {
  // ...
}
\`\`\`

## Антипаттерны

\`\`\`typescript
// ❌ Плохо
const badExample = () => {
  // ...
}
\`\`\`

## Связанные заметки

- [[Related ADR]]
- [[Related Component]]

## Файлы-примеры

- `app/path/to/example.tsx`
```

## Приоритет 1: Next.js паттерны

### Server Components

```markdown
# Server Components Pattern

## Когда использовать

- По умолчанию для всех компонентов
- Когда нужен прямой доступ к БД
- Для SEO-критичных страниц
- Когда не нужна интерактивность

## Пример

\`\`\`tsx
// app/student/homework/page.tsx
export default async function HomeworkPage() {
  // Прямой доступ к БД
  const homework = await prisma.homework.findMany({
    where: { groupId: session.user.groupId },
    include: { subject: true }
  })
  
  return <HomeworkList homework={homework} />
}
\`\`\`

## Преимущества

- ✅ Не увеличивает bundle size
- ✅ Прямой доступ к БД
- ✅ SEO friendly
- ✅ Лучшая производительность

## Когда НЕ использовать

- ❌ Нужны React hooks (useState, useEffect)
- ❌ Нужна интерактивность (onClick, onChange)
- ❌ Нужны Browser APIs (window, localStorage)

---

**Связано**: [[ADR-001 Next.js 14 App Router]]
```

### Client Components

```markdown
# Client Components Pattern

## Когда использовать

- Нужны React hooks
- Интерактивность (клики, формы)
- Browser APIs
- Сторонние библиотеки с browser APIs

## Пример

\`\`\`tsx
'use client'

import { useState } from 'react'

export function HomeworkSubmissionForm() {
  const [content, setContent] = useState('')
  
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    
    await fetch('/api/homework/submit', {
      method: 'POST',
      body: JSON.stringify({ content })
    })
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <textarea value={content} onChange={e => setContent(e.target.value)} />
      <button type="submit">Сдать</button>
    </form>
  )
}
\`\`\`

## Best Practices

- ✅ Использовать как можно "ниже" в дереве компонентов
- ✅ Выносить в отдельные файлы
- ✅ Минимизировать логику в Client Components

## Антипаттерны

\`\`\`tsx
// ❌ Плохо: весь layout - Client Component
'use client'

export default function Layout({ children }) {
  const [state, setState] = useState()
  return <div>{children}</div>
}

// ✅ Хорошо: только интерактивная часть
export default function Layout({ children }) {
  return (
    <div>
      <ServerComponent />
      <InteractiveButton /> {/* Client Component */}
      {children}
    </div>
  )
}
\`\`\`

---

**Связано**: [[ADR-001 Next.js 14 App Router]]
```

### API Route Pattern

```markdown
# API Route Pattern

## Структура

\`\`\`typescript
// app/api/resource/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  // 1. Аутентификация
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }
  
  // 2. Авторизация (проверка роли)
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
  }
  
  // 3. Валидация query params
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'ID обязателен' }, { status: 400 })
  }
  
  // 4. Бизнес-логика
  try {
    const data = await prisma.model.findUnique({
      where: { id }
    })
    
    if (!data) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
    }
    
    // 5. Успешный ответ
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Ошибка:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
\`\`\`

## Коды статусов

- `200` - OK (GET, PUT)
- `201` - Created (POST)
- `400` - Bad Request (валидация)
- `401` - Unauthorized (не авторизован)
- `403` - Forbidden (нет прав)
- `404` - Not Found
- `500` - Internal Server Error

---

**Связано**: [[Карта API]]
```

## Оценка времени

- Next.js паттерны: 4 файла × 15 мин = **60 минут**
- Prisma паттерны: 3 файла × 10 мин = **30 минут**
- Auth паттерны: 3 файла × 10 мин = **30 минут**
- UI паттерны: 3 файла × 8 мин = **24 минуты**

**Итого**: ~2.5 часа для всех паттернов

## Как начать

```bash
# Создать папку
mkdir obsidian-vault/08-Паттерны

# Начать с Server Components
# Создать obsidian-vault/08-Паттерны/Server Components.md
```

---

**Статус**: ⏳ TODO  
**Создано**: 2024-11-05  
**Ответственный**: Разработчик документации

