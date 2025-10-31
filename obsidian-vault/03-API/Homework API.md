# Homework API

> REST API для управления домашними заданиями и проверкой работ студентов

## Обзор

Homework API предоставляет endpoints для создания домашних заданий ([[Homework]]), сдачи работ студентами ([[HomeworkSubmission]]), проверки работ преподавателями и работы с комментариями ([[HomeworkComment]]).

**Модель**: [[Homework]], [[HomeworkSubmission]], [[HomeworkComment]]  
**Функция**: [[Система домашних заданий]]  
**ADR**: [[ADR-005 MDX для домашних заданий]]

## Base URL

```
/api/homework
```

## Аутентификация

Все endpoints требуют аутентификации через NextAuth.js сессию.

## Endpoints

### 📋 GET /api/homework

Получение списка домашних заданий с фильтрацией и пагинацией.

#### Права доступа
- ✅ [[Admin]] - все задания
- ✅ [[Teacher]] - задания по своим предметам
- ✅ [[Mentor]] - задания групп ментора
- ✅ [[Student]] - задания своей группы

#### Query Parameters

| Параметр | Тип | Описание |
|----------|-----|----------|
| `subjectId` | `string` | Фильтр по предмету |
| `groupId` | `string` | Фильтр по группе |
| `status` | `string` | Статус для студента: `not_submitted`, `submitted`, `reviewed`, `returned` |
| `teacher` | `boolean` | Только задания преподавателя |
| `mentor` | `boolean` | Только задания групп ментора |
| `page` | `number` | Номер страницы (по умолчанию `1`) |
| `limit` | `number` | Количество на странице (по умолчанию `10`) |

#### Response

```typescript
{
  homework: [
    {
      id: string
      title: string
      description?: string
      content?: string  // MDX контент
      taskUrl?: string
      deadline: Date
      materials: string[]
      isActive: boolean
      createdAt: Date
      updatedAt: Date
      subjectId: string
      groupId?: string
      subject: Subject
      group?: Group
      submissions: HomeworkSubmission[]  // Для студента - только своя работа
      _count: {
        submissions: number
      }
    }
  ],
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
```

#### Примеры запросов

```typescript
// Получить все задания студента
const response = await fetch('/api/homework', {
  method: 'GET',
  credentials: 'include'
})

// Получить задания по предмету
const response = await fetch('/api/homework?subjectId=subject-id', {
  method: 'GET',
  credentials: 'include'
})

// Получить несданные задания студента
const response = await fetch('/api/homework?status=not_submitted', {
  method: 'GET',
  credentials: 'include'
})

// Получить задания преподавателя
const response = await fetch('/api/homework?teacher=true', {
  method: 'GET',
  credentials: 'include'
})
```

#### Статусы ответа

- `200` - Успешно
- `401` - Не авторизован
- `500` - Внутренняя ошибка сервера

---

### ➕ POST /api/homework

Создание нового домашнего задания.

#### Права доступа
- ✅ [[Admin]] - может создавать для любого предмета
- ✅ [[Teacher]] - может создавать для своих предметов

#### Request Body

```typescript
{
  title: string           // Обязательно
  description?: string
  content?: string        // MDX контент задания
  taskUrl?: string        // Ссылка на внешнее задание
  deadline: Date | string // Обязательно
  materials?: string[]    // Ссылки на материалы
  subjectId: string       // Обязательно
  groupId?: string        // Опционально (null = для всех групп)
}
```

#### Response

```typescript
{
  id: string
  title: string
  description?: string
  content?: string
  taskUrl?: string
  deadline: Date
  materials: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  subjectId: string
  groupId?: string
  subject: Subject
  group?: Group
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/homework', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    title: 'Лабораторная работа №1',
    description: 'Реализация алгоритма сортировки',
    content: '# Задание\n\nРеализуйте быструю сортировку...',
    deadline: '2024-11-30T23:59:00',
    materials: [
      'https://example.com/lecture1.pdf',
      'https://example.com/examples.zip'
    ],
    subjectId: 'subject-id',
    groupId: 'group-id'
  })
})

const homework = await response.json()
```

#### Статусы ответа

- `201` - Задание создано
- `400` - Неверные данные (отсутствуют title, subjectId или deadline)
- `403` - Доступ запрещен
- `404` - Предмет или группа не найдены
- `500` - Внутренняя ошибка сервера

---

### 🔍 GET /api/homework/[id]

Получение конкретного домашнего задания.

#### Права доступа
- ✅ [[Admin]] - любое задание
- ✅ [[Teacher]] - любое задание
- ✅ [[Mentor]] - задания своих групп
- ✅ [[Student]] - задания своей группы

#### Response

```typescript
{
  id: string
  title: string
  description?: string
  content?: string
  taskUrl?: string
  deadline: Date
  materials: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  subjectId: string
  groupId?: string
  subject: Subject
  group?: Group
  submissions: HomeworkSubmission[]
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/homework/homework-id', {
  method: 'GET',
  credentials: 'include'
})

const homework = await response.json()
```

#### Статусы ответа

- `200` - Успешно
- `401` - Не авторизован
- `403` - Доступ запрещен (студент пытается получить задание не своей группы)
- `404` - Задание не найдено
- `500` - Внутренняя ошибка сервера

---

### ✏️ PUT /api/homework/[id]

Обновление домашнего задания.

#### Права доступа
- ✅ [[Admin]] - любое задание
- ✅ [[Teacher]] - задания по своим предметам

#### Request Body

```typescript
{
  title?: string
  description?: string
  content?: string
  taskUrl?: string
  deadline?: Date | string
  materials?: string[]
  subjectId?: string
  groupId?: string
}
```

#### Response

```typescript
{
  id: string
  title: string
  // ... полные данные задания с relations
  submissions: HomeworkSubmission[]
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/homework/homework-id', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    deadline: '2024-12-15T23:59:00',
    content: '# Обновленное задание\n\n...'
  })
})

const homework = await response.json()
```

#### Статусы ответа

- `200` - Задание обновлено
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Задание, предмет или группа не найдены
- `500` - Внутренняя ошибка сервера

---

### 🗑️ DELETE /api/homework/[id]

Мягкое удаление задания (устанавливает `isActive = false`).

#### Права доступа
- ✅ [[Admin]] - может удалять

#### Response

```typescript
{
  message: 'Домашнее задание удалено'
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/homework/homework-id', {
  method: 'DELETE',
  credentials: 'include'
})

const result = await response.json()
```

#### Статусы ответа

- `200` - Задание удалено
- `401` - Не авторизован
- `403` - Доступ запрещен (не admin)
- `404` - Задание не найдено
- `500` - Внутренняя ошибка сервера

---

### 📝 GET /api/homework/[id]/submissions/[submissionId]

Получение конкретной работы студента.

#### Права доступа
- ✅ [[Admin]] - любая работа
- ✅ [[Teacher]] - работы по своим предметам
- ✅ [[Mentor]] - работы студентов своих групп
- ✅ [[Student]] - только своя работа

#### Response

```typescript
{
  id: string
  homeworkId: string
  userId: string
  content: string  // MDX контент работы
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'REVIEWED' | 'RETURNED'
  grade?: number
  feedback?: string
  submittedAt?: Date
  reviewedAt?: Date
  createdAt: Date
  updatedAt: Date
  homework: Homework
  user: User
  comments: HomeworkComment[]
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/homework/homework-id/submissions/submission-id', {
  method: 'GET',
  credentials: 'include'
})

const submission = await response.json()
```

---

### 📤 POST /api/homework/[id]/submit

Сдача/обновление работы студентом.

#### Права доступа
- ✅ [[Student]] - может сдавать свои работы

#### Request Body

```typescript
{
  content: string  // MDX контент работы
}
```

#### Response

```typescript
{
  id: string
  homeworkId: string
  userId: string
  content: string
  status: 'SUBMITTED'
  submittedAt: Date
  createdAt: Date
  updatedAt: Date
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/homework/homework-id/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    content: '# Мое решение\n\n```python\ndef quick_sort(arr):\n  ...\n```'
  })
})

const submission = await response.json()
```

#### Статусы ответа

- `200` - Работа сдана
- `400` - Пустое содержание
- `401` - Не авторизован
- `403` - Доступ запрещен (не студент или задание не для его группы)
- `404` - Задание не найдено
- `500` - Внутренняя ошибка сервера

---

### ✅ POST /api/homework/[id]/submissions/[submissionId]/review

Проверка работы студента преподавателем.

#### Права доступа
- ✅ [[Admin]] - может проверять любые работы
- ✅ [[Teacher]] - работы по своим предметам

#### Request Body

```typescript
{
  grade?: number       // Оценка (обычно 1-10)
  comment?: string     // Краткий комментарий (deprecated, используйте feedback)
  feedback?: string    // Развернутый feedback в MDX
  status?: 'REVIEWED' | 'RETURNED'  // По умолчанию 'REVIEWED'
}
```

#### Response

```typescript
{
  id: string
  homeworkId: string
  userId: string
  content: string
  status: 'REVIEWED' | 'RETURNED'
  grade?: number
  feedback?: string
  reviewedAt: Date
  createdAt: Date
  updatedAt: Date
  user: User
}
```

#### Примеры запросов

```typescript
// Проверить и поставить оценку
const response = await fetch('/api/homework/hw-id/submissions/sub-id/review', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    grade: 9,
    feedback: '# Отличная работа!\n\nАлгоритм реализован корректно...',
    status: 'REVIEWED'
  })
})

// Вернуть на доработку
const response = await fetch('/api/homework/hw-id/submissions/sub-id/review', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    feedback: 'Необходимо доработать следующие моменты:\n\n1. ...',
    status: 'RETURNED'
  })
})
```

#### Статусы ответа

- `200` - Работа проверена
- `400` - Работа не принадлежит заданию
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Работа не найдена
- `500` - Внутренняя ошибка сервера

---

### 💬 GET /api/homework/[id]/submissions/[submissionId]/comments

Получение комментариев к работе.

#### Права доступа
- ✅ [[Admin]] - все комментарии
- ✅ [[Teacher]] - комментарии к работам по своим предметам
- ✅ [[Mentor]] - комментарии к работам студентов своих групп
- ✅ [[Student]] - комментарии к своей работе

#### Response

```typescript
{
  comments: [
    {
      id: string
      submissionId: string
      authorId: string
      content: string
      lineStart: number
      lineEnd: number
      resolved: boolean
      createdAt: Date
      updatedAt: Date
      author: {
        name: string
        role: UserRole
      }
    }
  ]
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/homework/hw-id/submissions/sub-id/comments', {
  method: 'GET',
  credentials: 'include'
})

const { comments } = await response.json()
```

---

### 💬 POST /api/homework/[id]/submissions/[submissionId]/comments

Создание комментария к работе.

**Компонент**: [[inline-comment-viewer.tsx]]

#### Права доступа
- ✅ [[Admin]] - может комментировать
- ✅ [[Teacher]] - работы по своим предметам
- ✅ [[Mentor]] - работы студентов своих групп

#### Request Body

```typescript
{
  content: string      // Текст комментария
  lineStart: number    // Начальная строка
  lineEnd: number      // Конечная строка
}
```

#### Response

```typescript
{
  id: string
  submissionId: string
  authorId: string
  content: string
  lineStart: number
  lineEnd: number
  resolved: false
  createdAt: Date
  updatedAt: Date
  author: {
    name: string
    role: UserRole
  }
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/homework/hw-id/submissions/sub-id/comments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    content: 'Здесь нужно добавить обработку ошибок',
    lineStart: 15,
    lineEnd: 18
  })
})

const comment = await response.json()
```

#### Статусы ответа

- `201` - Комментарий создан
- `400` - Неверные данные
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Работа не найдена
- `500` - Внутренняя ошибка сервера

---

### ✅ PATCH /api/homework/[id]/submissions/[submissionId]/comments/[commentId]

Обновление комментария (отметить как решенный, изменить текст).

#### Права доступа
- ✅ Автор комментария
- ✅ Студент, чья работа (может отмечать как resolved)
- ✅ [[Admin]]

#### Request Body

```typescript
{
  content?: string
  resolved?: boolean
}
```

#### Response

```typescript
{
  id: string
  // ... полные данные комментария
}
```

#### Пример запроса

```typescript
// Отметить как решенный
const response = await fetch('/api/homework/hw-id/submissions/sub-id/comments/comment-id', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    resolved: true
  })
})
```

---

### 🗑️ DELETE /api/homework/[id]/submissions/[submissionId]/comments/[commentId]

Удаление комментария.

#### Права доступа
- ✅ Автор комментария
- ✅ [[Admin]]

#### Response

```typescript
{
  message: 'Комментарий удален'
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/homework/hw-id/submissions/sub-id/comments/comment-id', {
  method: 'DELETE',
  credentials: 'include'
})
```

---

## Модели данных

### Homework

```prisma
model Homework {
  id          String   @id @default(cuid())
  title       String
  description String?
  content     String?  @db.Text  // MDX
  taskUrl     String?
  deadline    DateTime
  materials   String[]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  subjectId   String
  groupId     String?
  
  subject     Subject
  group       Group?
  submissions HomeworkSubmission[]
}
```

### HomeworkSubmission

```prisma
model HomeworkSubmission {
  id           String   @id @default(cuid())
  homeworkId   String
  userId       String
  content      String   @db.Text  // MDX
  status       String   @default("NOT_SUBMITTED")
  grade        Int?
  feedback     String?  @db.Text  // MDX
  submittedAt  DateTime?
  reviewedAt   DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  homework     Homework
  user         User
  comments     HomeworkComment[]
}
```

### HomeworkComment

```prisma
model HomeworkComment {
  id           String              @id @default(cuid())
  submissionId String
  authorId     String
  content      String              @db.Text
  lineStart    Int
  lineEnd      Int
  resolved     Boolean             @default(false)
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt
  
  submission   HomeworkSubmission
  author       User
}
```

## Связанные заметки

### Модели
- [[Homework]] - домашнее задание
- [[HomeworkSubmission]] - работа студента
- [[HomeworkComment]] - комментарии к работе
- [[User]] - студенты и преподаватели
- [[Subject]] - предмет
- [[Group]] - группа

### Функции
- [[Система домашних заданий]] - детальное описание
- [[Telegram интеграция]] - уведомления о дедлайнах

### Компоненты
- [[homework-form.tsx]] - форма создания задания (teacher)
- [[homework-submission-form.tsx]] - форма сдачи работы (student)
- [[markdown-editor.tsx]] - редактор MDX
- [[markdown-viewer.tsx]] - просмотр MDX
- [[inline-comment-viewer.tsx]] - комментарии

### ADR
- [[ADR-005 MDX для домашних заданий]] - архитектурное решение

### Роли
- [[Admin]] - полный доступ
- [[Teacher]] - создание и проверка
- [[Mentor]] - помощь студентам, комментарии
- [[Student]] - сдача работ

## Файлы

- **API**: `app/api/homework/**/*.ts`
- **Схема**: `prisma/schema.prisma`
- **Типы**: `lib/types.ts`

---

#api #rest #homework #submissions #comments #mdx #crud

