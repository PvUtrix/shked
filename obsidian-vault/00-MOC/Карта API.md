# 🔌 Карта API Endpoints

> Полный справочник всех API endpoints системы Шкед

## 📍 Обзор API структуры

Все API endpoints находятся в `app/api/` и следуют Next.js App Router конвенциям.

**Базовый URL**: `https://yourdomain.com/api`

## 🔐 Аутентификация

### NextAuth.js Endpoints
**Базовый путь**: `/api/auth/*`  
**Документация**: [[Auth API]]

- `POST /api/auth/signin` - вход в систему
- `POST /api/auth/signout` - выход из системы
- `GET /api/auth/session` - получить текущую сессию
- `GET /api/auth/csrf` - CSRF token
- `GET /api/auth/providers` - список провайдеров

**Конфигурация**: [[NextAuth.js аутентификация]]  
**Middleware**: [[Middleware аутентификации]]

## 👥 Управление пользователями

### Users API
**Базовый путь**: `/api/users`  
**Документация**: [[Users API]]  
**Модель**: [[User]]

#### Endpoints
- `GET /api/users` - список пользователей (admin only)
- `GET /api/users/[id]` - получить пользователя
- `POST /api/users` - создать пользователя (admin only)
- `PUT /api/users/[id]` - обновить пользователя
- `DELETE /api/users/[id]` - удалить пользователя (admin only)
- `PUT /api/users/[id]/role` - изменить роль (admin only)

**Доступ**:
- [[Admin]] - полный CRUD
- Авторизованные - читать свой профиль

## 📚 Группы

### Groups API
**Базовый путь**: `/api/groups`  
**Документация**: [[Groups API]]  
**Модель**: [[Group]]

#### Endpoints
- `GET /api/groups` - список групп
- `GET /api/groups/[id]` - детали группы
- `POST /api/groups` - создать группу (admin only)
- `PUT /api/groups/[id]` - обновить группу (admin only)
- `DELETE /api/groups/[id]` - удалить группу (admin only)

#### Подгруппы (Students & Subgroups)
- `GET /api/groups/[id]/students` - студенты группы
- `PUT /api/groups/[id]/students/[studentId]/subgroups` - назначить подгруппы

**Связанные модели**: [[UserGroup]], [[Система подгрупп]]

## 📖 Предметы

### Subjects API
**Базовый путь**: `/api/subjects`  
**Документация**: [[Subjects API]]  
**Модель**: [[Subject]]

#### Endpoints
- `GET /api/subjects` - список предметов
- `GET /api/subjects/[id]` - детали предмета
- `POST /api/subjects` - создать предмет (admin only)
- `PUT /api/subjects/[id]` - обновить предмет (admin only)
- `DELETE /api/subjects/[id]` - удалить предмет (admin only)

**Связи**: [[Lector]] через `lectorId`

## 📅 Расписание

### Schedules API
**Базовый путь**: `/api/schedules`  
**Документация**: [[Schedules API]]  
**Модель**: [[Schedule]]

#### Endpoints
- `GET /api/schedules` - список расписания
  - Query params: `groupId`, `subjectId`, `date`, `startDate`, `endDate`
- `GET /api/schedules/[id]` - детали занятия
- `POST /api/schedules` - создать занятие (admin only)
- `PUT /api/schedules/[id]` - обновить занятие (admin only)
- `DELETE /api/schedules/[id]` - удалить занятие (admin only)

**Функции**: [[Управление расписанием]]

## 📝 Домашние задания

### Homework API
**Базовый путь**: `/api/homework`  
**Документация**: [[Homework API]]  
**Модели**: [[Homework]], [[HomeworkSubmission]], [[HomeworkComment]]

#### Основные endpoints
- `GET /api/homework` - список заданий
  - Студенты видят свои
  - Лекторы видят свои предметы
  - Админы видят все
- `GET /api/homework/[id]` - детали задания
- `POST /api/homework` - создать задание (lector, admin)
- `PUT /api/homework/[id]` - обновить задание (lector, admin)
- `DELETE /api/homework/[id]` - удалить задание (lector, admin)

#### Submissions (Работы студентов)
- `GET /api/homework/[id]/submissions` - все работы по заданию
- `GET /api/homework/[id]/submissions/[submissionId]` - конкретная работа
- `POST /api/homework/[id]/submit` - сдать работу (student)
- `PUT /api/homework/[id]/submissions/[submissionId]` - обновить работу
- `POST /api/homework/[id]/submissions/[submissionId]/review` - проверить работу (lector)

#### Comments (Inline комментарии)
- `GET /api/homework/[id]/submissions/[submissionId]/comments` - комментарии к работе
- `POST /api/homework/[id]/submissions/[submissionId]/comments` - добавить комментарий (lector)
- `PUT /api/homework/[id]/submissions/[submissionId]/comments/[commentId]` - обновить комментарий
- `DELETE /api/homework/[id]/submissions/[submissionId]/comments/[commentId]` - удалить комментарий

**Функции**: [[Система домашних заданий]], [[MDX редактор]]

## 📱 Telegram

### Telegram API
**Базовый путь**: `/api/telegram`  
**Документация**: [[Telegram API]]  
**Модели**: [[TelegramUser]], [[BotSettings]]

#### Configuration
- `GET /api/telegram/config` - получить настройки бота (admin)
- `POST /api/telegram/config` - сохранить настройки (admin)

#### Linking (Привязка аккаунтов)
- `GET /api/telegram/link` - получить токен привязки
- `POST /api/telegram/link` - привязать аккаунт по токену

#### Webhook
- `POST /api/telegram/webhook` - webhook для Telegram updates

#### Sending Messages
- `POST /api/telegram/send` - отправить сообщение (admin)
  - Поддерживает тестовую отправку
  - Рассылка по группам/ролям

#### Statistics
- `GET /api/telegram/stats` - статистика подключений (admin)

**Функции**: [[Telegram интеграция]], [[Система уведомлений]]

## 🔧 Служебные endpoints

### Profile
- `GET /api/profile` - получить профиль текущего пользователя
- `PUT /api/profile` - обновить профиль

### Health Check
- `GET /api/health` - проверка работоспособности API

### Admin Utilities (только для разработки)
- `POST /api/admin/reset-db` - сброс БД к демо-состоянию
- `GET /api/admin/reset-status` - статус последнего сброса
- `POST /api/seed` - заполнить БД тестовыми данными
- `POST /api/signup` - регистрация (если включена)

## 🔒 Защита и авторизация

### Middleware
**Файл**: `middleware.ts`  
**Документация**: [[Middleware аутентификации]]

Все API routes защищены через NextAuth middleware:
- Проверка сессии
- Проверка роли пользователя
- Перенаправление неавторизованных

### Role-based Access Control

| Endpoint | Admin | Lector | Mentor | Student |
|----------|-------|--------|--------|---------|
| Users CRUD | ✅ | ❌ | ❌ | ❌ |
| Groups CRUD | ✅ | ❌ | ❌ | ❌ |
| Subjects CRUD | ✅ | ❌ | ❌ | ❌ |
| Schedules CRUD | ✅ | ❌ | ❌ | ❌ |
| Homework Create | ✅ | ✅ (свои) | ❌ | ❌ |
| Homework Review | ✅ | ✅ (свои) | ❌ | ❌ |
| Homework Submit | ❌ | ❌ | ❌ | ✅ |
| Telegram Config | ✅ | ❌ | ❌ | ❌ |

**См. также**: [[Admin]], [[Student]], [[Lector]], [[Mentor]]

## 📊 Request/Response форматы

### Стандартный формат ответа
```typescript
{
  success: boolean
  data?: any
  error?: string
  message?: string
}
```

### Коды ответов
- `200` - Успешный запрос
- `201` - Ресурс создан
- `400` - Неверный запрос
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Не найдено
- `500` - Внутренняя ошибка

### Валидация
Используется **Zod** для валидации входных данных.  
**См.**: [[Form Validation паттерн]]

## 🧪 Тестирование API

### Integration тесты
**Папка**: `__tests__/integration/api/`

Примеры:
- `schedules.test.ts` - тесты Schedules API
- `homework.test.ts` - тесты Homework API
- `telegram.test.ts` - тесты Telegram API

**Документация**: [[Integration тесты]]

## 📚 Связанные ресурсы

- [[API Route паттерн]] - структура API endpoints
- [[Error Handling паттерн]] - обработка ошибок
- [[Middleware паттерн]] - защита роутов
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Совет**: Используйте Graph View с фильтром `#api` для визуализации всех API endpoints!

#moc #api #endpoints #reference

