# Lector (Роль пользователя)

> Преподаватель с правами создания и проверки домашних заданий

## Описание роли

**Lector** (Преподаватель) - роль для преподавателей университета, ведущих предметы и проверяющих работы студентов.

**Значение в системе**: `role = "lector"`

## Права доступа

### ✅ Разрешено

#### Мои предметы
- Просмотр назначенных предметов
- Просмотр списка групп по своим предметам
- Просмотр расписания по своим предметам

#### Домашние задания
- **Создание ДЗ** для своих предметов (MDX редактор)
- **Редактирование ДЗ** по своим предметам
- **Удаление ДЗ** по своим предметам
- Просмотр всех сданных работ по своим предметам
- Фильтрация работ по статусу и студентам

#### Проверка работ
- Просмотр MDX контента работ студентов
- **Выставление оценок** (grade)
- **Развернутая обратная связь** (feedback в MDX)
- **Inline комментарии** к работам
- Изменение статуса работы (NOT_SUBMITTED → SUBMITTED → REVIEWED)

#### Профиль и уведомления
- Просмотр и редактирование профиля
- Telegram уведомления о занятиях
- Управление Telegram привязкой

### ❌ Запрещено

- Управление группами
- Управление предметами (создание/редактирование)
- Создание расписания
- Управление пользователями
- Просмотр/проверка ДЗ по чужим предметам
- Доступ к админ-панели

## Интерфейс

### Главная страница
**Путь**: `/lector`  
**Компонент**: `app/lector/page.tsx`

**Содержимое**:
- Список назначенных предметов
- Статистика по ДЗ (всего, проверенных, ожидают проверки)
- Ближайшие занятия
- Последние сданные работы

### Разделы лектора

#### Расписание
**Путь**: `/lector/schedule`  
**Компонент**: `app/lector/schedule/page.tsx`

- Расписание занятий по своим предметам
- Календарный вид
- Информация о группах
- Telegram уведомления о занятиях

#### Домашние задания
**Путь**: `/lector/homework`  
**Компонент**: `app/lector/homework/page.tsx`

**Вкладки**:
- **Мои задания** - созданные ДЗ
- **На проверке** - сданные работы (status: SUBMITTED)
- **Проверенные** - работы с оценками (status: REVIEWED)

**Действия**:
- Создать новое задание
- Редактировать задание
- Просмотреть работы студентов

#### Создание/редактирование задания
**Путь**: `/lector/homework/create`, `/lector/homework/[id]/edit`  
**Компонент**: `app/lector/homework/create/page.tsx`

**Форма**:
- Название задания
- Выбор предмета (из своих)
- Выбор группы
- **MDX редактор** для содержания задания
- Дедлайн
- Дополнительные материалы (ссылки, файлы)
- Кнопка "Создать"/"Сохранить"

#### Проверка работы
**Путь**: `/lector/homework/[id]/submissions/[submissionId]`  
**Компонент**: `app/lector/homework/[id]/submissions/[submissionId]/page.tsx`

**Содержимое**:
- Информация о студенте
- Задание (MDX)
- Работа студента (MDX)
- **Inline комментарии** к работе
- Форма оценивания:
  - Оценка (1-10 или 1-100)
  - Feedback (MDX редактор)
  - Кнопка "Сохранить проверку"

#### Профиль
**Путь**: `/lector/profile`  
**Компонент**: `app/lector/profile/page.tsx`

**Информация**:
- Личные данные
- Назначенные предметы
- Telegram привязка
- Настройки уведомлений

### Навигация
**Компонент**: [[lector-nav.tsx]]

Боковое меню:
- 🏠 Главная
- 📅 Расписание
- 📝 Домашние задания
- 👤 Профиль

## API Endpoints

**Документация**: [[Homework API]], [[Schedules API]]

### Доступные для Lector

- `GET /api/subjects?lectorId={myId}` - свои предметы
- `GET /api/schedules?subjectId={mySubjectId}` - свое расписание
- `GET /api/homework?lectorId={myId}` - свои задания
- `POST /api/homework` - создать задание
- `PUT /api/homework/[id]` - редактировать свое задание
- `DELETE /api/homework/[id]` - удалить свое задание
- `GET /api/homework/[id]/submissions` - работы по своему заданию
- `POST /api/homework/[id]/submissions/[submissionId]/review` - проверить работу
- `POST /api/homework/[id]/submissions/[submissionId]/comments` - добавить inline комментарий
- `GET /api/profile` - свой профиль
- `PUT /api/profile` - обновить профиль

## Модель данных

**Модель**: [[User]]  
**Роль**: `role = "lector"`

```typescript
interface Lector extends User {
  role: 'lector'
  assignedSubjects: Subject[]  // Назначенные предметы
  homeworkComments: HomeworkComment[]  // Комментарии к работам
}
```

## Связи

### Основные
- [[Subject]][] - назначенные предметы (через `lectorId`)
- [[Homework]][] - созданные задания (через `subject.lectorId`)
- [[HomeworkComment]][] - комментарии к работам студентов

### Через предметы
- [[Schedule]][] - расписание по предметам
- [[HomeworkSubmission]][] - работы студентов

## Назначение лектора к предмету

**Действие**: Выполняет [[Admin]]

```typescript
await prisma.subject.update({
  where: { id: subjectId },
  data: {
    lectorId: lectorUserId
  }
})
```

После назначения лектор получает доступ к:
- Созданию ДЗ для этого предмета
- Просмотру расписания по предмету
- Проверке работ студентов

## Примеры использования

### Получение своих предметов

```typescript
const mySubjects = await prisma.subject.findMany({
  where: {
    lectorId: lectorId
  },
  include: {
    homework: {
      where: {
        isActive: true
      }
    },
    schedules: {
      where: {
        date: {
          gte: new Date()
        }
      }
    },
    _count: {
      select: {
        homework: true,
        schedules: true
      }
    }
  }
})
```

### Создание домашнего задания

```typescript
'use client'

import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { useState } from 'react'

export function HomeworkForm() {
  const [content, setContent] = useState('')
  
  async function handleSubmit(data) {
    await fetch('/api/homework', {
      method: 'POST',
      body: JSON.stringify({
        title: data.title,
        content: content,  // MDX
        subjectId: data.subjectId,
        groupId: data.groupId,
        deadline: data.deadline,
        materials: data.materials
      })
    })
    
    toast.success('Задание создано!')
  }
  
  return (
    <form>
      <Input name="title" placeholder="Название задания" />
      <Select name="subjectId">{/* Свои предметы */}</Select>
      <Select name="groupId">{/* Группы */}</Select>
      <DatePicker name="deadline" />
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder="Опишите задание..."
      />
      <Button onClick={handleSubmit}>Создать</Button>
    </form>
  )
}
```

### Получение работ на проверку

```typescript
const pendingReviews = await prisma.homeworkSubmission.findMany({
  where: {
    homework: {
      subject: {
        lectorId: lectorId
      }
    },
    status: 'SUBMITTED'  // Сданные, но не проверенные
  },
  include: {
    homework: {
      include: {
        subject: true
      }
    },
    user: {
      select: {
        name: true,
        email: true
      }
    }
  },
  orderBy: {
    submittedAt: 'asc'  // Сначала самые старые
  }
})
```

### Проверка работы

```typescript
async function reviewSubmission({
  submissionId,
  grade,
  feedback,
  comment
}: {
  submissionId: string
  grade: number
  feedback: string  // MDX
  comment?: string  // MDX
}) {
  await fetch(`/api/homework/${homeworkId}/submissions/${submissionId}/review`, {
    method: 'POST',
    body: JSON.stringify({
      grade,
      feedback,
      comment,
      status: 'REVIEWED'
    })
  })
  
  toast.success('Работа проверена!')
}
```

### Добавление inline комментария

```typescript
async function addInlineComment({
  submissionId,
  selectedText,
  startOffset,
  endOffset,
  comment
}: {
  submissionId: string
  selectedText: string
  startOffset: number
  endOffset: number
  comment: string
}) {
  await fetch(`/api/homework/${homeworkId}/submissions/${submissionId}/comments`, {
    method: 'POST',
    body: JSON.stringify({
      content: comment,
      startOffset,
      endOffset,
      selectedText
    })
  })
}
```

## Статистика лектора

### Общая статистика
```typescript
const lectorStats = {
  totalSubjects: 3,
  totalHomework: 15,
  pendingReviews: 8,
  reviewedToday: 5,
  avgGradeGiven: 8.2
}
```

### Статистика по предметам
```typescript
const subjectStats = await prisma.subject.findMany({
  where: {
    lectorId: lectorId
  },
  include: {
    homework: {
      include: {
        submissions: {
          where: {
            status: {
              in: ['SUBMITTED', 'REVIEWED']
            }
          }
        }
      }
    }
  }
})

const stats = subjectStats.map(subject => ({
  name: subject.name,
  totalHomework: subject.homework.length,
  totalSubmissions: subject.homework.reduce((sum, hw) => 
    sum + hw.submissions.length, 0
  ),
  pendingReviews: subject.homework.reduce((sum, hw) => 
    sum + hw.submissions.filter(s => s.status === 'SUBMITTED').length, 0
  )
}))
```

## MDX редактор для проверки

**ADR**: [[ADR-005 MDX для домашних заданий]]  
**Компонент**: [[markdown-editor.tsx]]

### Feedback форма

```typescript
'use client'

import { MarkdownEditor } from '@/components/ui/markdown-editor'

export function ReviewForm({ submission }) {
  const [feedback, setFeedback] = useState('')
  const [grade, setGrade] = useState<number>()
  
  return (
    <div>
      <h3>Проверка работы: {submission.user.name}</h3>
      
      {/* Работа студента */}
      <MarkdownViewer content={submission.content} />
      
      {/* Форма оценивания */}
      <Input
        type="number"
        min="1"
        max="10"
        value={grade}
        onChange={(e) => setGrade(parseInt(e.target.value))}
        placeholder="Оценка (1-10)"
      />
      
      <MarkdownEditor
        value={feedback}
        onChange={setFeedback}
        placeholder="Напишите развернутую обратную связь..."
      />
      
      <Button onClick={() => reviewSubmission({ grade, feedback })}>
        Сохранить проверку
      </Button>
    </div>
  )
}
```

## Telegram интеграция

**Документация**: [[Telegram интеграция]]

### Уведомления для лектора
- 📚 Напоминания о занятиях (за 30 минут)
- 📝 Уведомления о новых сданных работах
- 📊 Еженедельная сводка по проверкам

### Команды бота
```
/schedule - Мое расписание на сегодня
/tomorrow - Мое расписание на завтра
/pending - Работы на проверке
```

## Визуальное оформление

### Цветовая схема
**Цвет**: Фиолетовый (`purple-600`)  
**Символика**: Знания, мудрость, преподавание

### Иконка роли
**Icon**: `BookOpen` (Lucide React)  
**Значение**: Преподавание, знания

## Демо аккаунт

Для тестирования доступен демо-аккаунт лектора:

**Email**: `lector@demo.com`  
**Пароль**: `lector123`  
**Предметы**: Математический анализ, Алгоритмы, Data Science

> ⚠️ **Внимание**: Используйте только для разработки и демонстрации!

## Связанные заметки

### Другие роли
- [[Admin]] - администраторы
- [[Student]] - студенты
- [[Mentor]] - менторы

### Модели
- [[User]] - модель пользователя
- [[Subject]] - предметы лектора
- [[Homework]] - созданные задания
- [[HomeworkSubmission]] - работы на проверку
- [[HomeworkComment]] - inline комментарии
- [[Schedule]] - расписание занятий

### Функции
- [[Система домашних заданий]] - создание и проверка ДЗ
- [[MDX редактор]] - форматирование заданий и feedback

### API
- [[Homework API]] - создание и проверка ДЗ
- [[Schedules API]] - расписание

### Компоненты
- [[lector-nav.tsx]] - навигация лектора
- [[homework-form.tsx]] - форма создания ДЗ
- [[markdown-editor.tsx]] - MDX редактор

### ADR
- [[ADR-005 MDX для домашних заданий]] - формат заданий

## Файлы

- **Модель**: `prisma/schema.prisma` (User с role="lector")
- **Страницы**: `app/lector/**/*.tsx`
- **Компоненты**: `components/lector/**/*.tsx`
- **API**: Используют общие endpoints с проверкой прав

## Официальная документация

- [docs/features/USER_ROLES.md](../../docs/features/USER_ROLES.md#преподаватель-lector)

---

#role #lector #homework #teacher

