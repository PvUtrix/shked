# 📚 Система подгрупп

## Обзор

Система подгрупп в ШКЕД позволяет гибко распределять студентов по подгруппам для разных предметов. Это заменяет старую систему с жестко заданными полями (subgroupCommerce, subgroupTutorial и т.д.).

## Основные возможности

### Типы подгрупп

1. **Предметные подгруппы** - привязаны к конкретному предмету
   - Каждый предмет может иметь свои подгруппы
   - Студенты могут быть в разных подгруппах по разным предметам
   
2. **Общие подгруппы** - не привязаны к предмету
   - Используются для общих активностей
   - Применяются ко всем предметам группы

### Создание подгруппы

**API Endpoint:** `POST /api/groups/{groupId}/subgroups`

```json
{
  "subjectId": "clxx123...",  // Опционально, null для общей подгруппы
  "name": "Подгруппа 1 (Коммерция)",
  "number": 1,
  "description": "Описание подгруппы"
}
```

**Параметры:**
- `subjectId` - ID предмета (null для общей подгруппы)
- `name` - Название подгруппы
- `number` - Номер подгруппы (1, 2, 3...)
- `description` - Описание (опционально)

### Управление студентами

#### Добавление студентов в подгруппу

**API Endpoint:** `POST /api/groups/{groupId}/subgroups/{subgroupId}/students`

```json
{
  "studentIds": ["user_id_1", "user_id_2", "user_id_3"]
}
```

#### Удаление студента из подгруппы

**API Endpoint:** `DELETE /api/groups/{groupId}/subgroups/{subgroupId}/students?userId={userId}`

### Получение подгрупп

**API Endpoint:** `GET /api/groups/{groupId}/subgroups?subjectId={subjectId}`

**Параметры запроса:**
- `subjectId` - Фильтр по предмету (опционально)

**Ответ:**
```json
[
  {
    "id": "subgroup_id",
    "groupId": "group_id",
    "subjectId": "subject_id",
    "name": "Подгруппа 1",
    "number": 1,
    "description": "Описание",
    "subject": {
      "id": "subject_id",
      "name": "Название предмета"
    },
    "students": [
      {
        "id": "membership_id",
        "userId": "user_id",
        "user": {
          "id": "user_id",
          "name": "Имя студента",
          "email": "email@example.com"
        }
      }
    ],
    "_count": {
      "students": 5
    }
  }
]
```

## Использование в расписании

При создании занятия можно указать подгруппу:

```json
{
  "subjectId": "subject_id",
  "groupId": "group_id",
  "subgroupId": "subgroup_id",  // Опционально
  "date": "2025-11-01",
  "startTime": "10:00",
  "endTime": "11:30"
}
```

**Видимость расписания:**
- Если `subgroupId` указан - занятие видят только студенты этой подгруппы
- Если `subgroupId` null - занятие видят все студенты группы

## Миграция со старой системы

### Старая система (deprecated)

```prisma
model UserGroup {
  subgroupCommerce       Int?
  subgroupTutorial       Int?
  subgroupFinance        Int?
  subgroupSystemThinking Int?
}
```

### Новая система

```prisma
model Subgroup {
  id          String
  groupId     String
  subjectId   String?  // null для общих подгрупп
  name        String
  number      Int
}

model SubgroupStudent {
  id         String
  subgroupId String
  userId     String
}
```

### Скрипт миграции

Используйте `scripts/migrate-subgroups.ts` для автоматической миграции:

```bash
npx tsx scripts/migrate-subgroups.ts
```

Скрипт:
1. Читает старые поля подгрупп из UserGroup
2. Создает новые записи Subgroup
3. Заполняет SubgroupStudent связями

## Права доступа

- **Admin**: Создание, редактирование, удаление подгрупп
- **Admin**: Распределение студентов по подгруппам
- **Lector**: Просмотр подгрупп своих предметов
- **Student**: Просмотр своих подгрупп
- **Mentor**: Просмотр подгрупп своих групп

## Примеры использования

### Пример 1: Создание подгрупп по предмету

```typescript
// Создать 2 подгруппы для предмета "Коммерция"
const subgroup1 = await fetch('/api/groups/group_id/subgroups', {
  method: 'POST',
  body: JSON.stringify({
    subjectId: 'commerce_subject_id',
    name: 'Подгруппа 1 (Коммерция)',
    number: 1
  })
})

const subgroup2 = await fetch('/api/groups/group_id/subgroups', {
  method: 'POST',
  body: JSON.stringify({
    subjectId: 'commerce_subject_id',
    name: 'Подгруппа 2 (Коммерция)',
    number: 2
  })
})
```

### Пример 2: Распределение студентов

```typescript
// Добавить студентов в первую подгруппу
await fetch('/api/groups/group_id/subgroups/subgroup1_id/students', {
  method: 'POST',
  body: JSON.stringify({
    studentIds: ['student1_id', 'student2_id', 'student3_id']
  })
})

// Добавить студентов во вторую подгруппу
await fetch('/api/groups/group_id/subgroups/subgroup2_id/students', {
  method: 'POST',
  body: JSON.stringify({
    studentIds: ['student4_id', 'student5_id']
  })
})
```

### Пример 3: Создание занятия для подгруппы

```typescript
// Занятие только для первой подгруппы
await fetch('/api/schedules', {
  method: 'POST',
  body: JSON.stringify({
    subjectId: 'commerce_subject_id',
    groupId: 'group_id',
    subgroupId: 'subgroup1_id',  // Только эта подгруппа увидит занятие
    date: '2025-11-05',
    startTime: '10:00',
    endTime: '11:30',
    location: 'Аудитория 305'
  })
})
```

## Модели данных

```prisma
model Subgroup {
  id          String   @id @default(cuid())
  groupId     String
  subjectId   String?  // null = общая подгруппа для всех предметов
  name        String   // "Подгруппа 1", "Подгруппа Коммерция" и т.д.
  number      Int      // 1, 2, 3...
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

model SubgroupStudent {
  id         String   @id @default(cuid())
  subgroupId String
  userId     String
  createdAt  DateTime @default(now())
  
  subgroup   Subgroup @relation(fields: [subgroupId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([subgroupId, userId])
  @@map("subgroup_students")
}
```

## Best Practices

1. **Именование подгрупп** - используйте понятные названия: "Подгруппа 1 (Коммерция)", а не просто "1"
2. **Нумерация** - начинайте с 1, используйте последовательные номера
3. **Проверка дубликатов** - система не позволяет создать подгруппу с одинаковым номером для одного предмета
4. **Удаление** - используйте мягкое удаление (isActive = false) вместо физического удаления
5. **Отслеживание изменений** - система автоматически записывает createdAt

---

*Документация обновлена: 30 октября 2025*
*Версия системы: 0.1.0-alpha*


