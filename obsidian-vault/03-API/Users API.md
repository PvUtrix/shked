# Users API

> REST API для управления пользователями системы

## Обзор

Users API предоставляет endpoints для создания, чтения, обновления и удаления пользователей ([[User]]) с поддержкой различных ролей.

**Модель**: [[User]], [[Group]]  
**Роли**: [[Admin]], [[Student]], [[Teacher]], [[Mentor]]

## Base URL

```
/api/users
```

## Endpoints

### 📋 GET /api/users

Получение списка пользователей с фильтрацией.

#### Права доступа
- ✅ [[Admin]] - все пользователи
- ✅ [[Teacher]] - все пользователи (просмотр)
- ✅ [[Mentor]] - студенты своих групп
- ✅ [[Student]] - все пользователи (просмотр для коллаборации)

#### Query Parameters

| Параметр | Тип | Описание |
|----------|-----|----------|
| `role` | `string` | Фильтр по роли: `admin`, `student`, `teacher`, `mentor` |
| `groupId` | `string` | Фильтр по группе |
| `mentor` | `boolean` | Только студенты групп ментора |

#### Response

```typescript
{
  users: [
    {
      id: string
      name: string
      email: string
      firstName?: string
      lastName?: string
      role: 'admin' | 'student' | 'teacher' | 'mentor'
      groupId?: string
      createdAt: Date
      group?: {
        id: string
        name: string
      }
    }
  ]
}
```

#### Примеры запросов

```typescript
// Получить всех пользователей
const response = await fetch('/api/users', {
  method: 'GET',
  credentials: 'include'
})

// Получить только студентов
const response = await fetch('/api/users?role=student', {
  method: 'GET',
  credentials: 'include'
})

// Получить пользователей группы
const response = await fetch('/api/users?groupId=group-id', {
  method: 'GET',
  credentials: 'include'
})

// Получить студентов групп ментора
const response = await fetch('/api/users?mentor=true', {
  method: 'GET',
  credentials: 'include'
})
```

#### Статусы ответа

- `200` - Успешно
- `401` - Не авторизован
- `500` - Внутренняя ошибка сервера

---

### ➕ POST /api/users

Создание нового пользователя.

#### Права доступа
- ✅ [[Admin]] - может создавать

#### Request Body

```typescript
{
  email: string           // Обязательно, уникальный
  password: string        // Обязательно (будет хеширован)
  name?: string
  firstName?: string
  lastName?: string
  role?: 'admin' | 'student' | 'teacher' | 'mentor'  // По умолчанию 'student'
  groupId?: string        // Для студентов
}
```

#### Response

```typescript
{
  user: {
    id: string
    name: string
    email: string
    firstName?: string
    lastName?: string
    role: string
    groupId?: string
    createdAt: Date
  }
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'ivan.ivanov@phystech.edu',
    password: 'SecurePassword123',
    firstName: 'Иван',
    lastName: 'Иванов',
    role: 'student',
    groupId: 'group-id'
  })
})

const { user } = await response.json()
```

#### Статусы ответа

- `201` - Пользователь создан
- `400` - Неверные данные (отсутствуют email/password или email уже существует)
- `403` - Доступ запрещен (не admin)
- `404` - Группа не найдена
- `500` - Внутренняя ошибка сервера

---

### ✏️ PUT /api/users

Обновление пользователя.

#### Права доступа
- ✅ [[Admin]] - может обновлять

#### Request Body

```typescript
{
  id: string              // Обязательно
  name?: string
  firstName?: string
  lastName?: string
  // Другие поля в зависимости от реализации
}
```

#### Response

```typescript
{
  user: {
    id: string
    name: string
    email: string
    firstName?: string
    lastName?: string
    role: string
    groupId?: string
    createdAt: Date
  }
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/users', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    id: 'user-id',
    firstName: 'Иван',
    lastName: 'Петров'
  })
})

const { user } = await response.json()
```

#### Статусы ответа

- `200` - Пользователь обновлен
- `400` - Неверные данные
- `403` - Доступ запрещен
- `404` - Пользователь не найден
- `500` - Внутренняя ошибка сервера

---

### 🗑️ DELETE /api/users

Мягкое удаление пользователя (устанавливает `isActive = false`).

#### Права доступа
- ✅ [[Admin]] - может удалять (кроме себя)

#### Query Parameters

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | `string` | ID пользователя (обязательно) |

#### Response

```typescript
{
  message: 'Пользователь деактивирован'
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/users?id=user-id', {
  method: 'DELETE',
  credentials: 'include'
})

const result = await response.json()
```

#### Статусы ответа

- `200` - Пользователь удален
- `400` - Попытка удалить самого себя или отсутствует ID
- `403` - Доступ запрещен
- `404` - Пользователь не найден
- `500` - Внутренняя ошибка сервера

---

### 👤 GET /api/profile

Получение профиля текущего пользователя.

#### Права доступа
- ✅ Все авторизованные пользователи

#### Response

```typescript
{
  id: string
  name: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  groupId?: string
  createdAt: Date
  group?: {
    id: string
    name: string
  }
  telegramUser?: {
    username?: string
    isActive: boolean
    notifications: boolean
  }
  // Для менторов:
  mentorGroupIds?: string[]
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/profile', {
  method: 'GET',
  credentials: 'include'
})

const profile = await response.json()
```

---

### 🔐 PUT /api/users/[id]/role

Изменение роли пользователя.

#### Права доступа
- ✅ [[Admin]] - может изменять роли

#### Request Body

```typescript
{
  role: 'admin' | 'student' | 'teacher' | 'mentor'
}
```

#### Response

```typescript
{
  user: {
    id: string
    // ... полные данные пользователя
    role: string
  }
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/users/user-id/role', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    role: 'mentor'
  })
})
```

---

## Модель данных

### User

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String?
  firstName     String?
  lastName      String?
  role          String    @default("student")
  groupId       String?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  group         Group?    @relation(...)
  telegramUser  TelegramUser?
  userGroups    UserGroup[]
  homeworkSubmissions HomeworkSubmission[]
  homeworkComments    HomeworkComment[]
  subjectsAsTeacher    Subject[]
}
```

## Роли пользователей

**Документация**: [[User#Роли пользователей]]

### admin
- Полный доступ ко всем функциям
- Управление пользователями, группами, предметами
- Доступ: `/admin/*`

### student
- Просмотр расписания
- Сдача домашних заданий
- Доступ: `/student/*`

### teacher
- Создание домашних заданий и расписания
- Проверка работ студентов
- Доступ: `/teacher/*`

### mentor
- Просмотр расписания своих групп
- Помощь студентам с домашними заданиями
- Комментарии к работам
- Доступ: `/mentor/*`

## Аутентификация

**ADR**: [[ADR-003 NextAuth.js аутентификация]]

Система использует NextAuth.js с Credentials Provider:

```typescript
// Вход в систему
const result = await signIn('credentials', {
  email: 'user@example.com',
  password: 'password',
  redirect: false
})

if (result?.ok) {
  router.push('/dashboard')
}
```

## Связанные заметки

### Модели
- [[User]] - пользователь системы
- [[Group]] - группа студента
- [[TelegramUser]] - привязка Telegram
- [[UserGroup]] - подгруппы студента

### Роли
- [[Admin]] - администратор
- [[Student]] - студент
- [[Teacher]] - преподаватель
- [[Mentor]] - ментор

### ADR
- [[ADR-003 NextAuth.js аутентификация]] - архитектурное решение

### Функции
- [[Telegram интеграция]] - привязка Telegram аккаунта

## Файлы

- **API**: `app/api/users/route.ts`
- **API роли**: `app/api/users/[id]/role/route.ts`
- **API профиля**: `app/api/profile/route.ts`
- **Аутентификация**: `lib/auth.ts`
- **Схема**: `prisma/schema.prisma`

---

#api #rest #users #auth #roles #crud

