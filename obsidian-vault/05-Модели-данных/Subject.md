# Subject (Модель данных)

> Модель предметов/дисциплин в системе

## Описание

Модель `Subject` представляет учебный предмет или дисциплину. Каждый предмет может иметь назначенного преподавателя (лектора).

## Prisma Schema

```prisma
model Subject {
  id          String     @id @default(cuid())
  name        String     @unique
  description String?
  instructor  String?
  lectorId    String?    // ID преподавателя
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  schedules   Schedule[]
  homework    Homework[]
  lector      User?      @relation(fields: [lectorId], references: [id])

  @@map("subjects")
}
```

## Поля модели

### Основные поля
- `id` - уникальный идентификатор (CUID)
- `name` - название предмета (уникальное, например "Математический анализ")
- `description` - описание предмета
- `instructor` - имя инструктора (устаревшее поле, используется `lectorId`)

### Преподаватель
- `lectorId` - ID пользователя с ролью `lector`
- `lector` - связь с [[User]] (преподаватель)

### Статус
- `isActive` - активен ли предмет

### Timestamps
- `createdAt` - дата создания
- `updatedAt` - дата последнего обновления

## Связи (Relations)

### Many-to-One
- [[User]] - преподаватель (лектор) через `lectorId`

### One-to-Many
- [[Schedule]][] - расписание занятий по предмету
- [[Homework]][] - домашние задания по предмету

## Примеры предметов

### МФТИ магистратура
- Коммерция
- Финансы
- Системное мышление
- Математический анализ
- Алгоритмы и структуры данных
- Машинное обучение
- Data Science

## API Endpoints

**API**: [[Subjects API]]

### Основные операции
- `GET /api/subjects` - список предметов
- `GET /api/subjects/[id]` - детали предмета
- `POST /api/subjects` - создать предмет (admin only)
- `PUT /api/subjects/[id]` - обновить предмет (admin only)
- `DELETE /api/subjects/[id]` - удалить предмет (admin only)

## Компоненты

### Admin компоненты
- [[subject-form.tsx]] - форма создания/редактирования предмета

## TypeScript типы

```typescript
// lib/types.ts
export interface Subject {
  id: string
  name: string
  description?: string
  instructor?: string
  lectorId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SubjectWithRelations extends Subject {
  lector?: User
  schedules: Schedule[]
  homework: Homework[]
}

export interface SubjectWithStats extends Subject {
  lector?: User
  scheduleCount: number
  homeworkCount: number
  studentCount: number
}
```

## Права доступа

### Admin
- ✅ CRUD всех предметов
- ✅ Назначение лекторов к предметам

### Lector
- ✅ Просмотр своих предметов
- ✅ Просмотр расписания по своим предметам
- ❌ Создание/редактирование предметов

### Student
- ✅ Просмотр предметов своей группы
- ❌ Создание/редактирование предметов

### Mentor
- ✅ Просмотр предметов своих групп
- ❌ Создание/редактирование предметов

## Примеры использования

### Создание предмета
```typescript
const subject = await prisma.subject.create({
  data: {
    name: 'Математический анализ',
    description: 'Основы математического анализа для магистрантов',
    lectorId: lectorUserId,
    isActive: true
  }
})
```

### Назначение лектора к предмету
```typescript
await prisma.subject.update({
  where: { id: subjectId },
  data: {
    lectorId: lectorUserId
  }
})
```

### Получение предметов с лекторами
```typescript
const subjects = await prisma.subject.findMany({
  where: { isActive: true },
  include: {
    lector: {
      select: {
        id: true,
        name: true,
        email: true
      }
    },
    _count: {
      select: {
        schedules: true,
        homework: true
      }
    }
  },
  orderBy: {
    name: 'asc'
  }
})
```

### Получение предметов лектора
```typescript
const mySubjects = await prisma.subject.findMany({
  where: {
    lectorId: lectorId
  },
  include: {
    homework: {
      where: {
        isActive: true
      },
      include: {
        submissions: true
      }
    },
    schedules: {
      where: {
        date: {
          gte: new Date()
        }
      }
    }
  }
})
```

### Получение предметов группы
```typescript
const groupSubjects = await prisma.subject.findMany({
  where: {
    schedules: {
      some: {
        groupId: groupId
      }
    }
  },
  include: {
    lector: {
      select: {
        name: true
      }
    }
  },
  distinct: ['id']
})
```

## Валидация

### Zod схема
```typescript
import { z } from 'zod'

export const subjectSchema = z.object({
  name: z.string()
    .min(1, 'Название обязательно')
    .max(100, 'Максимум 100 символов'),
  description: z.string()
    .max(500, 'Максимум 500 символов')
    .optional(),
  lectorId: z.string().cuid().optional(),
  isActive: z.boolean().default(true)
})
```

## Подгруппы

**Связь**: [[Система подгрупп]]

Некоторые предметы могут иметь подгруппы:
- Коммерция - 2 подгруппы
- Семинары - 3 подгруппы
- Финансы - 2 подгруппы
- Системное мышление - 2 подгруппы

Подгруппы указываются в [[UserGroup]] и [[Schedule]].

## Статистика

### Для админа
```typescript
const subjectStats = await prisma.subject.findUnique({
  where: { id: subjectId },
  include: {
    lector: true,
    _count: {
      select: {
        schedules: true,
        homework: true
      }
    },
    schedules: {
      include: {
        group: {
          include: {
            users: {
              where: {
                role: 'student'
              }
            }
          }
        }
      },
      distinct: ['groupId']
    }
  }
})

const uniqueStudents = new Set()
subjectStats.schedules.forEach(schedule => {
  schedule.group?.users.forEach(user => {
    uniqueStudents.add(user.id)
  })
})

console.log({
  scheduleCount: subjectStats._count.schedules,
  homeworkCount: subjectStats._count.homework,
  studentCount: uniqueStudents.size,
  lector: subjectStats.lector?.name
})
```

### Для лектора
```typescript
const mySubjectStats = await prisma.subject.findMany({
  where: {
    lectorId: lectorId
  },
  include: {
    homework: {
      include: {
        submissions: {
          where: {
            status: 'SUBMITTED'
          }
        }
      }
    }
  }
})

const stats = mySubjectStats.map(subject => ({
  name: subject.name,
  totalHomework: subject.homework.length,
  pendingReviews: subject.homework.reduce((sum, hw) => 
    sum + hw.submissions.length, 0
  )
}))
```

## Миграции

### Добавление поля lectorId
```prisma
// До
model Subject {
  instructor  String?
}

// После
model Subject {
  instructor  String?
  lectorId    String?
  lector      User?   @relation(fields: [lectorId], references: [id])
}
```

```bash
npx prisma migrate dev --name add_subject_lector
```

### Миграция данных
```sql
-- Перенести данные из instructor в lectorId (если нужно)
UPDATE subjects s
SET lector_id = (
  SELECT id FROM users u
  WHERE u.name = s.instructor
  AND u.role = 'lector'
  LIMIT 1
)
WHERE s.instructor IS NOT NULL;
```

## Связанные заметки

### Модели
- [[User]] - лектор предмета
- [[Schedule]] - расписание по предмету
- [[Homework]] - задания по предмету
- [[Group]] - группы, изучающие предмет

### Роли
- [[Admin]] - управление предметами
- [[Lector]] - назначается к предметам
- [[Student]] - изучает предметы

### Функции
- [[Управление расписанием]] - создание занятий по предметам
- [[Система домашних заданий]] - задания по предметам

### API
- [[Subjects API]] - endpoints для работы с предметами
- [[Homework API]] - связь через subjectId

## Файлы

- **Схема**: `prisma/schema.prisma`
- **Типы**: `lib/types.ts`
- **API**: `app/api/subjects/route.ts`
- **Компоненты**: `components/admin/subject-form.tsx`
- **Страницы**: `app/admin/subjects/page.tsx`

## Примеры названий предметов

### Технические
- "Алгоритмы и структуры данных"
- "Машинное обучение"
- "Data Science"
- "Web разработка"
- "Базы данных"

### Бизнес
- "Коммерция"
- "Финансы"
- "Маркетинг"
- "Системное мышление"
- "Управление проектами"

### Общие
- "Математический анализ"
- "Линейная алгебра"
- "Теория вероятностей"
- "Английский язык"

---

#model #prisma #subject #lector

