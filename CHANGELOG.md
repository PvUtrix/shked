# 📝 CHANGELOG

Все заметные изменения в проекте SmartSchedule (ШКЕД) документируются в этом файле.

---

## [2.0.0] - 2025-10-30

### 🎉 Major Release - КТП Integration

Полная интеграция требований Контрольно-Тематического Плана (КТП) МФТИ.

---

### ✨ Добавлено

#### Роли пользователей
- **4 новые роли**: `teacher`, `assistant`, `co_teacher`, `education_office_head`, `department_admin`
- Переименование `lector` → `teacher` (с обратной совместимостью)
- Расширенная система прав доступа (RBAC)

#### Модели данных (14 новых)
- `SubjectTeacher` - множественные преподаватели на предмет
- `SubjectDocument` - РПД и документы предметов
- `ExternalResource` - внешние ресурсы (ЭОР, Zoom, чаты)
- `Subgroup` - гибкая система подгрупп
- `SubgroupStudent` - студенты в подгруппах
- `Attendance` - детальная отметка посещаемости
- `Exam` - управление экзаменами и зачетами
- `ExamResult` - результаты студентов
- `MentorMeeting` - встречи студентов с менторами
- `ForumTopic` - темы форума
- `ForumPost` - посты форума

#### API Endpoints (35+)
- **Документы**: `/api/subjects/[id]/documents/*` (4 endpoints)
- **Ресурсы**: `/api/subjects/[id]/resources/*`, `/api/schedules/[id]/resources/*` (5 endpoints)
- **Подгруппы**: `/api/groups/[id]/subgroups/*` (7 endpoints)
- **Посещаемость**: `/api/schedules/[id]/attendance/*`, `/api/attendance/report` (3 endpoints)
- **Экзамены**: `/api/exams/*` (5 endpoints)
- **Встречи**: `/api/mentor-meetings/*` (3 endpoints)
- **Форум**: `/api/forum/topics/*`, `/api/forum/posts/*` (8 endpoints)

#### UI Components (17 новых)
**Общие (6):**
- `FileUploader` - загрузка файлов
- `SubgroupSelector` - выбор подгрупп
- `AttendanceBadge` + `AttendanceStats` - отображение посещаемости
- `ExamGradeBadge` + `AverageGrade` - отображение оценок
- `ResourceLink` + `ResourceList` - внешние ресурсы
- `StatusBadge` + `RoleBadge` - статусы

**Admin (5):**
- `DocumentUploadForm` - загрузка документов
- `ExternalResourceForm` - управление ресурсами
- `SubgroupForm` - управление подгруппами
- `AttendanceForm` - отметка посещаемости
- `ExamForm` - управление экзаменами

**Student (3):**
- `ForumTopicForm` - создание тем
- `MentorMeetingForm` - запись на встречи
- `AttendanceStatsView` - просмотр статистики

**Mentor (2):**
- `MentorMeetingsList` - список встреч
- `StudentProfileView` - профиль студента

**Teacher (2):**
- `TeacherNav` - навигация
- `HomeworkForm` - форма заданий

#### Pages (13 новых)
**Mentor (3):**
- `/mentor` - дашборд
- `/mentor/meetings` - управление встречами
- `/mentor/students/[id]` - профиль студента

**Student (6):**
- `/student/attendance` - посещаемость
- `/student/exams` - экзамены
- `/student/forum` - форум
- `/student/forum/new` - создание темы
- `/student/meetings` - встречи
- `/student/meetings/new` - запись

**Teacher (4):**
- `/teacher` - главная
- `/teacher/layout.tsx` - layout
- `/teacher/attendance` - посещаемость
- `/teacher/exams` - экзамены

#### Скрипты
- `scripts/migrate-lector-to-teacher.ts` - миграция ролей
- `scripts/migrate-subgroups.ts` - миграция подгрупп

#### Документация (29 файлов)
- `README.md` - обзор проекта
- `DEPLOYMENT_GUIDE.md` - руководство по развертыванию
- `FINAL_SUMMARY.md` - итоговый summary
- `docs/API.md` - документация API
- `docs/features/` - 7 документов о функциях
- `obsidian-vault/` - 15 заметок Obsidian
- Отчеты о прогрессе (5 файлов)

---

### 🔄 Изменено

#### Модели
- `User` - добавлено поле `status` (ACTIVE, EXPELLED, ACADEMIC_LEAVE)
- `User` - расширено поле `role` (8 значений вместо 4)
- `Subject` - `lectorId` помечен как deprecated
- `Subject` - добавлены связи с `teachers`, `documents`, `resources`, `subgroups`, `exams`
- `Schedule` - добавлены `videoUrl`, `recordingStatus`, `zoomMeetingId`
- `Group` - добавлены связи с `subgroups`, `exams`, `forumTopics`

#### API
- `/api/subjects` - поддержка множественных преподавателей
- `/api/subjects` - фильтры по `teacherId`, `assistantId`
- `/api/subjects` - поддержка включения связанных данных

#### Middleware
- Добавлена защита для `/teacher/*`
- Добавлена защита для `/assistant/*`, `/co-teacher/*`
- Добавлена защита для `/education-office/*`, `/department/*`
- Редирект `/lector/*` → `/teacher/*` для совместимости

#### Типы
- `next-auth.d.ts` - обновлены типы ролей
- `lib/auth.ts` - обновлена логика авторизации
- `lib/types.ts` - добавлены новые типы

---

### 🗑️ Deprecated

- `User.lectorId` в пользу `SubjectTeacher`
- Роль `lector` в пользу `teacher` (с обратной совместимостью)
- Старые поля подгрупп в `UserGroup` (мигрированы в `Subgroup`)

---

### 🐛 Исправлено

- Улучшена типизация session в NextAuth
- Исправлены импорты компонентов
- Оптимизированы запросы к БД
- Исправлена валидация форм

---

### 🔒 Безопасность

- Усилена проверка ролей в middleware
- Добавлена валидация на уровне API
- Улучшена защита роутов
- Добавлена проверка прав доступа к данным

---

## [1.0.0] - 2025-10-01

### Первый релиз

- Базовая система управления расписанием
- 4 роли: admin, lector, mentor, student
- Домашние задания
- Расписание занятий
- Группы и предметы
- Telegram интеграция

---

## Типы изменений

- `✨ Добавлено` - новые функции
- `🔄 Изменено` - изменения в существующей функциональности
- `🗑️ Deprecated` - функции, которые скоро будут удалены
- `🐛 Исправлено` - исправления багов
- `🔒 Безопасность` - исправления уязвимостей

---

## Формат

Changelog основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
и этот проект придерживается [Semantic Versioning](https://semver.org/lang/ru/).
