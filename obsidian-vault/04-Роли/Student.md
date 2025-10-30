# Student (Роль пользователя)

> Студент с доступом к просмотру расписания и сдаче домашних заданий

## Описание роли

**Student** - базовая роль в системе Шкед для студентов университета МФТИ.

**Значение в системе**: `role = "student"`

## Права доступа

### ✅ Разрешено

#### Просмотр расписания
- Персональное расписание с учетом подгрупп
- Календарный вид расписания
- Фильтрация по предметам
- Экспорт расписания

#### Домашние задания
- Просмотр заданий своей группы
- Сдача работ (MDX редактор)
- Просмотр своих submissions
- Просмотр оценок и feedback от лектора
- Просмотр inline комментариев

#### Профиль
- Просмотр своего профиля
- Редактирование личной информации
- Управление Telegram уведомлениями
- Получение токена привязки Telegram

#### Telegram интеграция
- Привязка Telegram аккаунта
- Получение уведомлений о занятиях
- Получение напоминаний о дедлайнах
- Запросы через бота на естественном языке

### ❌ Запрещено

- Создание/редактирование расписания
- Создание/редактирование домашних заданий
- Проверка работ других студентов
- Просмотр профилей других пользователей
- Управление группами
- Управление предметами
- Доступ к админ-панели

## Интерфейс

### Главная страница
**Путь**: `/student`  
**Компонент**: `app/student/page.tsx`

**Содержимое**:
- Расписание на сегодня
- Ближайшие занятия
- Дедлайны домашних заданий
- Статистика по ДЗ

### Разделы студента

#### Расписание (главная)
**Путь**: `/student`  
**Компонент**: `app/student/page.tsx`

- Расписание на текущую неделю
- Автоматическая фильтрация по подгруппам студента
- Информация о занятии (время, место, тип, преподаватель)

#### Календарь
**Путь**: `/student/calendar`  
**Компонент**: `app/student/calendar/page.tsx`

- Календарный вид расписания
- Выбор недели/месяца
- Цветовое кодирование по предметам

#### Домашние задания
**Путь**: `/student/homework`  
**Компонент**: `app/student/homework/page.tsx`

**Списки**:
- **Активные** - не сданные задания
- **Сданные** - ожидают проверки
- **Проверенные** - с оценкой и feedback

**Фильтры**:
- По предмету
- По статусу
- По дедлайну

#### Просмотр/сдача задания
**Путь**: `/student/homework/[id]`  
**Компонент**: `app/student/homework/[id]/page.tsx`

**Содержимое**:
- Описание задания (MDX)
- Дедлайн
- Материалы
- Форма сдачи (MDX редактор)
- Статус работы
- Оценка и feedback (если проверено)

#### Профиль
**Путь**: `/student/profile`  
**Компонент**: `app/student/profile/page.tsx`

**Информация**:
- Личные данные (имя, email)
- Группа и подгруппы
- Telegram привязка
- Настройки уведомлений

### Навигация
**Компонент**: [[student-nav.tsx]]

Боковое меню:
- 📅 Расписание (главная)
- 📆 Календарь
- 📝 Домашние задания
- 👤 Профиль

## API Endpoints

**Документация**: [[Schedules API]], [[Homework API]]

### Доступные для Student

- `GET /api/schedules?groupId={studentGroupId}` - свое расписание
- `GET /api/homework` - задания своей группы
- `GET /api/homework/[id]` - детали задания
- `POST /api/homework/[id]/submit` - сдать работу
- `PUT /api/homework/[id]/submissions/[submissionId]` - обновить работу
- `GET /api/profile` - свой профиль
- `PUT /api/profile` - обновить профиль
- `GET /api/telegram/link` - получить токен привязки

## Модель данных

**Модель**: [[User]]  
**Роль**: `role = "student"`

```typescript
interface Student extends User {
  role: 'student'
  groupId: string  // Обязательно для студентов
  group: Group
  userGroups: UserGroup[]  // Подгруппы
  homeworkSubmissions: HomeworkSubmission[]
  telegramUser?: TelegramUser
}
```

## Связи

### Основные
- [[Group]] - принадлежность к группе (через `groupId`)
- [[UserGroup]] - подгруппы для предметов
- [[HomeworkSubmission]][] - сданные работы
- [[TelegramUser]] - привязка Telegram

### Через группу
- [[Schedule]][] - расписание группы
- [[Homework]][] - задания для группы

## Подгруппы

**Документация**: [[Система подгрупп]]  
**ADR**: [[ADR-006 Система подгрупп]]

Студент может быть в разных подгруппах для разных предметов:
- Коммерция - подгруппа 1
- Семинары - подгруппа 2
- Финансы - подгруппа 1
- Системное мышление - подгруппа 2

Расписание автоматически фильтруется с учетом подгрупп.

## Примеры использования

### Получение расписания студента

```typescript
// Server Component
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export default async function StudentPage() {
  const session = await getServerSession()
  const student = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      group: true,
      userGroups: true
    }
  })
  
  // Получить расписание с учетом подгрупп
  const schedules = await getStudentSchedule(
    student.id,
    student.groupId
  )
  
  return <ScheduleView schedules={schedules} />
}
```

### Сдача домашнего задания

```typescript
'use client'

import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { useState } from 'react'

export function HomeworkSubmissionForm({ homeworkId }) {
  const [content, setContent] = useState('')
  
  async function handleSubmit() {
    await fetch(`/api/homework/${homeworkId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        content: content,  // MDX
        submissionUrl: '...'  // опционально
      })
    })
    
    toast.success('Работа отправлена!')
  }
  
  return (
    <div>
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder="Ваше решение..."
      />
      <Button onClick={handleSubmit}>Сдать работу</Button>
    </div>
  )
}
```

### Просмотр своих заданий

```typescript
const homeworks = await prisma.homework.findMany({
  where: {
    groupId: student.groupId,
    isActive: true
  },
  include: {
    subject: true,
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

// Разделить по статусам
const active = homeworks.filter(h => !h.submissions[0])
const submitted = homeworks.filter(h => 
  h.submissions[0]?.status === 'SUBMITTED'
)
const reviewed = homeworks.filter(h => 
  h.submissions[0]?.status === 'REVIEWED'
)
```

## Telegram интеграция

**Документация**: [[Telegram интеграция]]  
**ADR**: [[ADR-004 Telegram интеграция]]

### Привязка аккаунта

1. Студент заходит в `/student/profile`
2. Нажимает "Получить токен привязки"
3. Копирует токен
4. Открывает Telegram бота
5. Отправляет `/link TOKEN`
6. Аккаунт привязан ✅

### Уведомления

Студент получает:
- 📚 Напоминания о занятиях (за 30 минут)
- 🕐 Дневные сводки расписания (7:00)
- 📝 Напоминания о дедлайнах ДЗ (за 24ч и 2ч)
- ✅ Уведомления о проверке работ
- 📊 Еженедельные сводки (понедельник, 8:00)

### Команды бота

```
/schedule - Расписание на сегодня
/tomorrow - Расписание на завтра
/week - Расписание на неделю
/homework - Мои домашние задания
/homework_due - Ближайшие дедлайны
/settings - Настройки уведомлений
```

### Естественный язык

```
"Когда моя следующая пара?"
"Что у меня завтра?"
"Какие домашки у меня есть?"
"Когда сдавать ДЗ по математике?"
```

## Визуальное оформление

### Цветовая схема
**Цвет**: Зеленый (`green-600`)  
**Символика**: Рост, развитие, обучение

### Иконка роли
**Icon**: `GraduationCap` (Lucide React)  
**Значение**: Образование, обучение

## Статистика студента

### Общая статистика
```typescript
const stats = {
  totalHomework: 15,      // Всего заданий
  submitted: 12,          // Сдано
  reviewed: 10,           // Проверено
  avgGrade: 8.5,          // Средняя оценка
  pendingDeadlines: 3     // Предстоящие дедлайны
}
```

### Прогресс по предметам
```typescript
const progressBySubject = await prisma.subject.findMany({
  where: {
    homework: {
      some: {
        groupId: student.groupId
      }
    }
  },
  include: {
    homework: {
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
    }
  }
})

const subjectStats = progressBySubject.map(subject => ({
  name: subject.name,
  total: subject.homework.length,
  completed: subject.homework.filter(h => 
    h.submissions[0]?.status === 'REVIEWED'
  ).length,
  avgGrade: calculateAvgGrade(subject.homework)
}))
```

## Демо аккаунт

Для тестирования доступен демо-аккаунт студента:

**Email**: `student123@demo.com`  
**Пароль**: `student123`  
**Группа**: Б05-123

> ⚠️ **Внимание**: Используйте только для разработки и демонстрации!

## Связанные заметки

### Другие роли
- [[Admin]] - администраторы
- [[Teacher]] - преподаватели
- [[Mentor]] - менторы

### Модели
- [[User]] - модель пользователя
- [[Group]] - учебная группа
- [[UserGroup]] - подгруппы
- [[HomeworkSubmission]] - работы студента
- [[TelegramUser]] - Telegram связь

### Функции
- [[Управление расписанием]] - просмотр расписания
- [[Система домашних заданий]] - сдача ДЗ
- [[Telegram интеграция]] - уведомления

### API
- [[Schedules API]] - расписание
- [[Homework API]] - домашние задания

### Компоненты
- [[student-nav.tsx]] - навигация студента
- [[homework-submission-form.tsx]] - форма сдачи ДЗ

## Файлы

- **Модель**: `prisma/schema.prisma` (User с role="student")
- **Страницы**: `app/student/**/*.tsx`
- **Компоненты**: `components/student/**/*.tsx`
- **API**: Используют общие endpoints с фильтрацией по роли

## Официальная документация

- [docs/features/USER_ROLES.md](../../docs/features/USER_ROLES.md#студент-student)

---

#role #student #schedule #homework

