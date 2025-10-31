# Telegram интеграция

> Интеграция Telegram бота с LLM для уведомлений и интерактивного взаимодействия

## Обзор

Telegram интеграция - важная часть системы Шкед, обеспечивающая студентам и преподавателям удобный доступ к расписанию и уведомлениям через Telegram бота с поддержкой естественного языка через GigaChat API.

**ADR**: [[ADR-004 Telegram интеграция]]

## Возможности

### Для студентов [[Student]]
- 📅 Просмотр расписания (сегодня/завтра/неделя)
- 📝 Просмотр домашних заданий и дедлайнов
- 🔔 Автоматические уведомления о занятиях
- ⏰ Напоминания о дедлайнах ДЗ
- 💬 Запросы на естественном языке
- 📊 Дневные и еженедельные сводки

### Для преподавателей [[Teacher]]
- 📅 Расписание своих занятий
- 🔔 Уведомления о занятиях
- 📬 Уведомления о сданных работах

### Для администраторов [[Admin]]
- 📊 Статистика подключений
- 📢 Рассылка сообщений
- ⚙️ Управление настройками бота
- 🧪 Тестирование бота

## Архитектура

```mermaid
graph TB
    A[Telegram User] -->|Сообщение| B[Telegram Bot API]
    B -->|Webhook POST| C[/api/telegram/webhook]
    C -->|Парсинг команды| D{Тип команды?}
    D -->|/start, /help| E[Статические ответы]
    D -->|/schedule, /homework| F[Запрос к БД]
    D -->|Текст| G[LLM обработка]
    F -->|Данные| H[Форматирование]
    G -->|Через GigaChat| I[Умный ответ]
    H -->|Ответ| J[sendMessage]
    I -->|Ответ| J
    J -->|API Call| B
    B -->|Уведомление| A
    
    K[Cron Jobs] -->|Каждые 5 мин| L[Проверка напоминаний]
    L -->|За 30 мин до пары| J
    
    M[Cron Jobs] -->|Ежедневно 7:00| N[Дневные сводки]
    N -->|Расписание на день| J
```

## Модели данных

### TelegramUser [[TelegramUser]]
Связь между User системы и Telegram аккаунтом

```prisma
model TelegramUser {
  id            String   @id
  userId        String   @unique
  telegramId    String   @unique
  chatId        String
  username      String?
  firstName     String?
  lastName      String?
  isActive      Boolean  @default(true)
  notifications Boolean  @default(true)
  createdAt     DateTime
  user          User     @relation(...)
}
```

### BotSettings [[BotSettings]]
Настройки Telegram бота

```prisma
model BotSettings {
  id                   String   @id
  telegramBotToken     String?
  openaiApiKey         String?  // GigaChat API Key
  webhookUrl           String?
  isActive             Boolean  @default(false)
  notificationsEnabled Boolean  @default(true)
  reminderMinutes      Int      @default(30)
  dailySummaryTime     String   @default("07:00")
}
```

## Компоненты системы

### 1. Webhook Handler
**Файл**: `app/api/telegram/webhook/route.ts`

Принимает updates от Telegram Bot API:
- Текстовые сообщения
- Команды (/start, /schedule, etc.)
- Callback queries (кнопки)

```typescript
export async function POST(request: NextRequest) {
  const update = await request.json()
  
  if (update.message) {
    await handleMessage(update.message)
  } else if (update.callback_query) {
    await handleCallbackQuery(update.callback_query)
  }
  
  return NextResponse.json({ ok: true })
}
```

### 2. Commands Handler
**Файл**: `lib/telegram/commands.ts`

Обрабатывает команды бота:

```typescript
async function routeCommand(command: string, chatId: string) {
  switch (command) {
    case '/start':
      return handleStart(chatId)
    case '/schedule':
      return handleSchedule(chatId)
    case '/homework':
      return handleHomework(chatId)
    case '/link':
      return handleLink(chatId)
    // ... другие команды
  }
}
```

### 3. LLM Integration
**Файл**: `lib/telegram/llm.ts`

Обработка естественного языка через GigaChat:

```typescript
async function processWithLLM(message: string, context: UserContext) {
  const systemPrompt = buildSystemPrompt(context)
  
  const response = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'GigaChat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    })
  })
  
  return response.json()
}
```

### 4. Notifications System
**Файл**: `lib/telegram/notifications.ts`

Отправка уведомлений:

```typescript
// Напоминание о занятии
export async function sendScheduleReminder(
  userId: string,
  schedule: Schedule
) {
  const telegramUser = await prisma.telegramUser.findUnique({
    where: { userId }
  })
  
  if (!telegramUser?.notifications) return
  
  await bot.sendMessage(telegramUser.chatId, {
    text: `📚 Через 30 минут: ${schedule.subject.name}
📍 ${schedule.location}
🕐 ${schedule.startTime}-${schedule.endTime}`,
    parse_mode: 'Markdown'
  })
}
```

### 5. Cron Jobs
**Файл**: `lib/cron/init.ts`

Автоматические задачи:

```typescript
// Каждые 5 минут - проверка напоминаний
cron.schedule('*/5 * * * *', async () => {
  await checkScheduleReminders()
})

// Ежедневно в 7:00 - дневные сводки
cron.schedule('0 7 * * *', async () => {
  await sendDailySummaries()
})

// Каждые 2 часа - напоминания о ДЗ
cron.schedule('0 */2 * * *', async () => {
  await checkHomeworkDeadlines()
})
```

## Команды бота

### Основные команды

#### /start
Приветствие и инструкции по использованию

```
👋 Привет! Я бот системы ШКЕД.

Для работы со мной привяжи свой аккаунт:
1. Зайди в профиль на сайте
2. Получи токен привязки
3. Отправь мне /link ТВОЙ_ТОКЕН

После привязки тебе будут доступны:
📅 Расписание
📝 Домашние задания
🔔 Уведомления
```

#### /help
Список всех доступных команд

```
📚 Доступные команды:

Расписание:
/schedule - На сегодня
/tomorrow - На завтра
/week - На неделю

Домашние задания:
/homework - Мои задания
/homework_due - Ближайшие дедлайны

Настройки:
/settings - Настройки уведомлений
/link - Привязать аккаунт

Или просто напиши вопрос, я пойму! 😊
```

#### /link [token]
Привязка аккаунта к Telegram

```
Для привязки:
1. Получи токен на сайте (Профиль → Telegram)
2. Отправь: /link ТВОЙ_ТОКЕН

Токен действителен 15 минут
```

#### /schedule
Расписание на сегодня

```
📅 Расписание на сегодня (04.11.2024):

🕐 10:00-11:30 | Математический анализ
📍 Ауд. 123 | Лекция

🕐 12:00-13:30 | Алгоритмы
📍 Ауд. 456 | Семинар (подгруппа 2)

🕐 14:00-15:30 | Физика
📍 Ауд. 789 | Лабораторная
```

#### /homework
Домашние задания

```
📝 Домашние задания:

❗ Алгоритмы - Лабораторная №1
   Дедлайн: 05.11.2024 23:59
   Статус: Не сдано
   
✅ Математика - ДЗ №3
   Дедлайн: 01.11.2024 23:59
   Статус: Проверено
   Оценка: 9/10
```

### Естественный язык

Бот понимает запросы на русском языке:

**Примеры**:
- "Когда моя следующая пара?"
- "Что у меня завтра?"
- "Покажи расписание на неделю"
- "Какие домашки у меня есть?"
- "Когда сдавать ДЗ по математике?"
- "Где занятие по физике?"

## Привязка аккаунта

### Workflow

```mermaid
graph LR
    A[Студент в профиле] --> B[Нажимает "Получить токен"]
    B --> C[Система генерирует токен TTL 15 мин]
    C --> D[Студент копирует токен]
    D --> E[Открывает Telegram бота]
    E --> F[Отправляет /link TOKEN]
    F --> G[Бот проверяет токен]
    G --> H{Токен валиден?}
    H -->|Да| I[Создает TelegramUser]
    H -->|Нет| J[Ошибка: токен истек]
    I --> K[Отправляет подтверждение]
```

### Генерация токена

**Страница**: `/student/profile`, `/teacher/profile`  
**API**: `GET /api/telegram/link`

```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  // Генерировать случайный токен
  const token = crypto.randomBytes(32).toString('hex')
  
  // Сохранить в Redis/БД с TTL 15 минут
  await redis.setex(`telegram-link:${token}`, 900, session.user.id)
  
  return NextResponse.json({ token })
}
```

### Привязка через бота

**Команда**: `/link TOKEN`  
**API**: `POST /api/telegram/link`

```typescript
async function handleLinkCommand(chatId: string, token: string) {
  // Проверить токен
  const userId = await redis.get(`telegram-link:${token}`)
  
  if (!userId) {
    return bot.sendMessage(chatId, {
      text: '❌ Токен недействителен или истек'
    })
  }
  
  // Создать связь
  await prisma.telegramUser.create({
    data: {
      userId,
      telegramId: update.message.from.id.toString(),
      chatId: chatId.toString(),
      username: update.message.from.username,
      firstName: update.message.from.first_name
    }
  })
  
  // Удалить токен
  await redis.del(`telegram-link:${token}`)
  
  return bot.sendMessage(chatId, {
    text: '✅ Аккаунт успешно привязан!\n\nТеперь тебе доступны все функции бота.'
  })
}
```

## Автоматические уведомления

### 1. Напоминания о занятиях
**Время**: За 30 минут до начала  
**Кому**: Студенты группы + Лектор  
**Cron**: Каждые 5 минут

```typescript
async function checkScheduleReminders() {
  const now = new Date()
  const in30Minutes = new Date(now.getTime() + 30 * 60000)
  
  const upcomingSchedules = await prisma.schedule.findMany({
    where: {
      date: { gte: now, lte: in30Minutes },
      isActive: true
    },
    include: {
      subject: { include: { teacher: { include: { telegramUser: true }}}},
      group: { include: { users: { include: { telegramUser: true }}}}
    }
  })
  
  for (const schedule of upcomingSchedules) {
    // Уведомить студентов
    for (const student of schedule.group.users) {
      await sendScheduleReminder(student.id, schedule)
    }
    
    // Уведомить лектора
    await sendScheduleReminder(schedule.subject.teacher.id, schedule)
  }
}
```

### 2. Дневные сводки
**Время**: Ежедневно в 7:00  
**Кому**: Все пользователи с Telegram  
**Cron**: `0 7 * * *`

```typescript
async function sendDailySummaries() {
  const users = await prisma.user.findMany({
    where: {
      telegramUser: { notifications: true }
    },
    include: { telegramUser: true, group: true }
  })
  
  for (const user of users) {
    const todaySchedule = await getStudentSchedule(user.id, ...)
    
    if (todaySchedule.length > 0) {
      const message = `🌅 Доброе утро!\n\n📅 Расписание на сегодня:\n\n` +
        todaySchedule.map(s => 
          `🕐 ${s.startTime}-${s.endTime} | ${s.subject.name}\n` +
          `📍 ${s.location}`
        ).join('\n\n')
      
      await bot.sendMessage(user.telegramUser.chatId, { text: message })
    }
  }
}
```

### 3. Напоминания о дедлайнах ДЗ
**Время**: За 24ч и за 2ч до дедлайна  
**Кому**: Студенты  
**Cron**: Каждые 2 часа

```typescript
async function checkHomeworkDeadlines() {
  const now = new Date()
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60000)
  const in2Hours = new Date(now.getTime() + 2 * 60 * 60000)
  
  // Найти ДЗ с дедлайном в ближайшие 24 часа
  const urgentHomework = await prisma.homework.findMany({
    where: {
      deadline: { gte: now, lte: in24Hours },
      isActive: true
    },
    include: {
      submissions: {
        where: { status: 'NOT_SUBMITTED' },
        include: { user: { include: { telegramUser: true }}}
      }
    }
  })
  
  for (const hw of urgentHomework) {
    for (const submission of hw.submissions) {
      const timeLeft = hw.deadline.getTime() - now.getTime()
      const hoursLeft = Math.floor(timeLeft / (60 * 60000))
      
      await bot.sendMessage(submission.user.telegramUser.chatId, {
        text: `⏰ Напоминание!\n\n` +
              `📝 ${hw.title}\n` +
              `⏳ Осталось: ${hoursLeft} часов\n` +
              `📅 Дедлайн: ${format(hw.deadline, 'dd.MM.yyyy HH:mm')}`
      })
    }
  }
}
```

### 4. Уведомления о проверке работ
**Событие**: После проверки работы лектором  
**Кому**: Студент

```typescript
// В API route проверки работы
await prisma.homeworkSubmission.update({
  where: { id: submissionId },
  data: { status: 'REVIEWED', grade, feedback }
})

// Отправить уведомление
const telegramUser = await prisma.telegramUser.findUnique({
  where: { userId: submission.userId }
})

if (telegramUser?.notifications) {
  await bot.sendMessage(telegramUser.chatId, {
    text: `✅ Работа проверена!\n\n` +
          `📝 ${homework.title}\n` +
          `⭐ Оценка: ${grade}/10\n\n` +
          `Посмотреть feedback можно в профиле`
  })
}
```

## API Endpoints

**Документация**: [[Telegram API]]

```typescript
// Настройки бота (admin only)
GET /api/telegram/config
POST /api/telegram/config

// Привязка аккаунта
GET /api/telegram/link - получить токен
POST /api/telegram/link - привязать по токену

// Webhook
POST /api/telegram/webhook - получение updates от Telegram

// Отправка сообщений (admin only)
POST /api/telegram/send

// Статистика (admin only)
GET /api/telegram/stats
```

## Статистика

### Для админа

```typescript
const stats = await prisma.telegramUser.aggregate({
  _count: { id: true },
  where: { isActive: true }
})

const totalUsers = await prisma.user.count()

console.log({
  connectedUsers: stats._count.id,
  totalUsers,
  connectionRate: (stats._count.id / totalUsers) * 100
})
```

## Безопасность

### Меры безопасности

1. ✅ **Проверка подписи Telegram webhook** (если настроен secret token)
2. ✅ **Токены привязки с TTL** (15 минут)
3. ✅ **Rate limiting** на API routes
4. ✅ **Санитизация пользовательского ввода**
5. ✅ **Проверка прав доступа** (role-based)
6. ✅ **Шифрование Bot Token** в БД
7. ✅ **HTTPS обязателен** для webhook

### Environment Variables

```bash
# Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ

# GigaChat (опционально, можно в БД)
GIGACHAT_API_KEY=your_gigachat_key

# Webhook
NEXTAUTH_URL=https://shked.example.com
```

## Troubleshooting

### Бот не отвечает
- Проверьте webhook URL доступен
- Убедитесь что Bot Token правильный
- Проверьте логи `/api/telegram/webhook`

### Не работает привязка
- Токен действителен только 15 минут
- Пользователь должен быть авторизован
- Проверьте Redis/БД для хранения токенов

### Не приходят уведомления
- Проверьте что notifications = true
- Убедитесь что бот активен (isActive)
- Проверьте cron задачи запущены

## Связанные заметки

### Модели
- [[TelegramUser]] - связь с Telegram
- [[BotSettings]] - настройки бота
- [[User]] - пользователи системы
- [[Schedule]] - расписание для уведомлений
- [[Homework]] - ДЗ для уведомлений

### Функции
- [[Управление расписанием]] - расписание в боте
- [[Система домашних заданий]] - ДЗ в боте

### API
- [[Telegram API]] - детальная документация

### ADR
- [[ADR-004 Telegram интеграция]] - архитектурное решение

### Роли
- [[Admin]] - управление ботом
- [[Student]] - основной пользователь бота
- [[Teacher]] - уведомления о занятиях

## Файлы

- **Модели**: `prisma/schema.prisma`
- **API**: `app/api/telegram/**/*.ts`
- **Библиотека**: `lib/telegram/**/*.ts`
- **Cron**: `lib/cron/init.ts`
- **Настройки**: `app/admin/settings/page.tsx`

## Официальная документация

- [docs/features/TELEGRAM_BOT.md](../../docs/features/TELEGRAM_BOT.md)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [GigaChat API](https://developers.sber.ru/docs/ru/gigachat/overview)

---

#function #telegram #bot #llm #notifications #integration

