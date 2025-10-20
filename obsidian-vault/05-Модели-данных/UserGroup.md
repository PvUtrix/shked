# UserGroup (Модель данных)

> Связь студента с группой и его подгруппы по предметам

## Описание

Модель `UserGroup` связывает студента ([[User]]) с учебной группой ([[Group]]) и хранит информацию о его подгруппах для разных предметов.

**Функция**: [[Система подгрупп]]  
**ADR**: [[ADR-006 Система подгрупп]]

## Prisma Schema

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
  
  group                  Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user                   User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, groupId])
  @@map("user_groups")
}
```

## Поля модели

### Связи
- `userId` - ID студента ([[User]])
- `groupId` - ID группы ([[Group]])

### Подгруппы
- `subgroupCommerce` - номер подгруппы для предмета "Коммерция" (1, 2, ...)
- `subgroupTutorial` - номер подгруппы для семинаров (1, 2, 3, ...)
- `subgroupFinance` - номер подгруппы для предмета "Финансы" (1, 2, ...)
- `subgroupSystemThinking` - номер подгруппы для "Системного мышления" (1, 2, ...)

> **Примечание**: Каждое поле `subgroup*` опционально (`Int?`), так как не все предметы требуют подгрупп.

### Timestamps
- `createdAt` - дата создания связи

### Уникальность
- `@@unique([userId, groupId])` - студент может быть связан с группой только один раз

## Связи (Relations)

### Many-to-One
- [[User]] - студент
- [[Group]] - учебная группа

## Назначение

Эта модель решает задачу **разных подгрупп для разных предметов**.

### Проблема
Один студент может быть:
- В подгруппе 1 по коммерции
- В подгруппе 2 по семинарам
- В подгруппе 1 по финансам

Нельзя просто указать "студент в подгруппе 1" - нужно указывать для каждого предмета отдельно.

### Решение
UserGroup хранит номер подгруппы для каждого предмета независимо.

## Примеры использования

### Создание связи с подгруппами

```typescript
await prisma.userGroup.create({
  data: {
    userId: 'student-id',
    groupId: 'group-id',
    subgroupCommerce: 1,
    subgroupTutorial: 2,
    subgroupFinance: 1,
    subgroupSystemThinking: 2
  }
})
```

### Обновление подгрупп

```typescript
await prisma.userGroup.update({
  where: {
    userId_groupId: {
      userId: 'student-id',
      groupId: 'group-id'
    }
  },
  data: {
    subgroupCommerce: 2,  // Переместили в другую подгруппу
    subgroupTutorial: 3
  }
})
```

### Upsert (создать или обновить)

```typescript
await prisma.userGroup.upsert({
  where: {
    userId_groupId: {
      userId: 'student-id',
      groupId: 'group-id'
    }
  },
  update: {
    subgroupCommerce: 1,
    subgroupTutorial: 2
  },
  create: {
    userId: 'student-id',
    groupId: 'group-id',
    subgroupCommerce: 1,
    subgroupTutorial: 2,
    subgroupFinance: 1,
    subgroupSystemThinking: 2
  }
})
```

### Получение подгрупп студента

```typescript
const userGroup = await prisma.userGroup.findUnique({
  where: {
    userId_groupId: {
      userId: 'student-id',
      groupId: 'group-id'
    }
  },
  include: {
    user: {
      select: {
        name: true,
        email: true
      }
    },
    group: {
      select: {
        name: true
      }
    }
  }
})

console.log({
  student: userGroup.user.name,
  group: userGroup.group.name,
  subgroups: {
    commerce: userGroup.subgroupCommerce,
    tutorial: userGroup.subgroupTutorial,
    finance: userGroup.subgroupFinance,
    systemThinking: userGroup.subgroupSystemThinking
  }
})
```

### Получение всех студентов группы с подгруппами

```typescript
const students = await prisma.userGroup.findMany({
  where: {
    groupId: 'group-id'
  },
  include: {
    user: {
      select: {
        id: true,
        name: true,
        email: true
      }
    }
  },
  orderBy: {
    user: {
      name: 'asc'
    }
  }
})

// Отформатировать для UI
const studentsWithSubgroups = students.map(ug => ({
  id: ug.user.id,
  name: ug.user.name,
  email: ug.user.email,
  subgroups: {
    commerce: ug.subgroupCommerce,
    tutorial: ug.subgroupTutorial,
    finance: ug.subgroupFinance,
    systemThinking: ug.subgroupSystemThinking
  }
}))
```

### Получение студентов конкретной подгруппы

```typescript
// Все студенты подгруппы 1 по коммерции
const commerceSubgroup1 = await prisma.userGroup.findMany({
  where: {
    groupId: 'group-id',
    subgroupCommerce: 1
  },
  include: {
    user: true
  }
})
```

### Массовое назначение подгрупп

```typescript
// Назначить всех студентов группы в подгруппы равномерно
const students = await prisma.user.findMany({
  where: {
    groupId: 'group-id',
    role: 'student'
  }
})

for (let i = 0; i < students.length; i++) {
  await prisma.userGroup.upsert({
    where: {
      userId_groupId: {
        userId: students[i].id,
        groupId: 'group-id'
      }
    },
    update: {
      subgroupCommerce: (i % 2) + 1,      // Чередование 1,2,1,2...
      subgroupTutorial: (i % 3) + 1,      // Чередование 1,2,3,1,2,3...
      subgroupFinance: (i % 2) + 1,
      subgroupSystemThinking: (i % 2) + 1
    },
    create: {
      userId: students[i].id,
      groupId: 'group-id',
      subgroupCommerce: (i % 2) + 1,
      subgroupTutorial: (i % 3) + 1,
      subgroupFinance: (i % 2) + 1,
      subgroupSystemThinking: (i % 2) + 1
    }
  })
}
```

## Использование в фильтрации расписания

**Функция**: [[Управление расписанием]]

```typescript
// Получить подгруппы студента
const userGroup = await prisma.userGroup.findUnique({
  where: {
    userId_groupId: {
      userId: studentId,
      groupId: groupId
    }
  }
})

// Получить предметы
const commerce = await prisma.subject.findFirst({
  where: { name: 'Коммерция' }
})

// Построить фильтр расписания
const schedules = await prisma.schedule.findMany({
  where: {
    groupId: groupId,
    OR: [
      { subgroupId: null }, // Для всей группы
      {
        subjectId: commerce.id,
        subgroupId: userGroup?.subgroupCommerce?.toString()
      },
      // ... для других предметов
    ]
  }
})
```

## TypeScript типы

```typescript
// lib/types.ts
export interface UserGroup {
  id: string
  userId: string
  groupId: string
  subgroupCommerce?: number
  subgroupTutorial?: number
  subgroupFinance?: number
  subgroupSystemThinking?: number
  createdAt: Date
}

export interface UserGroupWithRelations extends UserGroup {
  user: User
  group: Group
}

export interface SubgroupAssignment {
  commerce?: number
  tutorial?: number
  finance?: number
  systemThinking?: number
}
```

## API Endpoints (TODO)

**Документация**: [[Groups API]]

```typescript
// Получить студентов группы с подгруппами
GET /api/groups/[id]/students
Response: {
  students: [
    {
      id: "user123",
      name: "Иван Иванов",
      email: "ivan@example.com",
      subgroups: {
        commerce: 1,
        tutorial: 2,
        finance: 1,
        systemThinking: 2
      }
    }
  ]
}

// Обновить подгруппы студента
PUT /api/groups/[id]/students/[studentId]/subgroups
Body: {
  subgroupCommerce: 1,
  subgroupTutorial: 2,
  subgroupFinance: 1,
  subgroupSystemThinking: 2
}
```

## Добавление нового предмета

Если нужно добавить новый предмет с подгруппами:

### 1. Обновить схему

```prisma
model UserGroup {
  // ... существующие поля
  subgroupNewSubject Int?
}
```

### 2. Создать миграцию

```bash
npx prisma migrate dev --name add_new_subject_subgroup
npx prisma generate
```

### 3. Обновить код

- Обновить TypeScript типы
- Добавить поле в форму управления подгруппами (когда будет реализована)
- Обновить функцию фильтрации расписания

## Валидация

### Zod схема

```typescript
import { z } from 'zod'

export const subgroupAssignmentSchema = z.object({
  subgroupCommerce: z.number().int().min(1).max(3).optional(),
  subgroupTutorial: z.number().int().min(1).max(3).optional(),
  subgroupFinance: z.number().int().min(1).max(3).optional(),
  subgroupSystemThinking: z.number().int().min(1).max(3).optional()
})
```

## Статистика

### Распределение по подгруппам

```typescript
const distribution = await prisma.userGroup.groupBy({
  by: ['subgroupCommerce'],
  where: {
    groupId: 'group-id'
  },
  _count: {
    id: true
  }
})

// Результат: [
//   { subgroupCommerce: 1, _count: { id: 10 } },
//   { subgroupCommerce: 2, _count: { id: 12 } }
// ]
```

## Миграции

### Пример миграции

```sql
-- CreateTable
CREATE TABLE "user_groups" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "subgroup_commerce" INTEGER,
    "subgroup_tutorial" INTEGER,
    "subgroup_finance" INTEGER,
    "subgroup_system_thinking" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_groups_user_id_group_id_key" 
  ON "user_groups"("user_id", "group_id");

ALTER TABLE "user_groups" 
  ADD CONSTRAINT "user_groups_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_groups" 
  ADD CONSTRAINT "user_groups_group_id_fkey" 
  FOREIGN KEY ("group_id") REFERENCES "groups"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;
```

## Связанные заметки

### Модели
- [[User]] - студент
- [[Group]] - учебная группа
- [[Schedule]] - использует подгруппы
- [[Subject]] - предметы с подгруппами

### Функции
- [[Система подгрупп]] - детальное описание
- [[Управление расписанием]] - фильтрация по подгруппам

### API
- [[Groups API]] - управление подгруппами (TODO)
- [[Schedules API]] - фильтрация расписания

### ADR
- [[ADR-006 Система подгрупп]] - архитектурное решение

### Роли
- [[Admin]] - назначает подгруппы
- [[Student]] - имеет подгруппы

## Файлы

- **Схема**: `prisma/schema.prisma`
- **Типы**: `lib/types.ts`
- **API** (TODO): `app/api/groups/[id]/students/**/*.ts`
- **Admin страницы** (TODO): `app/admin/groups/[id]/students/page.tsx`

## Официальная документация

- [docs/features/SUBGROUPS.md](../../docs/features/SUBGROUPS.md)

---

#model #prisma #subgroups #junction-table

