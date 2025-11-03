# Groups API

> REST API для управления учебными группами

## Обзор

Groups API предоставляет endpoints для создания, чтения, обновления и удаления учебных групп ([[Group]]), а также управления студентами и их подгруппами.

**Модель**: [[Group]], [[UserGroup]]  
**Функция**: [[Управление расписанием]], [[Система подгрупп]]

## Base URL

```
/api/groups
```

## Аутентификация

Все endpoints требуют аутентификации через NextAuth.js сессию.

## Endpoints

### 📋 GET /api/groups

Получение списка всех групп.

#### Права доступа
- ✅ [[Admin]] - все группы
- ✅ [[Lector]] - все группы
- ✅ [[Mentor]] - только свои группы (TODO: фильтрация по mentorGroupIds)
- ✅ [[Student]] - все группы (для просмотра)

#### Query Parameters

| Параметр | Тип | Описание |
|----------|-----|----------|
| `mentor` | `boolean` | Фильтровать по группам ментора |

#### Response

```typescript
{
  groups: [
    {
      id: string
      name: string
      description?: string
      semester?: number
      year?: number
      isActive: boolean
      createdAt: Date
      updatedAt: Date
      users: User[]  // Студенты и менторы группы
      _count: {
        users: number
        schedules: number
        homework: number
      }
    }
  ]
}
```

#### Пример запроса

```typescript
// Получить все группы
const response = await fetch('/api/groups', {
  method: 'GET',
  credentials: 'include'
})

const data = await response.json()
console.log(data.groups)
```

```typescript
// Получить группы ментора
const response = await fetch('/api/groups?mentor=true', {
  method: 'GET',
  credentials: 'include'
})
```

#### Статусы ответа

- `200` - Успешно
- `401` - Не авторизован
- `500` - Внутренняя ошибка сервера

---

### ➕ POST /api/groups

Создание новой группы.

#### Права доступа
- ✅ [[Admin]] - может создавать

#### Request Body

```typescript
{
  name: string         // Обязательно
  description?: string
  semester?: number
  year?: number
}
```

#### Response

```typescript
{
  id: string
  name: string
  description?: string
  semester?: number
  year?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    users: number
    schedules: number
    homework: number
  }
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/groups', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Б05-123',
    description: 'Бакалавриат 5 курс, группа 123',
    semester: 9,
    year: 2024
  })
})

const group = await response.json()
```

#### Статусы ответа

- `201` - Группа создана
- `400` - Неверные данные (отсутствует name)
- `403` - Доступ запрещен (не admin)
- `500` - Внутренняя ошибка сервера

---

### ✏️ PUT /api/groups

Обновление существующей группы.

#### Права доступа
- ✅ [[Admin]] - может обновлять

#### Request Body

```typescript
{
  id: string           // Обязательно
  name?: string
  description?: string
  semester?: number
  year?: number
}
```

#### Response

```typescript
{
  id: string
  name: string
  description?: string
  semester?: number
  year?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    users: number
    schedules: number
    homework: number
  }
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/groups', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    id: 'group-id',
    name: 'Б05-124',
    semester: 10
  })
})

const group = await response.json()
```

#### Статусы ответа

- `200` - Группа обновлена
- `400` - Неверные данные (отсутствует id)
- `403` - Доступ запрещен (не admin)
- `404` - Группа не найдена
- `500` - Внутренняя ошибка сервера

---

### 🗑️ DELETE /api/groups

Мягкое удаление группы (устанавливает `isActive = false`).

#### Права доступа
- ✅ [[Admin]] - может удалять

#### Query Parameters

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | `string` | ID группы (обязательно) |

#### Response

```typescript
{
  message: 'Группа удалена'
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/groups?id=group-id', {
  method: 'DELETE',
  credentials: 'include'
})

const result = await response.json()
```

#### Статусы ответа

- `200` - Группа удалена
- `400` - Отсутствует ID
- `403` - Доступ запрещен (не admin)
- `404` - Группа не найдена
- `500` - Внутренняя ошибка сервера

---

### 👥 GET /api/groups/[id]/students

Получение студентов группы с их подгруппами.

#### Права доступа
- ✅ [[Admin]] - все группы
- ✅ [[Mentor]] - только свои группы
- ✅ [[Lector]] - все группы

#### Response

```typescript
{
  students: [
    {
      id: string
      name: string
      email: string
      userGroup?: {
        subgroupCommerce?: number
        subgroupTutorial?: number
        subgroupFinance?: number
        subgroupSystemThinking?: number
      }
    }
  ]
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/groups/group-id/students', {
  method: 'GET',
  credentials: 'include'
})

const data = await response.json()
console.log(data.students)
```

---

### 🔢 PUT /api/groups/[id]/students/[studentId]/subgroups

Назначение подгрупп студенту.

**Функция**: [[Система подгрупп]]

#### Права доступа
- ✅ [[Admin]] - может назначать

#### Request Body

```typescript
{
  subgroupCommerce?: number      // 1, 2, ...
  subgroupTutorial?: number      // 1, 2, 3, ...
  subgroupFinance?: number       // 1, 2, ...
  subgroupSystemThinking?: number // 1, 2, ...
}
```

#### Response

```typescript
{
  id: string
  userId: string
  groupId: string
  subgroupCommerce?: number
  subgroupTutorial?: number
  subgroupFinance?: number
  subgroupSystemThinking?: number
  createdAt: Date
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/groups/group-id/students/student-id/subgroups', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    subgroupCommerce: 1,
    subgroupTutorial: 2,
    subgroupFinance: 1,
    subgroupSystemThinking: 2
  })
})

const userGroup = await response.json()
```

#### Статусы ответа

- `200` - Подгруппы назначены
- `400` - Неверные данные
- `403` - Доступ запрещен
- `404` - Студент или группа не найдены
- `500` - Внутренняя ошибка сервера

---

## Модели данных

### Group

```prisma
model Group {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  semester    Int?
  year        Int?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  users       User[]
  schedules   Schedule[]
  homework    Homework[]
  userGroups  UserGroup[]
}
```

### UserGroup

```prisma
model UserGroup {
  id                     String   @id @default(cuid())
  userId                 String
  groupId                String
  subgroupCommerce       Int?
  subgroupTutorial       Int?
  subgroupFinance        Int?
  subgroupSystemThinking Int?
  createdAt              DateTime @default(now())
  
  group                  Group    @relation(...)
  user                   User     @relation(...)

  @@unique([userId, groupId])
}
```

## Использование в компонентах

### Получение списка групп

```tsx
// app/admin/groups/page.tsx
export default async function GroupsPage() {
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/groups`, {
    cache: 'no-store'
  })
  
  const { groups } = await response.json()
  
  return (
    <div>
      {groups.map(group => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  )
}
```

### Создание группы

```tsx
// components/admin/group-form.tsx
async function handleSubmit(data: GroupFormData) {
  const response = await fetch('/api/groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  
  if (response.ok) {
    const group = await response.json()
    router.push(`/admin/groups/${group.id}`)
  }
}
```

## Обработка ошибок

```typescript
try {
  const response = await fetch('/api/groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(groupData)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error)
  }
  
  const group = await response.json()
  return group
  
} catch (error) {
  console.error('Ошибка при создании группы:', error)
  toast.error(error.message)
}
```

## Связанные заметки

### Модели
- [[Group]] - учебная группа
- [[UserGroup]] - связь студента с группой
- [[User]] - студенты и менторы
- [[Schedule]] - расписание группы
- [[Homework]] - домашние задания группы

### Функции
- [[Система подгрупп]] - управление подгруппами
- [[Управление расписанием]] - расписание для групп

### Компоненты
- [[group-form.tsx]] - форма создания/редактирования группы

### ADR
- [[ADR-006 Система подгрупп]] - архитектурное решение

### Роли
- [[Admin]] - полный доступ
- [[Mentor]] - только свои группы
- [[Lector]] - просмотр групп
- [[Student]] - просмотр групп

## Файлы

- **API**: `app/api/groups/route.ts`
- **API подгрупп**: `app/api/groups/[id]/students/[studentId]/subgroups/route.ts`
- **Схема**: `prisma/schema.prisma`
- **Типы**: `lib/types.ts`

---

#api #rest #groups #crud #subgroups

