# Telegram API

> REST API для интеграции с Telegram ботом

## Обзор

Telegram API предоставляет endpoints для настройки бота, привязки аккаунтов, отправки сообщений и получения статистики.

**Модель**: [[TelegramUser]], [[BotSettings]]  
**Функция**: [[Telegram интеграция]]  
**ADR**: [[ADR-004 Telegram интеграция]]

## Base URL

```
/api/telegram
```

## Endpoints

### 🔐 GET /api/telegram/link

Получение токена для привязки Telegram аккаунта.

**Функция**: [[Telegram интеграция#Привязка аккаунта]]

#### Права доступа
- ✅ Все авторизованные пользователи

#### Response

```typescript
{
  token: string        // Токен действителен 15 минут
  expiresIn: number    // Время жизни в минутах
  instructions: string[]
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/telegram/link', {
  method: 'GET',
  credentials: 'include'
})

const { token, instructions } = await response.json()

// Пользователь отправляет боту: /link {token}
```

#### Статусы ответа

- `200` - Токен сгенерирован
- `401` - Не авторизован
- `500` - Внутренняя ошибка сервера

---

### 🔗 POST /api/telegram/link

Проверка токена привязки (вызывается для проверки валидности).

#### Права доступа
- ✅ Все авторизованные пользователи

#### Request Body

```typescript
{
  token: string
}
```

#### Response

```typescript
{
  message: string
  token: string
  expiresAt: Date
}

// Или если уже привязан:
{
  message: 'Telegram аккаунт уже привязан'
  telegramUser: {
    telegramId: string
    username?: string
    firstName?: string
    lastName?: string
    isActive: boolean
    notifications: boolean
    createdAt: Date
  }
}
```

---

### 📨 POST /api/telegram/webhook

Webhook для получения updates от Telegram Bot API.

**Функция**: [[Telegram интеграция#Webhook Handler]]

#### Права доступа
- 🌐 Публичный endpoint (вызывается Telegram серверами)

#### Request Body (от Telegram)

```typescript
{
  update_id: number
  message?: {
    message_id: number
    from: TelegramUser
    chat: TelegramChat
    text?: string
    // ... другие поля
  }
  callback_query?: {
    id: string
    from: TelegramUser
    data?: string
    // ... другие поля
  }
}
```

#### Response

```typescript
{
  ok: true
}
```

#### Обработка

1. Парсинг команд (`/start`, `/help`, `/schedule`, etc.)
2. Обработка естественного языка через LLM
3. Обработка callback queries (кнопки)
4. Отправка ответа через Telegram Bot API

---

### ⚙️ GET /api/telegram/config

Получение настроек бота (admin only).

#### Права доступа
- ✅ [[Admin]]

#### Response

```typescript
{
  id: string
  telegramBotToken?: string
  openaiApiKey?: string  // GigaChat API Key
  webhookUrl?: string
  isActive: boolean
  notificationsEnabled: boolean
  reminderMinutes: number  // За сколько минут напоминать
  dailySummaryTime: string // Время дневных сводок "HH:mm"
  createdAt: Date
  updatedAt: Date
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/telegram/config', {
  method: 'GET',
  credentials: 'include'
})

const settings = await response.json()
```

---

### ⚙️ POST /api/telegram/config

Обновление настроек бота (admin only).

#### Права доступа
- ✅ [[Admin]]

#### Request Body

```typescript
{
  telegramBotToken?: string
  openaiApiKey?: string
  webhookUrl?: string
  isActive?: boolean
  notificationsEnabled?: boolean
  reminderMinutes?: number     // От 5 до 120 минут
  dailySummaryTime?: string    // Формат "HH:mm"
}
```

#### Response

```typescript
{
  message: 'Настройки обновлены'
  settings: BotSettings
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/telegram/config', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    isActive: true,
    notificationsEnabled: true,
    reminderMinutes: 30,
    dailySummaryTime: '07:00'
  })
})
```

---

### 📊 GET /api/telegram/stats

Получение статистики подключений (admin only).

#### Права доступа
- ✅ [[Admin]]

#### Response

```typescript
{
  connected: number      // Количество подключенных пользователей
  total: number          // Всего пользователей в системе
  connectionRate: string // Процент подключений "75%"
  byRole: [
    {
      role: 'student' | 'teacher' | 'mentor' | 'admin'
      count: number
    }
  ]
}
```

#### Пример запроса

```typescript
const response = await fetch('/api/telegram/stats', {
  method: 'GET',
  credentials: 'include'
})

const stats = await response.json()
console.log(`Подключено ${stats.connectionRate} пользователей`)
```

---

### 📤 POST /api/telegram/send

Отправка сообщения пользователю или группе (admin only).

#### Права доступа
- ✅ [[Admin]]

#### Request Body

```typescript
{
  userId?: string      // ID пользователя в системе
  groupId?: string     // ID группы (рассылка всем студентам)
  message: string      // Текст сообщения (Markdown)
}
```

#### Response

```typescript
{
  success: boolean
  sent: number         // Количество отправленных сообщений
  failed: number       // Количество неудачных отправок
}
```

#### Пример запроса

```typescript
// Отправить сообщение одному пользователю
const response = await fetch('/api/telegram/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    userId: 'user-id',
    message: '📢 Важное объявление!\n\nЗавтра изменение расписания...'
  })
})

// Рассылка по группе
const response = await fetch('/api/telegram/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    groupId: 'group-id',
    message: '📢 Объявление для группы Б05-123...'
  })
})
```

---

## Модели данных

### TelegramUser

```prisma
model TelegramUser {
  id            String   @id @default(cuid())
  userId        String   @unique
  telegramId    String   @unique
  chatId        String
  username      String?
  firstName     String?
  lastName      String?
  isActive      Boolean  @default(true)
  notifications Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user          User     @relation(...)
}
```

### BotSettings

```prisma
model BotSettings {
  id                   String   @id @default(cuid())
  telegramBotToken     String?
  openaiApiKey         String?
  webhookUrl           String?
  isActive             Boolean  @default(false)
  notificationsEnabled Boolean  @default(true)
  reminderMinutes      Int      @default(30)
  dailySummaryTime     String   @default("07:00")
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

## Команды бота

**Функция**: [[Telegram интеграция#Команды бота]]

### Основные команды

- `/start` - Приветствие и инструкции
- `/help` - Список команд
- `/link [TOKEN]` - Привязка аккаунта
- `/schedule` - Расписание на сегодня
- `/tomorrow` - Расписание на завтра
- `/week` - Расписание на неделю
- `/homework` - Домашние задания
- `/homework_due` - Ближайшие дедлайны
- `/settings` - Настройки уведомлений

### Естественный язык

Бот понимает запросы на русском:
- "Когда моя следующая пара?"
- "Что у меня завтра?"
- "Покажи расписание на неделю"
- "Какие домашки у меня есть?"

## Автоматические уведомления

**Функция**: [[Telegram интеграция#Автоматические уведомления]]

### 1. Напоминания о занятиях
- **Когда**: За 30 минут до начала (настраивается)
- **Кому**: Студенты группы + Преподаватель
- **Cron**: Каждые 5 минут

### 2. Дневные сводки
- **Когда**: Ежедневно в 7:00 (настраивается)
- **Кому**: Все пользователи с Telegram
- **Cron**: `0 7 * * *`

### 3. Напоминания о дедлайнах ДЗ
- **Когда**: За 24ч и за 2ч до дедлайна
- **Кому**: Студенты с несданными работами
- **Cron**: Каждые 2 часа

### 4. Уведомления о проверке
- **Когда**: После проверки работы лектором
- **Кому**: Студент

## Безопасность

### Меры безопасности

1. ✅ Токены привязки с TTL 15 минут
2. ✅ Rate limiting на API routes
3. ✅ Проверка прав доступа (role-based)
4. ✅ Шифрование Bot Token в БД (TODO)
5. ✅ HTTPS обязателен для webhook

### Environment Variables

```bash
# Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ

# GigaChat (опционально)
GIGACHAT_API_KEY=your_gigachat_key

# Webhook
NEXTAUTH_URL=https://shked.example.com
```

## Связанные заметки

### Модели
- [[TelegramUser]] - привязка аккаунта
- [[BotSettings]] - настройки бота
- [[User]] - пользователи системы

### Функции
- [[Telegram интеграция]] - детальное описание
- [[Управление расписанием]] - уведомления о расписании
- [[Система домашних заданий]] - уведомления о ДЗ

### ADR
- [[ADR-004 Telegram интеграция]] - архитектурное решение

### Роли
- [[Admin]] - управление ботом
- [[Student]] - основной пользователь бота
- [[Teacher]] - уведомления о занятиях

## Файлы

- **API**: `app/api/telegram/**/*.ts`
- **Библиотека**: `lib/telegram/**/*.ts`
- **Cron**: `lib/cron/init.ts`
- **Схема**: `prisma/schema.prisma`

## Официальная документация

- [docs/features/TELEGRAM_BOT.md](../../docs/features/TELEGRAM_BOT.md)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [GigaChat API](https://developers.sber.ru/docs/ru/gigachat/overview)

---

#api #rest #telegram #bot #webhook #notifications #integration

