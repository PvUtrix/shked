# Schedules API

> REST API для управления расписанием занятий

## Обзор

Schedules API предоставляет endpoints для создания, чтения, обновления и удаления расписания занятий ([[Schedule]]) с поддержкой фильтрации по группам и подгруппам.

**Модель**: [[Schedule]], [[Subject]], [[Group]]  
**Функция**: [[Управление расписанием]], [[Система подгрупп]]

## Base URL

```
/api/schedules
```

## Endpoints

### 📋 GET /api/schedules

Получение списка расписания с фильтрацией.

#### Права доступа
- ✅ [[Admin]] - все занятия
- ✅ [[Lector]] - занятия по своим предметам
- ✅ [[Mentor]] - занятия своих групп
- ✅ [[Student]] - занятия своей группы с учетом подгрупп

#### Query Parameters

| Параметр | Тип | Описание |
|----------|-----|----------|
| `subjectId` | `string` | Фильтр по предмету |
| `groupId` | `string` | Фильтр по группе |
| `date` | `string` | Фильтр по дате (ISO 8601) |
| `lector` | `boolean` | Только занятия преподавателя |
| `mentor` | `boolean` | Только занятия групп ментора |

#### Response

```typescript
{
  schedules: [
    {
      id: string
      subjectId: string
      groupId?: string
      subgroupId?: string  // null = вся группа, "1"/"2"/"3" = подгруппа
      date: Date
      dayOfWeek: number  // 0-6 (0 = воскресенье)
      startTime: string  // "10:00"
      endTime: string    // "11:30"
      location?: string  // "Ауд. 123"
      eventType?: string // "Лекция", "Семинар", "Лабораторная"
      description?: string
      isActive: boolean
      createdAt: Date
      updatedAt: Date
      subject: {
        id: string
        name: string
      }
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
// Получить расписание студента на сегодня
const today = new Date().toISOString().split('T')[0]
const response = await fetch(`/api/schedules?date=${today}`, {
  method: 'GET',
  credentials: 'include'
})

// Получить расписание преподавателя
const response = await fetch('/api/schedules?lector=true', {
  method: 'GET',
  credentials: 'include'
})

// Получить расписание группы
const response = await fetch('/api/schedules?groupId=group-id', {
  method: 'GET',
  credentials: 'include'
})
```

#### Фильтрация по подгруппам для студентов

Система автоматически фильтрует расписание для студентов:
- Показывает занятия для всей группы (`subgroupId = null`)
- Показывает занятия подгруппы студента по каждому предмету

**Функция**: [[Система подгрупп#Фильтрация расписания для студента]]

#### Статусы ответа

- `200` - Успешно
- `401` - Не авторизован
- `500` - Внутренняя ошибка сервера

---

### ➕ POST /api/schedules

Создание занятия в расписании.

#### Права доступа
- ✅ [[Admin]] - может создавать
- ✅ [[Lector]] - может создавать

#### Request Body

```typescript
{
  subjectId: string    // Обязательно
  groupId?: string
  subgroupId?: string  // "1", "2", "3" или null (вся группа)
  date: Date | string  // Обязательно
  startTime: string    // Обязательно, формат "HH:mm"
  endTime: string      // Обязательно, формат "HH:mm"
  location?: string
  eventType?: string
  description?: string
}
```

#### Response

```typescript
{
  id: string
  subjectId: string
  groupId?: string
  subgroupId?: string
  date: Date
  dayOfWeek: number
  startTime: string
  endTime: string
  location?: string
  eventType?: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  subject: {
    id: string
    name: string
  }
  group?: {
    id: string
    name: string
  }
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/schedules', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    subjectId: 'subject-id',
    groupId: 'group-id',
    subgroupId: '1',  // Только для подгруппы 1
    date: '2024-11-05',
    startTime: '10:00',
    endTime: '11:30',
    location: 'Ауд. 123',
    eventType: 'Семинар',
    description: 'Практическая работа по алгоритмам'
  })
})

const schedule = await response.json()
```

#### Статусы ответа

- `201` - Занятие создано
- `400` - Неверные данные
- `403` - Доступ запрещен
- `404` - Предмет или группа не найдены
- `500` - Внутренняя ошибка сервера

---

### ✏️ PUT /api/schedules

Обновление занятия в расписании.

#### Права доступа
- ✅ [[Admin]] - может обновлять
- ✅ [[Lector]] - может обновлять

#### Request Body

```typescript
{
  id: string           // Обязательно
  subjectId?: string
  groupId?: string
  subgroupId?: string
  date?: Date | string
  startTime?: string
  endTime?: string
  location?: string
  eventType?: string
  description?: string
}
```

#### Response

```typescript
{
  id: string
  // ... полные данные занятия с relations
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/schedules', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    id: 'schedule-id',
    location: 'Ауд. 456',
    startTime: '11:00'
  })
})

const schedule = await response.json()
```

#### Статусы ответа

- `200` - Занятие обновлено
- `400` - Неверные данные
- `403` - Доступ запрещен
- `404` - Занятие, предмет или группа не найдены
- `500` - Внутренняя ошибка сервера

---

### 🗑️ DELETE /api/schedules

Мягкое удаление занятия (устанавливает `isActive = false`).

#### Права доступа
- ✅ [[Admin]] - может удалять
- ✅ [[Lector]] - может удалять

#### Query Parameters

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | `string` | ID занятия (обязательно) |

#### Response

```typescript
{
  message: 'Расписание удалено'
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/schedules?id=schedule-id', {
  method: 'DELETE',
  credentials: 'include'
})

const result = await response.json()
```

#### Статусы ответа

- `200` - Занятие удалено
- `400` - Отсутствует ID
- `403` - Доступ запрещен
- `404` - Занятие не найдено
- `500` - Внутренняя ошибка сервера

---

## Модель данных

### Schedule

```prisma
model Schedule {
  id          String   @id @default(cuid())
  subjectId   String
  groupId     String?
  subgroupId  String?
  date        DateTime
  dayOfWeek   Int
  startTime   String
  endTime     String
  location    String?
  eventType   String?
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  subject     Subject
  group       Group?
}
```

## Типы событий

Стандартные типы занятий:
- **Лекция** - теоретическое занятие для всей группы
- **Семинар** - практическое занятие, обычно по подгруппам
- **Лабораторная** - лабораторная работа
- **Консультация** - консультация перед экзаменом
- **Экзамен** - экзамен или зачет

## Уведомления

**Функция**: [[Telegram интеграция#Напоминания о занятиях]]

Система автоматически отправляет напоминания:
- За 30 минут до занятия (настраивается в [[BotSettings]])
- Дневные сводки в 7:00 (настраивается)

```typescript
// Напоминание за 30 минут
await sendScheduleReminder(userId, {
  subject: 'Математический анализ',
  startTime: '10:00',
  endTime: '11:30',
  location: 'Ауд. 123'
})
```

## Использование в компонентах

### Получение расписания на день

```tsx
// app/student/calendar/page.tsx
export default async function CalendarPage() {
  const today = new Date().toISOString().split('T')[0]
  
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/schedules?date=${today}`, {
    cache: 'no-store'
  })
  
  const { schedules } = await response.json()
  
  return (
    <div>
      <h1>Расписание на сегодня</h1>
      {schedules.map(schedule => (
        <ScheduleCard key={schedule.id} schedule={schedule} />
      ))}
    </div>
  )
}
```

### Создание занятия с подгруппой

```tsx
// components/admin/schedule-form.tsx
async function handleSubmit(data: ScheduleFormData) {
  const response = await fetch('/api/schedules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...data,
      subgroupId: data.isSubgroup ? data.subgroupId : null
    })
  })
  
  if (response.ok) {
    toast.success('Занятие создано')
    router.push('/admin/schedule')
  }
}
```

## Связанные заметки

### Модели
- [[Schedule]] - расписание занятий
- [[Subject]] - предмет
- [[Group]] - группа
- [[UserGroup]] - подгруппы студента

### Функции
- [[Управление расписанием]] - детальное описание
- [[Система подгрупп]] - фильтрация по подгруппам
- [[Telegram интеграция]] - уведомления

### Компоненты
- [[schedule-form.tsx]] - форма создания/редактирования

### ADR
- [[ADR-006 Система подгрупп]] - архитектурное решение

### Роли
- [[Admin]] - полный доступ
- [[Lector]] - создание и редактирование
- [[Mentor]] - просмотр расписания групп
- [[Student]] - просмотр своего расписания

## Файлы

- **API**: `app/api/schedules/route.ts`
- **Схема**: `prisma/schema.prisma`
- **Типы**: `lib/types.ts`

---

#api #rest #schedule #calendar #subgroups #crud

