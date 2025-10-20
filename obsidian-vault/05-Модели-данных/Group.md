# Group (Модель данных)

> Модель учебных групп студентов

## Описание

Модель `Group` представляет учебную группу в университете. Группа содержит студентов и имеет свое расписание занятий.

## Prisma Schema

```prisma
model Group {
  id          String      @id @default(cuid())
  name        String      @unique
  description String?
  semester    String?
  year        String?
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  schedules   Schedule[]
  userGroups  UserGroup[]
  users       User[]
  homework    Homework[]

  @@map("groups")
}
```

## Поля модели

### Основные поля
- `id` - уникальный идентификатор (CUID)
- `name` - название группы (уникальное, например "Б05-123")
- `description` - описание группы (опционально)

### Учебный период
- `semester` - семестр (например, "1", "2", "осенний", "весенний")
- `year` - учебный год (например, "2024-2025")

### Статус
- `isActive` - активна ли группа (для архивации)

### Timestamps
- `createdAt` - дата создания
- `updatedAt` - дата последнего обновления

## Связи (Relations)

### One-to-Many
- [[User]][] - студенты группы (через `groupId`)
- [[Schedule]][] - расписание занятий группы
- [[UserGroup]][] - связь студентов с подгруппами
- [[Homework]][] - домашние задания для группы

## Подгруппы

**Документация**: [[Система подгрупп]]  
**ADR**: [[ADR-006 Система подгрупп]]

Студенты одной группы могут быть разделены на подгруппы для разных предметов через модель [[UserGroup]].

## API Endpoints

**API**: [[Groups API]]

### Основные операции
- `GET /api/groups` - список групп
- `GET /api/groups/[id]` - детали группы
- `POST /api/groups` - создать группу (admin only)
- `PUT /api/groups/[id]` - обновить группу (admin only)
- `DELETE /api/groups/[id]` - удалить группу (admin only)

### Подгруппы
- `GET /api/groups/[id]/students` - студенты группы с подгруппами
- `PUT /api/groups/[id]/students/[studentId]/subgroups` - назначить подгруппы

## Компоненты

### Admin компоненты
- [[group-form.tsx]] - форма создания/редактирования группы
- [[admin-nav.tsx]] - навигация админа

## TypeScript типы

```typescript
// lib/types.ts
export interface Group {
  id: string
  name: string
  description?: string
  semester?: string
  year?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface GroupWithRelations extends Group {
  users: User[]
  schedules: Schedule[]
  userGroups: UserGroup[]
  homework: Homework[]
}

export interface GroupWithStats extends Group {
  studentCount: number
  scheduleCount: number
  homeworkCount: number
}
```

## Права доступа

### Admin
- ✅ CRUD всех групп
- ✅ Назначение менторов к группам
- ✅ Управление студентами в группе

### Lector
- ✅ Просмотр групп для своих предметов
- ❌ Создание/редактирование групп

### Mentor
- ✅ Просмотр своих групп
- ✅ Просмотр студентов своих групп
- ❌ Создание/редактирование групп

### Student
- ✅ Просмотр информации о своей группе
- ❌ Просмотр других групп
- ❌ Создание/редактирование групп

## Примеры использования

### Создание группы
```typescript
const group = await prisma.group.create({
  data: {
    name: 'Б05-123',
    description: 'Магистратура ФУПМ 2024',
    semester: '1',
    year: '2024-2025',
    isActive: true
  }
})
```

### Получение группы со студентами
```typescript
const group = await prisma.group.findUnique({
  where: { id: groupId },
  include: {
    users: {
      where: { isActive: true },
      orderBy: { lastName: 'asc' }
    },
    schedules: {
      where: {
        date: {
          gte: new Date()
        }
      },
      include: {
        subject: true
      }
    }
  }
})
```

### Получение групп с количеством студентов
```typescript
const groups = await prisma.group.findMany({
  where: { isActive: true },
  include: {
    users: {
      where: { role: 'student' }
    },
    _count: {
      select: {
        users: true,
        schedules: true,
        homework: true
      }
    }
  }
})

const groupsWithStats = groups.map(group => ({
  ...group,
  studentCount: group.users.length,
  scheduleCount: group._count.schedules,
  homeworkCount: group._count.homework
}))
```

### Обновление группы
```typescript
await prisma.group.update({
  where: { id: groupId },
  data: {
    name: 'Б05-123 (обновлено)',
    description: 'Новое описание'
  }
})
```

### Архивация группы
```typescript
await prisma.group.update({
  where: { id: groupId },
  data: {
    isActive: false
  }
})
```

### Добавление студента в группу
```typescript
await prisma.user.update({
  where: { id: studentId },
  data: {
    groupId: groupId
  }
})

// Или создание связи через UserGroup с подгруппами
await prisma.userGroup.create({
  data: {
    userId: studentId,
    groupId: groupId,
    subgroupCommerce: 1,
    subgroupTutorial: 2
  }
})
```

### Получение расписания группы
```typescript
const schedules = await prisma.schedule.findMany({
  where: {
    groupId: groupId,
    date: {
      gte: startDate,
      lte: endDate
    }
  },
  include: {
    subject: {
      include: {
        lector: {
          select: { name: true }
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

## Валидация

### Zod схема
```typescript
import { z } from 'zod'

export const groupSchema = z.object({
  name: z.string()
    .min(1, 'Название обязательно')
    .max(50, 'Максимум 50 символов')
    .regex(/^[А-Яа-я0-9\-]+$/, 'Только русские буквы, цифры и дефис'),
  description: z.string().max(500).optional(),
  semester: z.string().optional(),
  year: z.string()
    .regex(/^\d{4}-\d{4}$/, 'Формат: 2024-2025')
    .optional(),
  isActive: z.boolean().default(true)
})
```

## Назначение ментора

Ментор назначается к группе через поле `mentorGroupIds` в модели [[User]]:

```typescript
// Назначить ментора к группе
await prisma.user.update({
  where: { id: mentorId },
  data: {
    mentorGroupIds: [...existingGroupIds, newGroupId]
  }
})

// Получить все группы ментора
const mentorGroups = await prisma.group.findMany({
  where: {
    id: {
      in: mentor.mentorGroupIds as string[]
    }
  },
  include: {
    users: {
      where: { role: 'student' }
    }
  }
})
```

## Статистика

### Для админа
```typescript
const groupStats = await prisma.group.findUnique({
  where: { id: groupId },
  include: {
    _count: {
      select: {
        users: true,
        schedules: true,
        homework: true
      }
    }
  }
})

console.log({
  students: groupStats._count.users,
  schedules: groupStats._count.schedules,
  homework: groupStats._count.homework
})
```

### Активность группы
```typescript
const activityStats = await prisma.$queryRaw`
  SELECT 
    g.name,
    COUNT(DISTINCT u.id) as student_count,
    COUNT(DISTINCT s.id) as schedule_count,
    COUNT(DISTINCT h.id) as homework_count,
    COUNT(DISTINCT hs.id) as submission_count
  FROM groups g
  LEFT JOIN users u ON u.group_id = g.id AND u.role = 'student'
  LEFT JOIN schedules s ON s.group_id = g.id
  LEFT JOIN homework h ON h.group_id = g.id
  LEFT JOIN homework_submissions hs ON hs.homework_id = h.id
  WHERE g.id = ${groupId}
  GROUP BY g.id, g.name
`
```

## Связанные заметки

### Модели
- [[User]] - студенты группы
- [[Schedule]] - расписание группы
- [[UserGroup]] - связь с подгруппами
- [[Homework]] - домашние задания
- [[Subject]] - предметы

### Роли
- [[Admin]] - управление группами
- [[Student]] - принадлежность к группе
- [[Mentor]] - назначение к группам

### Функции
- [[Управление расписанием]] - создание расписания для группы
- [[Система подгрупп]] - разделение на подгруппы

### API
- [[Groups API]] - endpoints для работы с группами

### ADR
- [[ADR-006 Система подгрупп]] - подгруппы в группах

## Файлы

- **Схема**: `prisma/schema.prisma`
- **Типы**: `lib/types.ts`
- **API**: `app/api/groups/route.ts`, `app/api/groups/[id]/route.ts`
- **Компоненты**: `components/admin/group-form.tsx`
- **Страницы**: `app/admin/groups/page.tsx`

## Именование групп

### Конвенции
- **Бакалавриат**: `Б[курс][номер]` (например, `Б01-123`, `Б05-456`)
- **Магистратура**: `М[курс][номер]` (например, `М01-789`, `М02-012`)
- **Аспирантура**: `А[курс][номер]` (например, `А01-345`)

### Примеры
- `Б05-123` - Бакалавриат, 5 курс, группа 123
- `М01-789` - Магистратура, 1 курс, группа 789

---

#model #prisma #group #core

