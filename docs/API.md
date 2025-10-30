# 🔌 API Документация ШКЕД

## Обзор

Полная документация API платформы SmartSchedule (ШКЕД) для управления расписанием занятий.

## Базовый URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Аутентификация

Все API endpoints требуют аутентификации через NextAuth.js сессии.

### Заголовки

Запросы должны включать cookie с сессией:

```
Cookie: next-auth.session-token=<token>
```

### Роли пользователей

- `admin` - Администратор
- `student` - Студент
- `teacher` - Преподаватель
- `mentor` - Ментор/Научный руководитель
- `assistant` - Ассистент
- `co_teacher` - Со-преподаватель
- `education_office_head` - Начальник учебного отдела
- `department_admin` - Администратор кафедры

## Endpoints

### Пользователи

#### GET /api/users
Получить список пользователей

**Права:** admin

**Параметры запроса:**
- `role` - Фильтр по роли
- `groupId` - Фильтр по группе
- `search` - Поиск по имени/email

#### POST /api/users
Создать пользователя

**Права:** admin

**Тело запроса:**
```json
{
  "name": "Имя Фамилия",
  "email": "user@example.com",
  "password": "password123",
  "role": "student",
  "status": "ACTIVE"
}
```

### Группы

#### GET /api/groups
Получить список групп

**Права:** все авторизованные

#### POST /api/groups
Создать группу

**Права:** admin

**Тело запроса:**
```json
{
  "name": "Б05-123",
  "year": 2025
}
```

#### GET /api/groups/{id}
Получить детали группы

**Права:** все авторизованные

#### PATCH /api/groups/{id}
Обновить группу

**Права:** admin

#### DELETE /api/groups/{id}
Удалить группу

**Права:** admin

### Предметы

#### GET /api/subjects
Получить список предметов

**Права:** все авторизованные

#### POST /api/subjects
Создать предмет

**Права:** admin

**Тело запроса:**
```json
{
  "name": "Математический анализ",
  "description": "Описание предмета"
}
```

#### GET /api/subjects/{id}
Получить детали предмета

**Права:** все авторизованные

#### PATCH /api/subjects/{id}
Обновить предмет

**Права:** admin, teacher

#### DELETE /api/subjects/{id}
Удалить предмет

**Права:** admin

### Расписание

#### GET /api/schedules
Получить расписание

**Права:** все авторизованные

**Параметры запроса:**
- `groupId` - Фильтр по группе
- `subjectId` - Фильтр по предмету
- `subgroupId` - Фильтр по подгруппе
- `startDate` - Начало периода (ISO 8601)
- `endDate` - Конец периода (ISO 8601)

#### POST /api/schedules
Создать занятие

**Права:** admin

**Тело запроса:**
```json
{
  "subjectId": "subject_id",
  "groupId": "group_id",
  "subgroupId": "subgroup_id",
  "date": "2025-11-05",
  "startTime": "10:00",
  "endTime": "11:30",
  "location": "Аудитория 305",
  "type": "LECTURE"
}
```

#### GET /api/schedules/{id}
Получить детали занятия

**Права:** все авторизованные

#### PATCH /api/schedules/{id}
Обновить занятие

**Права:** admin

#### DELETE /api/schedules/{id}
Удалить занятие

**Права:** admin

### Подгруппы

См. [SUBGROUPS_SYSTEM.md](./features/SUBGROUPS_SYSTEM.md)

#### GET /api/groups/{groupId}/subgroups
Получить подгруппы группы

**Права:** все авторизованные

**Параметры запроса:**
- `subjectId` - Фильтр по предмету

#### POST /api/groups/{groupId}/subgroups
Создать подгруппу

**Права:** admin

**Тело запроса:**
```json
{
  "subjectId": "subject_id",
  "name": "Подгруппа 1",
  "number": 1,
  "description": "Описание"
}
```

#### GET /api/groups/{groupId}/subgroups/{subgroupId}
Получить детали подгруппы

**Права:** все авторизованные

#### PATCH /api/groups/{groupId}/subgroups/{subgroupId}
Обновить подгруппу

**Права:** admin

#### DELETE /api/groups/{groupId}/subgroups/{subgroupId}
Удалить подгруппу

**Права:** admin

#### POST /api/groups/{groupId}/subgroups/{subgroupId}/students
Добавить студентов в подгруппу

**Права:** admin

**Тело запроса:**
```json
{
  "studentIds": ["user_id_1", "user_id_2"]
}
```

#### DELETE /api/groups/{groupId}/subgroups/{subgroupId}/students
Удалить студента из подгруппы

**Права:** admin

**Параметры запроса:**
- `userId` - ID студента

### Посещаемость

См. [ATTENDANCE_TRACKING.md](./features/ATTENDANCE_TRACKING.md)

#### POST /api/schedules/{scheduleId}/attendance
Отметить посещаемость

**Права:** admin, teacher, assistant

**Тело запроса:**
```json
{
  "attendanceList": [
    {
      "userId": "user_id",
      "status": "PRESENT",
      "source": "MANUAL",
      "notes": "Примечание"
    }
  ]
}
```

#### GET /api/schedules/{scheduleId}/attendance
Получить посещаемость занятия

**Права:** admin, teacher, student (своя)

#### GET /api/attendance/report
Сформировать отчет по посещаемости

**Права:** admin, teacher, education_office_head, department_admin

**Параметры запроса:**
- `groupId` - Фильтр по группе
- `subjectId` - Фильтр по предмету
- `userId` - Фильтр по студенту
- `startDate` - Начало периода (ISO 8601)
- `endDate` - Конец периода (ISO 8601)

### Экзамены

См. [EXAM_MANAGEMENT.md](./features/EXAM_MANAGEMENT.md)

#### GET /api/exams
Получить список экзаменов

**Права:** все авторизованные

**Параметры запроса:**
- `groupId` - Фильтр по группе
- `subjectId` - Фильтр по предмету

#### POST /api/exams
Создать экзамен

**Права:** admin, teacher

**Тело запроса:**
```json
{
  "subjectId": "subject_id",
  "groupId": "group_id",
  "type": "EXAM",
  "format": "ORAL",
  "date": "2025-12-20T10:00:00Z",
  "location": "Аудитория 401"
}
```

#### GET /api/exams/{id}
Получить детали экзамена

**Права:** все авторизованные

#### PATCH /api/exams/{id}
Обновить экзамен

**Права:** admin, teacher

#### DELETE /api/exams/{id}
Удалить экзамен

**Права:** admin

#### POST /api/exams/{examId}/results
Внести результат экзамена

**Права:** admin, teacher

**Тело запроса:**
```json
{
  "userId": "user_id",
  "grade": "5",
  "status": "PASSED",
  "notes": "Примечание"
}
```

#### GET /api/exams/{examId}/results
Получить ведомость экзамена

**Права:** admin, teacher, student (свой результат)

### Менторские встречи

См. [MENTOR_MEETINGS.md](./features/MENTOR_MEETINGS.md)

#### GET /api/mentor-meetings
Получить список встреч

**Права:** admin, mentor (свои), student (свои)

**Параметры запроса:**
- `mentorId` - Фильтр по ментору
- `studentId` - Фильтр по студенту
- `status` - Фильтр по статусу

#### POST /api/mentor-meetings
Создать встречу

**Права:** admin, mentor, student

**Тело запроса:**
```json
{
  "mentorId": "mentor_id",
  "studentId": "student_id",
  "scheduledAt": "2025-11-15T14:00:00Z",
  "duration": 60,
  "agenda": "Обсуждение прогресса",
  "location": "Офис / Zoom",
  "meetingType": "VKR"
}
```

#### GET /api/mentor-meetings/{id}
Получить детали встречи

**Права:** admin, mentor, student (участники)

#### PATCH /api/mentor-meetings/{id}
Обновить встречу

**Права:** admin, mentor (свои)

#### DELETE /api/mentor-meetings/{id}
Отменить встречу

**Права:** admin, mentor, student (участники)

### Форум

См. [FORUM_SYSTEM.md](./features/FORUM_SYSTEM.md)

#### GET /api/forum/topics
Получить список тем

**Права:** все авторизованные

**Параметры запроса:**
- `groupId` - Фильтр по группе
- `subjectId` - Фильтр по предмету
- `topicType` - Фильтр по типу

#### POST /api/forum/topics
Создать тему

**Права:** все авторизованные

**Тело запроса:**
```json
{
  "title": "Заголовок темы",
  "content": "Содержание (MDX)",
  "topicType": "QUESTION",
  "visibility": "SUBJECT",
  "groupId": "group_id",
  "subjectId": "subject_id"
}
```

#### GET /api/forum/topics/{id}
Получить детали темы

**Права:** все авторизованные (с учетом visibility)

#### PATCH /api/forum/topics/{id}
Обновить тему

**Права:** admin, автор, teacher (модерация)

#### DELETE /api/forum/topics/{id}
Удалить тему

**Права:** admin, автор

#### GET /api/forum/topics/{topicId}/posts
Получить сообщения темы

**Права:** все авторизованные (с учетом visibility)

#### POST /api/forum/topics/{topicId}/posts
Создать сообщение

**Права:** все авторизованные (если тема не закрыта)

**Тело запроса:**
```json
{
  "content": "Содержание сообщения (MDX)",
  "parentPostId": "parent_post_id"
}
```

#### GET /api/forum/posts/{id}
Получить детали сообщения

**Права:** все авторизованные

#### PATCH /api/forum/posts/{id}
Обновить сообщение

**Права:** admin, автор

#### DELETE /api/forum/posts/{id}
Удалить сообщение

**Права:** admin, автор

### Документы и ресурсы

См. [DOCUMENTS_RESOURCES.md](./features/DOCUMENTS_RESOURCES.md)

#### GET /api/subjects/{subjectId}/documents
Получить документы предмета

**Права:** все авторизованные

**Параметры запроса:**
- `type` - Фильтр по типу документа

#### POST /api/subjects/{subjectId}/documents
Загрузить документ

**Права:** admin, teacher

**Content-Type:** `multipart/form-data`

**Параметры формы:**
- `file` - Файл
- `type` - Тип документа (RPD, ANNOTATION, etc.)
- `description` - Описание

#### GET /api/subjects/{subjectId}/documents/{docId}
Получить детали документа

**Права:** все авторизованные

#### PATCH /api/subjects/{subjectId}/documents/{docId}
Обновить документ

**Права:** admin, teacher (загрузивший)

#### DELETE /api/subjects/{subjectId}/documents/{docId}
Удалить документ

**Права:** admin, teacher (загрузивший)

#### GET /api/subjects/{subjectId}/resources
Получить внешние ресурсы предмета

**Права:** все авторизованные

**Параметры запроса:**
- `type` - Фильтр по типу ресурса

#### POST /api/subjects/{subjectId}/resources
Добавить внешний ресурс

**Права:** admin, teacher

**Тело запроса:**
```json
{
  "type": "ZOOM",
  "title": "Zoom встреча",
  "url": "https://zoom.us/j/123456789",
  "description": "Описание"
}
```

#### GET /api/schedules/{scheduleId}/resources
Получить ресурсы занятия

**Права:** все авторизованные

#### POST /api/schedules/{scheduleId}/resources
Добавить ресурс к занятию

**Права:** admin, teacher

#### GET /api/resources/{id}
Получить детали ресурса

**Права:** все авторизованные

#### PATCH /api/resources/{id}
Обновить ресурс

**Права:** admin, teacher (создатель)

#### DELETE /api/resources/{id}
Удалить ресурс

**Права:** admin, teacher (создатель)

## Коды ответов

- `200 OK` - Успешный запрос
- `201 Created` - Ресурс создан
- `400 Bad Request` - Некорректные данные
- `401 Unauthorized` - Не авторизован
- `403 Forbidden` - Нет доступа
- `404 Not Found` - Ресурс не найден
- `500 Internal Server Error` - Ошибка сервера

## Формат ошибок

```json
{
  "error": "Описание ошибки"
}
```

## Пагинация (планируется)

В будущих версиях API будет поддерживать пагинацию:

```
GET /api/endpoint?page=1&limit=20
```

**Ответ:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Rate Limiting (планируется)

В production окружении будет применяться rate limiting:
- 100 запросов в минуту для аутентифицированных пользователей
- 10 запросов в минуту для неаутентифицированных запросов

## Дополнительная документация

- [Роли пользователей](./features/USER_ROLES.md)
- [Система подгрупп](./features/SUBGROUPS_SYSTEM.md)
- [Отслеживание посещаемости](./features/ATTENDANCE_TRACKING.md)
- [Управление экзаменами](./features/EXAM_MANAGEMENT.md)
- [Менторские встречи](./features/MENTOR_MEETINGS.md)
- [Форум и обсуждения](./features/FORUM_SYSTEM.md)
- [Документы и ресурсы](./features/DOCUMENTS_RESOURCES.md)

---

*Документация обновлена: 30 октября 2025*
*Версия системы: 2.0.0*


