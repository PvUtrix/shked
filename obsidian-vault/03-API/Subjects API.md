# Subjects API

> REST API для управления предметами/дисциплинами

## Обзор

Subjects API предоставляет endpoints для создания, чтения, обновления и удаления предметов ([[Subject]]) с привязкой к преподавателям ([[Lector]]).

**Модель**: [[Subject]], [[User]]

## Base URL

```
/api/subjects
```

## Endpoints

### 📋 GET /api/subjects

Получение списка предметов.

#### Права доступа
- ✅ Все авторизованные пользователи

#### Query Parameters

| Параметр | Тип | Описание |
|----------|-----|----------|
| `lector` | `boolean` | Только предметы преподавателя |

#### Response

```typescript
{
  subjects: [
    {
      id: string
      name: string
      description?: string
      instructor?: string  // Устаревшее поле
      lectorId?: string
      isActive: boolean
      createdAt: Date
      updatedAt: Date
      lector?: {
        id: string
        name: string
        firstName?: string
        lastName?: string
        email: string
      }
      _count: {
        schedules: number
        homework: number
      }
    }
  ]
}
```

#### Примеры запросов

```typescript
// Получить все предметы
const response = await fetch('/api/subjects', {
  method: 'GET',
  credentials: 'include'
})

// Получить предметы преподавателя
const response = await fetch('/api/subjects?lector=true', {
  method: 'GET',
  credentials: 'include'
})
```

---

### ➕ POST /api/subjects

Создание нового предмета.

#### Права доступа
- ✅ [[Admin]] - может создавать
- ✅ [[Lector]] - может создавать (автоматически назначается lectorId)

#### Request Body

```typescript
{
  name: string         // Обязательно
  description?: string
  instructor?: string  // Устаревшее, используйте lectorId
  lectorId?: string    // ID преподавателя (только для admin)
}
```

#### Response

```typescript
{
  id: string
  name: string
  description?: string
  instructor?: string
  lectorId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lector?: User
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/subjects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Алгоритмы и структуры данных',
    description: 'Курс по основам алгоритмов',
    lectorId: 'lector-user-id'  // Только для admin
  })
})

const subject = await response.json()
```

---

### ✏️ PUT /api/subjects

Обновление предмета.

#### Права доступа
- ✅ [[Admin]] - может обновлять любые предметы
- ✅ [[Lector]] - может обновлять только свои предметы

#### Request Body

```typescript
{
  id: string           // Обязательно
  name?: string
  description?: string
  instructor?: string
  lectorId?: string    // Только для admin
}
```

#### Response

```typescript
{
  id: string
  // ... полные данные предмета
  lector?: User
}
```

---

### 🗑️ DELETE /api/subjects

Мягкое удаление предмета (устанавливает `isActive = false`).

#### Права доступа
- ✅ [[Admin]] - может удалять
- ✅ [[Lector]] - может удалять свои предметы

#### Query Parameters

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | `string` | ID предмета (обязательно) |

#### Response

```typescript
{
  message: 'Предмет удален'
}
```

---

## Модель данных

```prisma
model Subject {
  id          String   @id @default(cuid())
  name        String
  description String?
  instructor  String?  // Устаревшее
  lectorId    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  lector      User?     @relation(...)
  schedules   Schedule[]
  homework    Homework[]
}
```

## Связанные заметки

### Модели
- [[Subject]] - предмет/дисциплина
- [[User]] - преподаватель
- [[Schedule]] - расписание по предмету
- [[Homework]] - домашние задания по предмету

### Роли
- [[Admin]] - полный доступ
- [[Lector]] - управление своими предметами

## Файлы

- **API**: `app/api/subjects/route.ts`
- **Схема**: `prisma/schema.prisma`

---

#api #rest #subjects #crud

