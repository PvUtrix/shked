# Homework (Модель данных)

> Модель домашних заданий, создаваемых преподавателями

## Описание

Модель `Homework` представляет домашнее задание, созданное преподавателем или администратором для определенного предмета и группы.

## Prisma Schema

```prisma
model Homework {
  id          String   @id @default(cuid())
  title       String
  description String?
  content     String?  // MDX контент задания
  taskUrl     String?  // Ссылка на задание
  deadline    DateTime
  materials   Json?    // Дополнительные материалы (массив объектов)
  subjectId   String
  groupId     String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  subject     Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  group       Group?   @relation(fields: [groupId], references: [id], onDelete: Cascade)
  submissions HomeworkSubmission[]
  
  @@map("homework")
}
```

## Поля модели

### Основные поля
- `id` - уникальный идентификатор (CUID)
- `title` - название задания
- `description` - краткое описание (plain text)
- `content` - полное содержание задания в **MDX формате**
- `taskUrl` - ссылка на внешнее задание (опционально)

### Дедлайн и статус
- `deadline` - дата и время сдачи
- `isActive` - активно ли задание

### Дополнительно
- `materials` - JSON массив дополнительных материалов
  ```json
  [
    {
      "name": "Лекция 1",
      "url": "https://example.com/lecture1.pdf",
      "type": "pdf"
    },
    {
      "name": "Пример кода",
      "url": "https://github.com/example",
      "type": "link"
    }
  ]
  ```

### Связи
- `subjectId` - ID предмета
- `groupId` - ID группы (опционально, может быть для всех групп)

### Timestamps
- `createdAt` - дата создания
- `updatedAt` - дата последнего обновления

## Связи (Relations)

### Many-to-One
- [[Subject]] - предмет, к которому относится задание
- [[Group]] - группа, для которой задание (опционально)

### One-to-Many
- [[HomeworkSubmission]][] - работы студентов по этому заданию

## MDX Контент

**ADR**: [[ADR-005 MDX для домашних заданий]]  
**Компонент**: [[markdown-editor.tsx]]

### Поддерживаемые элементы

#### Текстовое форматирование
- **Жирный текст**
- *Курсив*
- ~~Зачеркнутый~~
- `Inline код`

#### Заголовки
```markdown
# Заголовок 1
## Заголовок 2
### Заголовок 3
```

#### Списки
```markdown
- Маркированный список
- Пункт 2
  - Вложенный пункт

1. Нумерованный список
2. Пункт 2
```

#### Код
````markdown
```python
def hello():
    print("Hello, World!")
```
````

#### Таблицы
```markdown
| Заголовок 1 | Заголовок 2 |
|-------------|-------------|
| Ячейка 1    | Ячейка 2    |
```

#### Ссылки и изображения
```markdown
[Текст ссылки](https://example.com)
![Alt текст](https://example.com/image.png)
```

#### Цитаты
```markdown
> Это цитата
```

## API Endpoints

**API**: [[Homework API]]

### Основные операции
- `GET /api/homework` - список заданий
  - Фильтры: `subjectId`, `groupId`, `teacherId`
  - Роли видят разные данные
- `GET /api/homework/[id]` - детали задания
- `POST /api/homework` - создать задание (teacher, admin)
- `PUT /api/homework/[id]` - обновить задание (teacher своих, admin всех)
- `DELETE /api/homework/[id]` - удалить задание (teacher своих, admin всех)

### Работа с submissions
- `GET /api/homework/[id]/submissions` - все работы по заданию
- `POST /api/homework/[id]/submit` - сдать работу (student)
- `POST /api/homework/[id]/review` - проверить работу (teacher)

## Компоненты

### Teacher компоненты
- [[homework-form.tsx]] - форма создания/редактирования задания
- [[markdown-editor.tsx]] - MDX редактор для контента

### Student компоненты
- [[homework-card.tsx]] - карточка задания
- [[markdown-viewer.tsx]] - просмотр MDX контента

### Admin компоненты
- Используют те же компоненты что и Teacher

## TypeScript типы

```typescript
// lib/types.ts
export interface Homework {
  id: string
  title: string
  description?: string
  content?: string  // MDX
  taskUrl?: string
  deadline: Date
  materials?: Material[]
  subjectId: string
  groupId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Material {
  name: string
  url: string
  type: 'pdf' | 'link' | 'video' | 'other'
}

export interface HomeworkWithRelations extends Homework {
  subject: Subject
  group?: Group
  submissions: HomeworkSubmission[]
}
```

## Права доступа

### Admin
- ✅ CRUD всех заданий
- ✅ Просмотр всех submissions
- ✅ Проверка всех работ

### Teacher
- ✅ CRUD заданий по своим предметам
- ✅ Просмотр submissions по своим предметам
- ✅ Проверка работ по своим предметам
- ❌ Доступ к другим предметам

### Student
- ✅ Просмотр заданий своей группы
- ✅ Сдача работ
- ❌ Создание/редактирование заданий

### Mentor
- ✅ Просмотр заданий своих групп
- ✅ Мониторинг submissions своих групп
- ❌ Создание/редактирование заданий
- ❌ Проверка работ

## Примеры использования

### Создание задания (teacher)
```typescript
const homework = await prisma.homework.create({
  data: {
    title: 'Лабораторная работа №1',
    description: 'Реализация алгоритма сортировки',
    content: `# Задание

## Цель работы
Изучить алгоритмы сортировки...

## Задачи
1. Реализовать QuickSort
2. Сравнить производительность
3. Написать отчет

\`\`\`python
def quicksort(arr):
    # Ваш код здесь
    pass
\`\`\``,
    deadline: new Date('2024-11-01'),
    subjectId: 'subject-id',
    groupId: 'group-id',
    materials: [
      {
        name: 'Лекция по сортировкам',
        url: 'https://example.com/lecture.pdf',
        type: 'pdf'
      }
    ]
  }
})
```

### Получение заданий студента
```typescript
const homeworks = await prisma.homework.findMany({
  where: {
    groupId: student.groupId,
    isActive: true,
    deadline: {
      gte: new Date() // Только активные
    }
  },
  include: {
    subject: {
      select: {
        name: true,
        teacher: {
          select: { name: true }
        }
      }
    },
    submissions: {
      where: {
        userId: student.id
      }
    }
  },
  orderBy: {
    deadline: 'asc'
  }
})
```

### Получение заданий лектора
```typescript
const homeworks = await prisma.homework.findMany({
  where: {
    subject: {
      teacherId: teacher.id
    }
  },
  include: {
    subject: true,
    group: true,
    submissions: {
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    }
  }
})
```

### Обновление задания
```typescript
await prisma.homework.update({
  where: { id: homeworkId },
  data: {
    title: 'Обновленное название',
    content: '# Обновленное содержание...',
    deadline: new Date('2024-11-15')
  }
})
```

## Валидация

### Zod схема
```typescript
import { z } from 'zod'

export const homeworkSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  content: z.string().optional(), // MDX
  taskUrl: z.string().url().optional(),
  deadline: z.date().min(new Date(), 'Дедлайн должен быть в будущем'),
  subjectId: z.string().cuid(),
  groupId: z.string().cuid().optional(),
  materials: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.enum(['pdf', 'link', 'video', 'other'])
  })).optional()
})
```

## Уведомления

### Telegram уведомления
**Система**: [[Telegram интеграция]]

#### При создании задания
```typescript
// Уведомление всем студентам группы
await notifyNewHomework({
  homework: homework,
  groupId: homework.groupId
})
```

#### Напоминания о дедлайне
```typescript
// За 24 часа до дедлайна
// За 2 часа до дедлайна
await notifyHomeworkDeadline({
  homework: homework,
  timeLeft: '24h'
})
```

## Статистика

### Для лектора
```typescript
const stats = await prisma.homework.findUnique({
  where: { id: homeworkId },
  include: {
    submissions: {
      select: {
        status: true,
        grade: true
      }
    }
  }
})

const totalStudents = /* количество студентов в группе */
const submitted = stats.submissions.filter(s => s.status === 'SUBMITTED').length
const reviewed = stats.submissions.filter(s => s.status === 'REVIEWED').length
const avgGrade = stats.submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / reviewed
```

### Для студента
```typescript
const studentHomeworks = await prisma.homework.findMany({
  where: {
    groupId: student.groupId
  },
  include: {
    submissions: {
      where: {
        userId: student.id
      }
    }
  }
})

const total = studentHomeworks.length
const submitted = studentHomeworks.filter(h => 
  h.submissions[0]?.status !== 'NOT_SUBMITTED'
).length
const reviewed = studentHomeworks.filter(h => 
  h.submissions[0]?.status === 'REVIEWED'
).length
```

## Связанные заметки

### Модели
- [[Subject]] - предмет задания
- [[Group]] - группа студентов
- [[HomeworkSubmission]] - работы студентов
- [[HomeworkComment]] - inline комментарии
- [[User]] - лектор, создавший задание

### Функции
- [[Система домашних заданий]] - общее описание
- [[MDX редактор]] - редактирование контента

### API
- [[Homework API]] - endpoints для работы с заданиями

### Роли
- [[Teacher]] - создает задания
- [[Student]] - сдает задания
- [[Admin]] - полный доступ

### ADR
- [[ADR-005 MDX для домашних заданий]] - выбор формата

## Файлы

- **Схема**: `prisma/schema.prisma`
- **Типы**: `lib/types.ts`
- **API**: `app/api/homework/route.ts`, `app/api/homework/[id]/route.ts`
- **Компоненты**: 
  - `components/teacher/homework-form.tsx`
  - `components/ui/markdown-editor.tsx`
  - `components/ui/markdown-viewer.tsx`

## Официальная документация

- [docs/features/MDX_EDITOR_INTEGRATION.md](../../docs/features/MDX_EDITOR_INTEGRATION.md)

---

#model #prisma #homework #mdx #core

