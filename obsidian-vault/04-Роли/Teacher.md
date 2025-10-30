# Teacher (Преподаватель)

> Основной преподаватель предмета с правами создания заданий и проверки работ

## Описание роли

**Teacher** (Преподаватель) - роль для преподавателей университета, ведущих предметы и проверяющих работы студентов.

**Значение в системе**: `role = "teacher"`

**История**: В версии 2.0.0 роль была переименована с `teacher` на `teacher`. Миграция выполняется через `scripts/migrate-teacher-to-teacher.ts`.

## Права доступа

### ✅ Разрешено

#### Мои предметы
- Просмотр назначенных предметов (через SubjectTeacher)
- Просмотр списка групп по своим предметам
- Просмотр расписания по своим предметам
- Управление документами предмета (РПД, аннотации)
- Добавление внешних ресурсов (ЭОР, Zoom-ссылки, чаты)

#### Домашние задания
- **Создание ДЗ** для своих предметов (MDX редактор)
- **Редактирование ДЗ** по своим предметам
- **Удаление ДЗ** по своим предметов
- Просмотр всех сданных работ по своим предметам
- Фильтрация работ по статусу и студентам

#### Проверка работ
- Просмотр MDX контента работ студентов
- **Выставление оценок** (grade)
- **Развернутая обратная связь** (feedback в MDX)
- **Inline комментарии** к работам
- Изменение статуса работы (NOT_SUBMITTED → SUBMITTED → REVIEWED)

#### Посещаемость
- **Отметка посещаемости** на занятиях
- Просмотр статистики посещаемости по своим предметам
- Формирование отчетов по посещаемости

#### Экзамены
- **Создание экзаменов/зачетов** по своим предметам
- **Внесение результатов** экзаменов
- Редактирование результатов
- Просмотр ведомостей

#### Профиль и уведомления
- Просмотр и редактирование профиля
- Telegram уведомления о занятиях
- Управление Telegram привязкой

### ❌ Запрещено

- Управление группами
- Создание предметов (только admin)
- Создание расписания (только admin)
- Управление пользователями
- Просмотр/проверка ДЗ по чужим предметам
- Доступ к админ-панели
- Создание/редактирование подгрупп (только admin)

## Интерфейс

### Главная страница
**Путь**: `/teacher`  
**Компонент**: `app/teacher/page.tsx`

**Содержимое**:
- Список назначенных предметов
- Статистика по ДЗ (всего, проверенных, ожидают проверки)
- Ближайшие занятия
- Последние сданные работы
- Напоминания о непроверенных работах

### Разделы преподавателя

#### Расписание
**Путь**: `/teacher/schedule`  
**Компонент**: `app/teacher/schedule/page.tsx`

- Расписание занятий по своим предметам
- Календарный вид
- Информация о группах и подгруппах
- Ссылки на Zoom
- Отметка посещаемости прямо из расписания
- Telegram уведомления о занятиях

#### Домашние задания
**Путь**: `/teacher/homework`  
**Компонент**: `app/teacher/homework/page.tsx`

**Вкладки**:
- **Мои задания** - созданные ДЗ
- **На проверке** - сданные работы (status: SUBMITTED)
- **Проверенные** - работы с оценками (status: REVIEWED)

**Действия**:
- Создать новое задание
- Редактировать задание
- Просмотреть работы студентов

#### Посещаемость
**Путь**: `/teacher/attendance`  
**Компонент**: `app/teacher/attendance/page.tsx`

- Список занятий для отметки
- Быстрая отметка всех студентов
- Статистика по группам
- Экспорт отчетов

#### Экзамены
**Путь**: `/teacher/exams`  
**Компонент**: `app/teacher/exams/page.tsx`

- Список экзаменов
- Создание нового экзамена
- Ведомости экзаменов
- Внесение результатов

#### Профиль
**Путь**: `/teacher/profile`  
**Компонент**: `app/teacher/profile/page.tsx`

**Информация**:
- Личные данные
- Назначенные предметы
- Telegram привязка
- Настройки уведомлений

### Навигация
**Компонент**: `components/teacher/teacher-nav.tsx`

Боковое меню:
- 🏠 Главная
- 📅 Расписание
- 📝 Домашние задания
- ✅ Посещаемость
- 📝 Экзамены
- 👤 Профиль

## API Endpoints

**Документация**: [[Homework API]], [[Schedules API]], [[API.md]]

### Доступные для Teacher

#### Предметы
- `GET /api/subjects?teacherId={myId}` - свои предметы
- `GET /api/subjects/{id}/documents` - документы предмета
- `POST /api/subjects/{id}/documents` - загрузить документ (РПД)
- `GET /api/subjects/{id}/resources` - ресурсы предмета
- `POST /api/subjects/{id}/resources` - добавить ресурс (ЭОР, Zoom)

#### Расписание
- `GET /api/schedules?subjectId={mySubjectId}` - свое расписание
- `GET /api/schedules/{id}/resources` - ресурсы занятия
- `POST /api/schedules/{id}/resources` - добавить ресурс к занятию

#### Домашние задания
- `GET /api/homework?teacherId={myId}` - свои задания
- `POST /api/homework` - создать задание
- `PUT /api/homework/[id]` - редактировать свое задание
- `DELETE /api/homework/[id]` - удалить свое задание
- `GET /api/homework/[id]/submissions` - работы по своему заданию
- `POST /api/homework/[id]/submissions/[submissionId]/review` - проверить работу
- `POST /api/homework/[id]/submissions/[submissionId]/comments` - добавить комментарий

#### Посещаемость
- `POST /api/schedules/{scheduleId}/attendance` - отметить посещаемость
- `GET /api/schedules/{scheduleId}/attendance` - просмотр посещаемости занятия
- `GET /api/attendance/report` - сформировать отчет

#### Экзамены
- `GET /api/exams?subjectId={mySubjectId}` - экзамены по своим предметам
- `POST /api/exams` - создать экзамен
- `PATCH /api/exams/{id}` - редактировать экзамен
- `POST /api/exams/{examId}/results` - внести результат
- `GET /api/exams/{examId}/results` - получить ведомость

#### Профиль
- `GET /api/profile` - свой профиль
- `PUT /api/profile` - обновить профиль

## Модель данных

**Модель**: [[User]]  
**Роль**: `role = "teacher"`

```typescript
interface Teacher extends User {
  role: 'teacher'
  teacherSubjects: SubjectTeacher[]  // Назначенные предметы
  uploadedDocuments: SubjectDocument[]  // Загруженные документы
  markedAttendance: Attendance[]  // Отметки посещаемости
  recordedExams: ExamResult[]  // Внесенные результаты экзаменов
  homeworkComments: HomeworkComment[]  // Комментарии к работам
}
```

## Связи

### Основные
- [[SubjectTeacher]] - привязка к предметам (может быть TEACHER, ASSISTANT, CO_TEACHER)
- [[Subject]] - назначенные предметы
- [[Homework]] - созданные задания
- [[HomeworkComment]] - комментарии к работам студентов
- [[SubjectDocument]] - загруженные документы (РПД, аннотации)
- [[ExternalResource]] - добавленные ресурсы (ЭОР, Zoom, чаты)
- [[Attendance]] - отмеченная посещаемость
- [[ExamResult]] - внесенные результаты экзаменов

### Через предметы
- [[Schedule]] - расписание по предметам
- [[HomeworkSubmission]] - работы студентов
- [[Exam]] - экзамены и зачеты
- [[Subgroup]] - подгруппы предметов

## Назначение преподавателя к предмету

**Действие**: Выполняет [[Admin]]

```typescript
// Новая система (с версии 2.0.0)
await prisma.subjectTeacher.create({
  data: {
    subjectId: subjectId,
    userId: teacherId,
    role: 'TEACHER'  // или 'ASSISTANT', 'CO_TEACHER'
  }
})

// Старая система (deprecated)
await prisma.subject.update({
  where: { id: subjectId },
  data: {
    teacherId: teacherId  // Устаревшее поле
  }
})
```

После назначения преподаватель получает доступ к:
- Созданию ДЗ для этого предмета
- Просмотру расписания по предмету
- Проверке работ студентов
- Отметке посещаемости
- Созданию экзаменов

## Примеры использования

### Получение своих предметов

```typescript
const mySubjects = await prisma.subject.findMany({
  where: {
    teachers: {
      some: {
        userId: teacherId,
        role: 'TEACHER'
      }
    }
  },
  include: {
    teachers: {
      include: {
        user: true
      }
    },
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
    documents: true,
    resources: true,
    _count: {
      select: {
        homework: true,
        schedules: true,
        exams: true
      }
    }
  }
})
```

### Отметка посещаемости

```typescript
async function markAttendance({
  scheduleId,
  attendanceList
}: {
  scheduleId: string
  attendanceList: Array<{
    userId: string
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
    source?: 'MANUAL' | 'ZOOM_AUTO'
    notes?: string
  }>
}) {
  await fetch(`/api/schedules/${scheduleId}/attendance`, {
    method: 'POST',
    body: JSON.stringify({ attendanceList })
  })
  
  toast.success('Посещаемость отмечена!')
}
```

### Создание экзамена

```typescript
async function createExam({
  subjectId,
  groupId,
  type,
  format,
  date,
  location
}: {
  subjectId: string
  groupId: string
  type: 'EXAM' | 'CREDIT' | 'DIFF_CREDIT'
  format: 'ORAL' | 'WRITTEN' | 'MIXED'
  date: Date
  location: string
}) {
  await fetch('/api/exams', {
    method: 'POST',
    body: JSON.stringify({
      subjectId,
      groupId,
      type,
      format,
      date,
      location
    })
  })
  
  toast.success('Экзамен создан!')
}
```

## Статистика преподавателя

### Общая статистика
```typescript
const teacherStats = {
  totalSubjects: 3,
  totalHomework: 15,
  pendingReviews: 8,
  reviewedToday: 5,
  avgGradeGiven: 8.2,
  totalExams: 6,
  attendanceMarked: 42
}
```

## Telegram интеграция

**Документация**: [[Telegram интеграция]]

### Уведомления для преподавателя
- 📚 Напоминания о занятиях (за 30 минут)
- 📝 Уведомления о новых сданных работах
- ✅ Напоминания об отметке посещаемости
- 📊 Еженедельная сводка по проверкам

### Команды бота
```
/schedule - Мое расписание на сегодня
/tomorrow - Мое расписание на завтра
/pending - Работы на проверке
/attendance - Занятия для отметки посещаемости
```

## Связанные заметки

### Другие роли
- [[Admin]] - администраторы
- [[Student]] - студенты
- [[Mentor]] - менторы
- [[Assistant]] - ассистенты преподавателя
- [[Co-Teacher]] - со-преподаватели

### Модели
- [[User]] - модель пользователя
- [[Subject]] - предметы преподавателя
- [[SubjectTeacher]] - привязка к предметам
- [[Homework]] - созданные задания
- [[HomeworkSubmission]] - работы на проверку
- [[HomeworkComment]] - inline комментарии
- [[Schedule]] - расписание занятий
- [[Attendance]] - посещаемость
- [[Exam]] - экзамены
- [[ExamResult]] - результаты экзаменов
- [[SubjectDocument]] - документы предмета
- [[ExternalResource]] - внешние ресурсы

### Функции
- [[Система домашних заданий]] - создание и проверка ДЗ
- [[MDX редактор]] - форматирование заданий и feedback
- [[Система посещаемости]] - отметка и отчеты
- [[Управление экзаменами]] - создание и ведомости

### API
- [[Homework API]] - создание и проверка ДЗ
- [[Schedules API]] - расписание
- [[Attendance API]] - посещаемость
- [[Exams API]] - экзамены

## Файлы

- **Модель**: `prisma/schema.prisma` (User с role="teacher")
- **Страницы**: `app/teacher/**/*.tsx`
- **Компоненты**: `components/teacher/**/*.tsx`
- **API**: Используют общие endpoints с проверкой прав
- **Миграция**: `scripts/migrate-teacher-to-teacher.ts`

## Официальная документация

- [docs/features/USER_ROLES.md](../../docs/features/USER_ROLES.md#преподаватель-teacher)
- [docs/features/ATTENDANCE_TRACKING.md](../../docs/features/ATTENDANCE_TRACKING.md)
- [docs/features/EXAM_MANAGEMENT.md](../../docs/features/EXAM_MANAGEMENT.md)
- [docs/API.md](../../docs/API.md)

---

#role #teacher #homework #attendance #exams #education


