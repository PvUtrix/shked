# Mentor (Роль пользователя)

> Ментор группы с правами мониторинга студентов и их прогресса

## Описание роли

**Mentor** - роль для менторов, которые помогают студентам определенных групп, следят за их прогрессом и оказывают поддержку.

**Значение в системе**: `role = "mentor"`

## Права доступа

### ✅ Разрешено

#### Мои группы
- Просмотр назначенных групп
- Список студентов в своих группах
- Информация о студентах (email, контакты)

#### Расписание
- Просмотр расписания своих групп
- Календарный вид расписания
- Фильтрация по группам

#### Домашние задания (мониторинг)
- Просмотр всех ДЗ своих групп
- Просмотр статистики выполнения
- **Просмотр работ студентов** (MDX контент)
- **Просмотр оценок и feedback** от лектора
- Мониторинг дедлайнов

#### Профиль и уведомления
- Просмотр и редактирование профиля
- Telegram уведомления
- Управление Telegram привязкой

### ❌ Запрещено

- Создание домашних заданий
- Редактирование домашних заданий
- **Проверка работ** (выставление оценок)
- Изменение статуса работ
- Управление группами
- Управление студентами
- Создание расписания
- Доступ к админ-панели

## Интерфейс

### Главная страница
**Путь**: `/mentor`  
**Компонент**: `app/mentor/page.tsx`

**Содержимое**:
- Список назначенных групп
- Сводка по студентам
- Ближайшие дедлайны ДЗ
- Проблемные студенты (не сдали ДЗ)

### Разделы ментора

#### Студенты
**Путь**: `/mentor/students`  
**Компонент**: `app/mentor/students/page.tsx`

- Список всех студентов своих групп
- Фильтр по группам
- Информация о студенте:
  - Имя, email
  - Группа и подгруппы
  - Статистика по ДЗ (сдано/всего)
  - Средняя оценка

#### Расписание
**Путь**: `/mentor/schedule`  
**Компонент**: `app/mentor/schedule/page.tsx`

- Расписание всех своих групп
- Календарный вид
- Фильтрация по группам
- Информация о занятиях

#### Домашние задания
**Путь**: `/mentor/homework`  
**Компонент**: `app/mentor/homework/page.tsx`

**Вкладки**:
- **Все задания** - ДЗ для своих групп
- **Активные** - с актуальным дедлайном
- **На проверке** - сданные работы
- **Проверенные** - с оценками

**Для каждого задания**:
- Название и предмет
- Дедлайн
- Статистика выполнения:
  - Сдано: 15/20
  - Проверено: 12/15
  - Средняя оценка: 8.5

#### Просмотр задания и работ
**Путь**: `/mentor/homework/[id]`  
**Компонент**: `app/mentor/homework/[id]/page.tsx`

**Содержимое**:
- Описание задания (MDX)
- Список работ студентов своих групп:
  - Статус (не сдано/сдано/проверено)
  - Оценка (если проверено)
  - Кнопка "Просмотр работы"

#### Просмотр работы студента
**Путь**: `/mentor/homework/[id]/submissions/[submissionId]`  
**Компонент**: `app/mentor/homework/[id]/submissions/[submissionId]/page.tsx`

**Содержимое**:
- Информация о студенте
- Задание (MDX)
- Работа студента (MDX) - **только чтение**
- Оценка и feedback от лектора (если проверено)
- Inline комментарии лектора - **только просмотр**

> ⚠️ **Важно**: Ментор может только **смотреть**, но не может **проверять** или **оценивать** работы.

#### Профиль
**Путь**: `/mentor/profile`  
**Компонент**: `app/mentor/profile/page.tsx`

**Информация**:
- Личные данные
- Назначенные группы
- Telegram привязка
- Настройки уведомлений

### Навигация
**Компонент**: [[mentor-nav.tsx]]

Боковое меню:
- 🏠 Главная
- 👥 Студенты
- 📅 Расписание
- 📝 Домашние задания
- 👤 Профиль

## API Endpoints

**Документация**: [[Groups API]], [[Homework API]], [[Schedules API]]

### Доступные для Mentor

- `GET /api/groups?mentorId={myId}` - свои группы
- `GET /api/groups/[id]/students` - студенты своей группы
- `GET /api/schedules?groupId={myGroupId}` - расписание своих групп
- `GET /api/homework?groupId={myGroupId}` - ДЗ своих групп
- `GET /api/homework/[id]/submissions` - работы студентов своих групп (только чтение)
- `GET /api/homework/[id]/submissions/[submissionId]` - конкретная работа (только чтение)
- `GET /api/profile` - свой профиль
- `PUT /api/profile` - обновить профиль

## Модель данных

**Модель**: [[User]]  
**Роль**: `role = "mentor"`

```typescript
interface Mentor extends User {
  role: 'mentor'
  mentorGroupIds: string[]  // JSON массив ID групп
}
```

## Связи

### Основные
- [[Group]][] - назначенные группы (через `mentorGroupIds`)
- [[User]][] - студенты назначенных групп

### Через группы
- [[Schedule]][] - расписание групп
- [[Homework]][] - задания для групп
- [[HomeworkSubmission]][] - работы студентов

## Назначение ментора к группе

**Действие**: Выполняет [[Admin]]

```typescript
// Назначить ментора к группе
const mentor = await prisma.user.findUnique({
  where: { id: mentorId }
})

const currentGroupIds = (mentor.mentorGroupIds as string[]) || []

await prisma.user.update({
  where: { id: mentorId },
  data: {
    mentorGroupIds: [...currentGroupIds, newGroupId]
  }
})
```

## Примеры использования

### Получение своих групп

```typescript
const mentor = await prisma.user.findUnique({
  where: { id: mentorId },
  include: {
    // mentorGroupIds - это JSON поле
  }
})

const myGroups = await prisma.group.findMany({
  where: {
    id: {
      in: mentor.mentorGroupIds as string[]
    }
  },
  include: {
    users: {
      where: {
        role: 'student'
      }
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
```

### Получение студентов своих групп

```typescript
const students = await prisma.user.findMany({
  where: {
    role: 'student',
    groupId: {
      in: mentor.mentorGroupIds as string[]
    }
  },
  include: {
    group: true,
    homeworkSubmissions: {
      include: {
        homework: {
          include: {
            subject: true
          }
        }
      }
    }
  }
})

// Посчитать статистику по каждому студенту
const studentsWithStats = students.map(student => ({
  ...student,
  totalSubmissions: student.homeworkSubmissions.length,
  reviewedSubmissions: student.homeworkSubmissions.filter(s => 
    s.status === 'REVIEWED'
  ).length,
  avgGrade: calculateAvgGrade(student.homeworkSubmissions)
}))
```

### Мониторинг выполнения ДЗ

```typescript
const homeworkStats = await prisma.homework.findMany({
  where: {
    groupId: {
      in: mentor.mentorGroupIds as string[]
    },
    isActive: true
  },
  include: {
    subject: true,
    group: true,
    submissions: {
      where: {
        user: {
          groupId: {
            in: mentor.mentorGroupIds as string[]
          }
        }
      }
    }
  }
})

const stats = homeworkStats.map(hw => {
  const totalStudents = /* количество студентов в группе */
  const submitted = hw.submissions.filter(s => 
    s.status !== 'NOT_SUBMITTED'
  ).length
  const reviewed = hw.submissions.filter(s => 
    s.status === 'REVIEWED'
  ).length
  
  return {
    title: hw.title,
    subject: hw.subject.name,
    deadline: hw.deadline,
    submissionRate: (submitted / totalStudents) * 100,
    reviewedRate: reviewed ? (reviewed / submitted) * 100 : 0
  }
})
```

### Просмотр работы студента (только чтение)

```typescript
const submission = await prisma.homeworkSubmission.findUnique({
  where: { id: submissionId },
  include: {
    homework: {
      include: {
        subject: true,
        group: true
      }
    },
    user: {
      select: {
        name: true,
        email: true,
        groupId: true
      }
    },
    comments: {
      include: {
        author: {
          select: {
            name: true
          }
        }
      }
    }
  }
})

// Проверка что студент из группы ментора
if (!mentor.mentorGroupIds.includes(submission.user.groupId)) {
  throw new Error('Forbidden')
}

// Только чтение, без возможности редактирования
```

## Статистика ментора

### Общая статистика
```typescript
const mentorStats = {
  totalGroups: 2,
  totalStudents: 40,
  activeHomework: 5,
  pendingSubmissions: 12,  // Не сдали
  needsAttention: 3  // Студенты с низкой успеваемостью
}
```

### Проблемные студенты
```typescript
const studentsNeedingHelp = await prisma.user.findMany({
  where: {
    role: 'student',
    groupId: {
      in: mentor.mentorGroupIds as string[]
    }
  },
  include: {
    homeworkSubmissions: {
      where: {
        homework: {
          deadline: {
            lt: new Date()  // Просрочены
          }
        },
        status: 'NOT_SUBMITTED'
      }
    }
  }
})

const problematicStudents = studentsNeedingHelp.filter(student => 
  student.homeworkSubmissions.length > 2  // Пропустили больше 2 заданий
)
```

## Отличие от Lector

| Возможность | Lector | Mentor |
|-------------|--------|--------|
| Создание ДЗ | ✅ Да | ❌ Нет |
| Редактирование ДЗ | ✅ Да (свои) | ❌ Нет |
| Просмотр работ | ✅ Да | ✅ Да |
| Проверка работ | ✅ Да | ❌ Нет |
| Выставление оценок | ✅ Да | ❌ Нет |
| Inline комментарии | ✅ Создавать | 👁️ Только просмотр |
| Просмотр feedback | ✅ Да | ✅ Да |
| Мониторинг студентов | ⚠️ Ограничено | ✅ Полный доступ |

## Telegram интеграция

**Документация**: [[Telegram интеграция]]

### Уведомления для ментора
- 📊 Еженедельная сводка по группам
- ⚠️ Уведомления о студентах, не сдавших ДЗ
- 📅 Ближайшие дедлайны для группы

### Команды бота
```
/students - Мои студенты
/homework - Активные ДЗ моих групп
/pending - Студенты, не сдавшие ДЗ
```

## Визуальное оформление

### Цветовая схема
**Цвет**: Оранжевый (`orange-600`)  
**Символика**: Поддержка, забота, помощь

### Иконка роли
**Icon**: `UserCheck` (Lucide React)  
**Значение**: Помощь, поддержка, наставничество

## Демо аккаунт

Для тестирования доступен демо-аккаунт ментора:

**Email**: `mentor@demo.com`  
**Пароль**: `mentor123`  
**Группы**: Б05-123

> ⚠️ **Внимание**: Используйте только для разработки и демонстрации!

## Связанные заметки

### Другие роли
- [[Admin]] - администраторы
- [[Student]] - студенты
- [[Lector]] - преподаватели

### Модели
- [[User]] - модель пользователя
- [[Group]] - назначенные группы
- [[Homework]] - задания групп
- [[HomeworkSubmission]] - работы студентов
- [[Schedule]] - расписание групп

### Функции
- [[Система домашних заданий]] - мониторинг выполнения ДЗ

### API
- [[Groups API]] - группы ментора
- [[Homework API]] - просмотр заданий и работ
- [[Schedules API]] - расписание групп

### Компоненты
- [[mentor-nav.tsx]] - навигация ментора

## Файлы

- **Модель**: `prisma/schema.prisma` (User с role="mentor")
- **Страницы**: `app/mentor/**/*.tsx`
- **Компоненты**: `components/mentor/**/*.tsx`
- **API**: Используют общие endpoints с проверкой прав

## Официальная документация

- [docs/features/USER_ROLES.md](../../docs/features/USER_ROLES.md#ментор-mentor)

---

#role #mentor #support #monitoring

