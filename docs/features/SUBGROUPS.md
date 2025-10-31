# Подгруппы в Шкед

## Обзор

Система подгрупп позволяет разделять студентов внутри одной группы для различных предметов. Это полезно когда разные предметы требуют разделения на подгруппы по разным принципам.

## Структура данных

### Модель UserGroup

В таблице `user_groups` хранится информация о принадлежности студента к подгруппам:

```prisma
model UserGroup {
  id                     String   @id @default(cuid())
  userId                 String
  groupId                String
  subgroupCommerce       Int?     // Подгруппа для предмета "Коммерция"
  subgroupTutorial       Int?     // Подгруппа для семинаров
  subgroupFinance        Int?     // Подгруппа для "Финансов"
  subgroupSystemThinking Int?     // Подгруппа для "Системного мышления"
  createdAt              DateTime @default(now())
  
  group                  Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user                   User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, groupId])
  @@map("user_groups")
}
```

### Поля подгрупп

- `subgroupCommerce` - номер подгруппы для предмета "Коммерция" (1, 2, 3, и т.д.)
- `subgroupTutorial` - номер подгруппы для семинаров
- `subgroupFinance` - номер подгруппы для предмета "Финансы"
- `subgroupSystemThinking` - номер подгруппы для предмета "Системное мышление"

## Использование подгрупп

### При создании расписания

В модели `Schedule` есть поле `subgroupId`, которое указывает на конкретную подгруппу:

```typescript
model Schedule {
  id          String   @id @default(cuid())
  subjectId   String
  groupId     String?
  subgroupId  String?  // ID подгруппы или номер подгруппы
  date        DateTime
  dayOfWeek   Int
  startTime   String
  endTime     String
  location    String?
  eventType   String?
  description String?
  // ...
}
```

### Фильтрация расписания по подгруппе

При отображении расписания студенту система должна:

1. Получить информацию о подгруппах студента из `UserGroup`
2. Показать только те занятия, которые:
   - Не имеют `subgroupId` (для всей группы)
   - Имеют `subgroupId`, соответствующий подгруппе студента для данного предмета

### Пример реализации

```typescript
// Получаем информацию о подгруппах студента
const userGroup = await prisma.userGroup.findFirst({
  where: {
    userId: studentId,
    groupId: groupId
  }
})

// Получаем расписание с учетом подгрупп
const schedules = await prisma.schedule.findMany({
  where: {
    groupId: groupId,
    date: {
      gte: startDate,
      lte: endDate
    },
    OR: [
      { subgroupId: null }, // Занятия для всей группы
      { 
        subjectId: commerceSubjectId,
        subgroupId: userGroup?.subgroupCommerce?.toString()
      },
      { 
        subjectId: tutorialSubjectId,
        subgroupId: userGroup?.subgroupTutorial?.toString()
      },
      // ... и т.д. для других предметов
    ]
  }
})
```

## Реализация управления подгруппами

### TODO: Интерфейс администратора

Необходимо реализовать следующие функции:

1. **Управление студентами в группе** (`/admin/groups/[id]/students`)
   - Просмотр списка студентов
   - Назначение студентов в подгруппы по каждому предмету
   - Массовое назначение подгрупп

2. **Редактор подгрупп**
   - Выбор предмета
   - Выбор номера подгруппы (1, 2, 3, ...)
   - Сохранение изменений

3. **Импорт подгрупп из Excel**
   - Загрузка файла с распределением по подгруппам
   - Автоматическое создание/обновление записей в `UserGroup`

### TODO: Интерфейс при создании расписания

При создании занятия:

1. Выбор группы
2. Выбор предмета
3. **Выбор подгруппы** (опционально):
   - "Вся группа" (subgroupId = null)
   - "Подгруппа 1" (subgroupId = "1")
   - "Подгруппа 2" (subgroupId = "2")
   - И т.д.

### API Endpoints (TODO)

#### GET /api/groups/[id]/students
Получить список студентов группы с их подгруппами

```typescript
{
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
```

#### PUT /api/groups/[id]/students/[studentId]/subgroups
Обновить подгруппы студента

```typescript
{
  subgroupCommerce: 1,
  subgroupTutorial: 2,
  subgroupFinance: 1,
  subgroupSystemThinking: 2
}
```

## Миграция данных

Если нужно добавить новый предмет с подгруппами:

1. Добавить новое поле в модель `UserGroup`:
   ```prisma
   subgroupNewSubject Int?
   ```

2. Создать миграцию:
   ```bash
   npx prisma migrate dev --name add_new_subject_subgroup
   ```

3. Обновить интерфейс управления подгруппами

## Текущий статус

⚠️ **Внимание**: Функционал управления подгруппами в интерфейсе пока не реализован полностью.

### Реализовано:
- ✅ Модель данных в Prisma
- ✅ Поля для хранения подгрупп в `UserGroup`
- ✅ Поле `subgroupId` в `Schedule`

### TODO (В следующих версиях):
- ⏳ Интерфейс управления студентами в группе
- ⏳ Назначение подгрупп через админ-панель
- ⏳ Фильтрация расписания по подгруппам студента
- ⏳ Выбор подгруппы при создании расписания
- ⏳ Импорт подгрупп из Excel
- ⏳ API endpoints для работы с подгруппами

## Рекомендации

1. **Пока функционал не реализован**, можно использовать поле `description` в `Schedule` для указания подгруппы текстом.

2. **При создании расписания** можно использовать соглашение об именовании:
   - "Семинар (подгруппа 1)"
   - "Коммерция (подгруппа 2)"

3. **Для быстрого решения** можно реализовать простой интерфейс:
   - Кнопка "Управлять студентами" на странице группы
   - Таблица со студентами и выпадающими списками для каждого предмета
   - Кнопка "Сохранить" для массового обновления

## Связанные файлы

- `prisma/schema.prisma` - модели данных
- `app/admin/groups/page.tsx` - страница управления группами
- `app/admin/schedule/page.tsx` - создание расписания
- `components/admin/schedule-form.tsx` - форма создания расписания
- `lib/types.ts` - TypeScript типы

## Контакты

Если нужна помощь с реализацией функционала подгрупп, обратитесь к документации или создайте issue в репозитории.

