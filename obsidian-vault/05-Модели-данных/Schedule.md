# Schedule (Модель данных)

> Модель расписания занятий

## Описание

Модель `Schedule` представляет отдельное занятие (пару) в расписании. Занятие привязано к предмету, группе и может быть для конкретной подгруппы.

## Prisma Schema

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
  group       Group?   @relation(fields: [groupId], references: [id], onDelete: Cascade)
  subject     Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)

  @@map("schedules")
}
```

## Поля модели

### Связи
- `subjectId` - ID предмета ([[Subject]])
- `groupId` - ID группы ([[Group]]) (опционально)
- `subgroupId` - ID/номер подгруппы ("1", "2", "3" или null для всей группы)

### Время
- `date` - дата занятия (DateTime)
- `dayOfWeek` - день недели (0-6, где 0 = воскресенье)
- `startTime` - время начала (String формат "HH:MM", например "10:00")
- `endTime` - время окончания (String формат "HH:MM", например "11:30")

### Место и тип
- `location` - аудитория/место проведения (например "Ауд. 123", "Zoom")
- `eventType` - тип занятия (например "Лекция", "Семинар", "Практика", "Лабораторная")
- `description` - дополнительное описание

### Статус
- `isActive` - активно ли занятие

### Timestamps
- `createdAt` - дата создания
- `updatedAt` - дата последнего обновления

## Связи (Relations)

### Many-to-One
- [[Subject]] - предмет занятия (обязательно)
- [[Group]] - группа студентов (опционально)

### Через связи
- [[User]] - студенты группы
- [[User]] - лектор через Subject

## API Endpoints

**API**: [[Schedules API]]

### Основные операции
- `GET /api/schedules` - список расписания
  - Query params: `groupId`, `subjectId`, `date`, `startDate`, `endDate`
- `GET /api/schedules/[id]` - детали занятия
- `POST /api/schedules` - создать занятие (admin only)
- `PUT /api/schedules/[id]` - обновить занятие (admin only)
- `DELETE /api/schedules/[id]` - удалить занятие (admin only)

## Компоненты

### Admin компоненты
- [[schedule-form.tsx]] - форма создания/редактирования занятия

### Student компоненты
- Календарный вид расписания
- Список расписания

## TypeScript типы

```typescript
// lib/types.ts
export interface Schedule {
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
}

export interface ScheduleWithRelations extends Schedule {
  subject: Subject
  group?: Group
}

export type EventType = 'Лекция' | 'Семинар' | 'Практика' | 'Лабораторная' | 'Консультация' | 'Экзамен'

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6
```

## Подгруппы

**Документация**: [[Система подгрупп]]  
**ADR**: [[ADR-006 Система подгрупп]]

### Значения subgroupId
- `null` - занятие для всей группы
- `"1"` - только для подгруппы 1
- `"2"` - только для подгруппы 2
- `"3"` - только для подгруппы 3

### Фильтрация для студента
```typescript
// Студент видит только:
// 1. Занятия для всей группы (subgroupId = null)
// 2. Занятия для своей подгруппы по каждому предмету

const schedules = await prisma.schedule.findMany({
  where: {
    groupId: student.groupId,
    OR: [
      { subgroupId: null },
      {
        subject: { name: 'Коммерция' },
        subgroupId: userGroup.subgroupCommerce?.toString()
      },
      // ... для других предметов
    ]
  }
})
```

## Примеры использования

### Создание занятия
```typescript
const schedule = await prisma.schedule.create({
  data: {
    subjectId: 'subject-id',
    groupId: 'group-id',
    subgroupId: '1', // или null для всей группы
    date: new Date('2024-11-01T10:00:00'),
    dayOfWeek: 4, // четверг (0 = воскресенье)
    startTime: '10:00',
    endTime: '11:30',
    location: 'Ауд. 123',
    eventType: 'Лекция',
    description: 'Введение в алгоритмы'
  }
})
```

### Получение расписания группы на неделю
```typescript
const startOfWeek = new Date('2024-11-04')
const endOfWeek = new Date('2024-11-10')

const schedules = await prisma.schedule.findMany({
  where: {
    groupId: groupId,
    date: {
      gte: startOfWeek,
      lte: endOfWeek
    },
    isActive: true
  },
  include: {
    subject: {
      include: {
        lector: {
          select: {
            name: true,
            email: true
          }
        }
      }
    }
  },
  orderBy: [
    { date: 'asc' },
    { startTime: 'asc' }
  ]
})
```

### Получение расписания на конкретный день
```typescript
const today = new Date()
today.setHours(0, 0, 0, 0)
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

const todaySchedule = await prisma.schedule.findMany({
  where: {
    groupId: groupId,
    date: {
      gte: today,
      lt: tomorrow
    }
  },
  include: {
    subject: {
      include: {
        lector: true
      }
    }
  },
  orderBy: {
    startTime: 'asc'
  }
})
```

### Получение расписания лектора
```typescript
const lectorSchedule = await prisma.schedule.findMany({
  where: {
    subject: {
      lectorId: lectorId
    },
    date: {
      gte: new Date()
    }
  },
  include: {
    subject: true,
    group: true
  },
  orderBy: [
    { date: 'asc' },
    { startTime: 'asc' }
  ]
})
```

### Обновление занятия
```typescript
await prisma.schedule.update({
  where: { id: scheduleId },
  data: {
    location: 'Ауд. 456',
    startTime: '11:00',
    endTime: '12:30',
    description: 'Обновленное описание'
  }
})
```

### Отмена занятия
```typescript
await prisma.schedule.update({
  where: { id: scheduleId },
  data: {
    isActive: false
  }
})
```

### Массовое создание расписания
```typescript
// Создать занятия на весь семестр
const scheduleData = []
const startDate = new Date('2024-09-01')
const endDate = new Date('2024-12-31')

for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 7)) {
  scheduleData.push({
    subjectId: 'subject-id',
    groupId: 'group-id',
    date: new Date(date),
    dayOfWeek: date.getDay(),
    startTime: '10:00',
    endTime: '11:30',
    location: 'Ауд. 123',
    eventType: 'Лекция'
  })
}

await prisma.schedule.createMany({
  data: scheduleData
})
```

## Валидация

### Zod схема
```typescript
import { z } from 'zod'

export const scheduleSchema = z.object({
  subjectId: z.string().cuid(),
  groupId: z.string().cuid().optional(),
  subgroupId: z.string().optional(),
  date: z.date(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Формат HH:MM'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Формат HH:MM'),
  location: z.string().max(100).optional(),
  eventType: z.enum(['Лекция', 'Семинар', 'Практика', 'Лабораторная', 'Консультация', 'Экзамен']).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true)
}).refine(data => {
  // Проверка что endTime > startTime
  const [startHour, startMin] = data.startTime.split(':').map(Number)
  const [endHour, endMin] = data.endTime.split(':').map(Number)
  return endHour * 60 + endMin > startHour * 60 + startMin
}, {
  message: 'Время окончания должно быть позже времени начала',
  path: ['endTime']
})
```

## Уведомления

**Система**: [[Telegram интеграция]]

### Автоматические напоминания
- За 30 минут до занятия - уведомление студентам и лектору
- При изменении расписания - уведомление всем участникам
- Дневные сводки в 7:00 - расписание на день

### Пример отправки
```typescript
// За 30 минут до занятия
const upcomingSchedules = await prisma.schedule.findMany({
  where: {
    date: {
      gte: now,
      lte: in30Minutes
    },
    isActive: true
  },
  include: {
    subject: {
      include: {
        lector: {
          include: {
            telegramUser: true
          }
        }
      }
    },
    group: {
      include: {
        users: {
          where: {
            role: 'student'
          },
          include: {
            telegramUser: true
          }
        }
      }
    }
  }
})

for (const schedule of upcomingSchedules) {
  await sendScheduleReminder(schedule)
}
```

## Статистика

### Для группы
```typescript
const scheduleStats = await prisma.schedule.groupBy({
  by: ['eventType'],
  where: {
    groupId: groupId,
    date: {
      gte: startDate,
      lte: endDate
    }
  },
  _count: {
    id: true
  }
})

// Результат: { eventType: 'Лекция', _count: { id: 20 } }
```

### Загруженность аудиторий
```typescript
const locationStats = await prisma.schedule.groupBy({
  by: ['location'],
  where: {
    date: {
      gte: new Date(),
      lte: endOfWeek
    }
  },
  _count: {
    id: true
  },
  orderBy: {
    _count: {
      id: 'desc'
    }
  }
})
```

## Связанные заметки

### Модели
- [[Subject]] - предмет занятия
- [[Group]] - группа студентов
- [[User]] - студенты и лектор
- [[UserGroup]] - подгруппы студентов

### Функции
- [[Управление расписанием]] - создание и просмотр расписания
- [[Система подгрупп]] - фильтрация по подгруппам
- [[Telegram интеграция]] - уведомления о занятиях

### API
- [[Schedules API]] - endpoints для работы с расписанием

### ADR
- [[ADR-006 Система подгрупп]] - подгруппы в расписании

### Роли
- [[Admin]] - управление расписанием
- [[Student]] - просмотр расписания
- [[Lector]] - просмотр своего расписания

## Файлы

- **Схема**: `prisma/schema.prisma`
- **Типы**: `lib/types.ts`
- **API**: `app/api/schedules/route.ts`
- **Компоненты**: `components/admin/schedule-form.tsx`
- **Страницы**: 
  - `app/admin/schedule/page.tsx`
  - `app/student/page.tsx`
  - `app/student/calendar/page.tsx`

## Форматы времени

### В БД
- `date`: DateTime (ISO 8601)
- `startTime`: String "HH:MM"
- `endTime`: String "HH:MM"
- `dayOfWeek`: Number (0-6)

### В UI
```typescript
// Форматирование для отображения
const formatTime = (time: string) => time // "10:00"
const formatDate = (date: Date) => 
  new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
// "понедельник, 4 ноября 2024 г."
```

---

#model #prisma #schedule #timetable

