# Subgroup (Подгруппа)

> Гибкая система подгрупп для распределения студентов

## Обзор

Модель `Subgroup` представляет подгруппу в рамках группы, которая может быть привязана к конкретному предмету или быть общей.

**Файл**: `prisma/schema.prisma`

## Схема данных

```prisma
model Subgroup {
  id          String   @id @default(cuid())
  groupId     String
  subjectId   String?  // null = общая подгруппа
  name        String
  number      Int
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  group       Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  subject     Subject? @relation(fields: [subjectId], references: [id])
  students    SubgroupStudent[]
  schedules   Schedule[]
  
  @@unique([groupId, subjectId, number])
  @@map("subgroups")
}
```

## Типы подгрупп

1. **Предметные** - `subjectId` указан, подгруппа привязана к предмету
2. **Общие** - `subjectId = null`, подгруппа для всех предметов группы

## Связи

- `group` - Группа [[Group]]
- `subject` - Предмет [[Subject]] (опционально)
- `students` - Студенты [[SubgroupStudent]]
- `schedules` - Занятия [[Schedule]]

## API

См. [docs/features/SUBGROUPS_SYSTEM.md](../../docs/features/SUBGROUPS_SYSTEM.md)

**Endpoints**:
- `GET /api/groups/{groupId}/subgroups`
- `POST /api/groups/{groupId}/subgroups`
- `PATCH /api/groups/{groupId}/subgroups/{subgroupId}`
- `DELETE /api/groups/{groupId}/subgroups/{subgroupId}`

## Миграция

Используйте `scripts/migrate-subgroups.ts` для миграции старой системы подгрупп.

---

#model #subgroup #group #prisma


