# ADR-004: Telegram интеграция с LLM поддержкой

**Статус**: ✅ Принято  
**Дата**: Февраль 2024  
**Авторы**: Павел Шершнёв  
**Связи**: [[Telegram интеграция]], [[Система уведомлений]], [[LLM обработка запросов]]

## Контекст и проблема

Студентам и преподавателям нужен удобный способ:
- Получать уведомления о занятиях и дедлайнах
- Быстро проверять расписание без входа в веб-приложение
- Задавать вопросы на естественном языке
- Получать дневные сводки и напоминания

Необходимо выбрать платформу для реализации и способ обработки естественного языка.

## Рассмотренные варианты

### Выбор платформы

#### 1. Telegram Bot ✅
**Плюсы**:
- ✅ Популярен в студенческой среде МФТИ
- ✅ Простой Bot API
- ✅ Webhook для real-time обработки
- ✅ Rich форматирование (Markdown, кнопки)
- ✅ Бесплатный
- ✅ Хорошая документация

**Минусы**:
- ⚠️ Нужен публичный HTTPS endpoint для webhook

#### 2. WhatsApp Business API
**Плюсы**:
- ✅ Широкая аудитория

**Минусы**:
- ❌ Платный (стоимость за сообщение)
- ❌ Сложная регистрация бизнеса
- ❌ Ограничения на исходящие сообщения

#### 3. VK Bots
**Плюсы**:
- ✅ Популярен в России

**Минусы**:
- ❌ Меньше студентов используют VK
- ❌ Сложнее API

### Выбор LLM для обработки запросов

#### 1. GigaChat (Сбер) ✅
**Плюсы**:
- ✅ Российская платформа (соответствие требованиям)
- ✅ Понимает русский язык нативно
- ✅ API совместим с OpenAI
- ✅ Доступ для образовательных проектов

**Минусы**:
- ⚠️ Меньше примеров и туториалов
- ⚠️ Возможны лимиты на бесплатном тарифе

#### 2. OpenAI GPT
**Плюсы**:
- ✅ Лучшее качество ответов
- ✅ Много примеров и библиотек

**Минусы**:
- ❌ Платный (значительные затраты)
- ❌ Требует VPN в России
- ❌ Проблемы с обработкой русского языка

#### 3. Yandex GPT
**Плюсы**:
- ✅ Российская платформа

**Минусы**:
- ❌ Закрытая beta
- ❌ Неясное ценообразование

## Решение

**Выбрана связка: Telegram Bot + GigaChat API**

### Обоснование

1. **Telegram**: 90%+ студентов МФТИ используют Telegram ежедневно

2. **GigaChat**: Оптимальный баланс качества, стоимости и соответствия требованиям

3. **Webhook vs Polling**: Webhook обеспечивает instant ответы

4. **Архитектура**:
   ```
   Студент → Telegram → Webhook → Next.js API → GigaChat → Ответ
                                    ↓
                                 Prisma DB (контекст)
   ```

## Архитектура интеграции

### Компоненты системы

```mermaid
graph TB
    A[Telegram User] -->|Сообщение| B[Telegram Bot API]
    B -->|Webhook POST| C[/api/telegram/webhook]
    C -->|Обработка| D[lib/telegram/commands.ts]
    D -->|Контекст| E[Prisma DB]
    D -->|Запрос| F[lib/telegram/llm.ts]
    F -->|API Call| G[GigaChat API]
    G -->|Ответ| F
    F -->|Форматирование| D
    D -->|sendMessage| B
    B -->|Уведомление| A
```

### Модели данных

#### TelegramUser
```prisma
model TelegramUser {
  id            String   @id @default(cuid())
  userId        String   @unique
  telegramId    String   @unique
  chatId        String
  username      String?
  notifications Boolean  @default(true)
  user          User     @relation(...)
}
```

#### BotSettings
```prisma
model BotSettings {
  id                   String   @id @default(cuid())
  telegramBotToken     String?
  openaiApiKey         String?
  isActive             Boolean  @default(false)
  reminderMinutes      Int      @default(30)
  dailySummaryTime     String   @default("07:00")
}
```

### Структура кода

```
lib/telegram/
├── bot.ts              # Telegram Bot client
├── llm.ts              # GigaChat интеграция
├── commands.ts         # Обработка команд
├── notifications.ts    # Система уведомлений
└── helpers.ts          # Вспомогательные функции

app/api/telegram/
├── webhook/route.ts    # Webhook handler
├── config/route.ts     # Настройки бота (admin)
├── link/route.ts       # Привязка аккаунтов
├── send/route.ts       # Отправка сообщений
└── stats/route.ts      # Статистика

lib/cron/
└── init.ts            # Cron задачи для уведомлений
```

## Функциональность

### Команды бота

**Базовые**:
- `/start` - приветствие и инструкции
- `/help` - список команд
- `/link [token]` - привязка аккаунта

**Расписание**:
- `/schedule` - расписание на сегодня
- `/tomorrow` - расписание на завтра
- `/week` - расписание на неделю

**Домашние задания**:
- `/homework` - мои домашние задания
- `/homework_due` - ближайшие дедлайны

**Настройки**:
- `/settings` - настройки уведомлений

### Естественный язык (через GigaChat)

**Примеры запросов**:
- "Когда моя следующая пара?"
- "Что у меня завтра?"
- "Покажи расписание на неделю"
- "Какие домашки у меня есть?"
- "Когда сдавать ДЗ по математике?"

### Автоматические уведомления (Cron)

**1. Напоминания о занятиях** (каждые 5 минут)
- За 30 минут до начала пары
- Отправляется студентам и преподавателям

**2. Дневные сводки** (ежедневно в 7:00)
- Расписание на день
- Дедлайны сегодня

**3. Напоминания о ДЗ** (каждые 2 часа)
- За 24 часа до дедлайна
- За 2 часа до дедлайна

**4. Еженедельные сводки** (понедельник, 8:00)
- Расписание на неделю
- Все дедлайны недели

## Привязка аккаунтов

### Workflow
1. Студент заходит в профиль веб-приложения
2. Нажимает "Получить токен привязки"
3. Система генерирует временный токен (TTL 15 минут)
4. Студент открывает Telegram бота
5. Отправляет `/link TOKEN`
6. Бот проверяет токен и привязывает аккаунт
7. Студент получает подтверждение

### Безопасность
- ✅ Токены одноразовые
- ✅ TTL 15 минут
- ✅ Привязка только при авторизации в веб-приложении

## GigaChat интеграция

### System Prompt

Контекст для LLM включает:
- Роль пользователя (студент/админ/лектор)
- Группа и подгруппы студента
- Текущая дата и время
- Ближайшее занятие (если есть)
- Список доступных команд

### Пример system prompt
```
Ты - помощник системы расписания МФТИ "ШКЕД".
Пользователь: Иван Иванов (студент группы Б05-123)
Сейчас: 20 октября 2025, 10:30
Следующее занятие: Математика в 12:00 (ауд. 123)

Отвечай кратко и по делу. Используй команды бота для действий.
```

### Обработка запроса
```typescript
async function processWithLLM(message: string, context: UserContext) {
  const response = await gigachat.chat({
    model: 'GigaChat',
    messages: [
      { role: 'system', content: buildSystemPrompt(context) },
      { role: 'user', content: message }
    ]
  })
  
  return response.choices[0].message.content
}
```

## Последствия

### Положительные

- ✅ **Удобство**: Студенты могут проверять расписание не заходя в веб-приложение
- ✅ **Своевременность**: Автоматические напоминания о парах и дедлайнах
- ✅ **Естественный интерфейс**: LLM понимает вопросы на русском
- ✅ **Engagement**: Повышает использование платформы
- ✅ **Экономия времени**: Быстрые ответы без поиска в веб-интерфейсе

### Негативные

- ⚠️ **Зависимость от внешних API**: Telegram и GigaChat
- ⚠️ **Стоимость**: Возможные расходы на GigaChat (при масштабировании)
- ⚠️ **Сложность**: Дополнительная инфраструктура (webhook, cron)
- ⚠️ **Поддержка**: Нужно отслеживать и обрабатывать ошибки API

### Смягчения

1. **Fallback**: При недоступности GigaChat используются статические ответы
2. **Rate limiting**: Ограничение запросов к LLM
3. **Кеширование**: Часто запрашиваемые данные кешируются
4. **Мониторинг**: Логирование всех webhook запросов и ошибок

## Влияние на другие компоненты

### Затронутые области
- [[API Routes]] - новые endpoints для Telegram
- [[Система уведомлений]] - cron задачи
- [[База данных]] - модели TelegramUser и BotSettings
- [[Admin панель]] - настройки бота
- [[Deployment]] - webhook URL, HTTPS требование

### Связанные решения
- [[ADR-001 Next.js 14 App Router]] - API routes для webhook
- [[ADR-002 Prisma ORM]] - модели для Telegram
- [[ADR-005 MDX для домашних заданий]] - форматирование в Telegram

## Примеры кода

### Webhook handler
```typescript
// app/api/telegram/webhook/route.ts
export async function POST(request: NextRequest) {
  const update = await request.json()
  
  if (update.message) {
    await handleMessage(update.message)
  }
  
  return NextResponse.json({ ok: true })
}
```

### Отправка уведомления
```typescript
// lib/telegram/notifications.ts
export async function sendClassReminder(userId: string, schedule: Schedule) {
  const telegramUser = await prisma.telegramUser.findUnique({
    where: { userId }
  })
  
  if (!telegramUser?.notifications) return
  
  await bot.sendMessage(telegramUser.chatId, 
    `📚 Напоминание: через 30 минут ${schedule.subject.name} в ${schedule.location}`
  )
}
```

### LLM запрос
```typescript
// lib/telegram/llm.ts
export async function askGigaChat(question: string, context: Context) {
  const response = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'GigaChat',
      messages: [
        { role: 'system', content: buildPrompt(context) },
        { role: 'user', content: question }
      ]
    })
  })
  
  return response.json()
}
```

## Мониторинг и метрики

### Отслеживаемые метрики
- Количество активных пользователей
- Количество сообщений в день
- Успешность доставки уведомлений
- Время ответа бота
- Использование LLM (запросы/день)
- Популярные команды

### Админ панель
Статистика доступна в `/admin/settings`:
- Процент подключенных пользователей
- График активности за неделю
- Статус webhook
- Настройки уведомлений

## Ссылки

### Документация
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [GigaChat API](https://developers.sber.ru/docs/ru/gigachat/overview)
- Официальная: [docs/features/TELEGRAM_BOT.md](../../docs/features/TELEGRAM_BOT.md)

### Внутренние ресурсы
- [[Telegram интеграция]]
- [[Telegram API]]
- [[Система уведомлений]]
- [[LLM обработка запросов]]
- [[TelegramUser]] модель
- [[BotSettings]] модель

## История обновлений

- **2024-02**: Первоначальное решение
- **2024-03**: Добавлена LLM интеграция с GigaChat
- **2024-04**: Внедрены автоматические уведомления
- **2024-10**: Оптимизация cron задач

---

#adr #architecture #telegram #llm #gigachat #decision #integration

