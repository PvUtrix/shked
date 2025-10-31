# BotSettings (Модель данных)

> Настройки Telegram бота и LLM интеграции

## Описание

Модель `BotSettings` хранит конфигурацию Telegram бота системы: токены, URL-ы, настройки уведомлений и параметры работы.

**Функция**: [[Telegram интеграция]]  
**ADR**: [[ADR-004 Telegram интеграция]]

## Prisma Schema

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

  @@map("bot_settings")
}
```

## Поля модели

### API Keys и Tokens
- `telegramBotToken` - токен Telegram бота (получается от @BotFather)
- `openaiApiKey` - API ключ для GigaChat/LLM (опционально)
- `webhookUrl` - URL для webhook (например, `https://shked.example.com/api/telegram/webhook`)

### Активация
- `isActive` - бот активен и работает (по умолчанию `false`)
- `notificationsEnabled` - глобальное включение/выключение уведомлений (по умолчанию `true`)

### Настройки уведомлений
- `reminderMinutes` - за сколько минут до занятия отправлять напоминание (по умолчанию `30`)
- `dailySummaryTime` - время отправки дневных сводок в формате `HH:mm` (по умолчанию `"07:00"`)

### Timestamps
- `createdAt` - дата создания настроек
- `updatedAt` - дата последнего обновления

## Singleton модель

**Важно**: В системе должна быть только одна запись BotSettings.

```typescript
// Получить настройки (или создать дефолтные)
async function getBotSettings() {
  let settings = await prisma.botSettings.findFirst()
  
  if (!settings) {
    settings = await prisma.botSettings.create({
      data: {
        isActive: false,
        notificationsEnabled: true,
        reminderMinutes: 30,
        dailySummaryTime: '07:00'
      }
    })
  }
  
  return settings
}
```

## Примеры использования

### Получение настроек

```typescript
const settings = await prisma.botSettings.findFirst()

if (!settings) {
  throw new Error('Настройки бота не найдены')
}

console.log({
  botActive: settings.isActive,
  notificationsEnabled: settings.notificationsEnabled,
  reminderMinutes: settings.reminderMinutes
})
```

### Обновление токена бота

```typescript
await prisma.botSettings.update({
  where: { id: settingsId },
  data: {
    telegramBotToken: 'new-token-from-botfather',
    webhookUrl: 'https://shked.example.com/api/telegram/webhook',
    isActive: true
  }
})
```

### Настройка времени напоминаний

```typescript
// За 15 минут до занятия вместо 30
await prisma.botSettings.update({
  where: { id: settingsId },
  data: {
    reminderMinutes: 15
  }
})
```

### Изменение времени дневных сводок

```typescript
// Отправлять сводки в 8:00 вместо 7:00
await prisma.botSettings.update({
  where: { id: settingsId },
  data: {
    dailySummaryTime: '08:00'
  }
})
```

### Отключение бота

```typescript
await prisma.botSettings.update({
  where: { id: settingsId },
  data: {
    isActive: false
  }
})
```

### Глобальное отключение уведомлений

```typescript
// Отключить все уведомления (например, на каникулах)
await prisma.botSettings.update({
  where: { id: settingsId },
  data: {
    notificationsEnabled: false
  }
})
```

## Использование в коде

### Проверка перед отправкой уведомления

```typescript
// lib/telegram/notifications.ts
export async function sendNotification(userId: string, message: string) {
  // 1. Проверить глобальные настройки
  const settings = await prisma.botSettings.findFirst()
  
  if (!settings?.isActive || !settings.notificationsEnabled) {
    console.log('Уведомления отключены глобально')
    return
  }
  
  // 2. Проверить настройки пользователя
  const telegramUser = await prisma.telegramUser.findUnique({
    where: { userId }
  })
  
  if (!telegramUser?.notifications) {
    console.log('Уведомления отключены пользователем')
    return
  }
  
  // 3. Отправить уведомление
  await bot.sendMessage(telegramUser.chatId, {
    text: message
  })
}
```

### Настройка webhook при старте приложения

```typescript
// lib/telegram/init.ts
export async function initTelegramBot() {
  const settings = await prisma.botSettings.findFirst()
  
  if (!settings?.isActive || !settings.telegramBotToken) {
    console.log('Telegram бот не активен')
    return
  }
  
  // Установить webhook
  await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: settings.webhookUrl
    })
  })
  
  console.log('Telegram webhook установлен:', settings.webhookUrl)
}
```

### Получение времени напоминания

```typescript
// lib/cron/init.ts
async function checkScheduleReminders() {
  const settings = await prisma.botSettings.findFirst()
  const reminderMinutes = settings?.reminderMinutes ?? 30
  
  const now = new Date()
  const reminderTime = new Date(now.getTime() + reminderMinutes * 60000)
  
  const upcomingSchedules = await prisma.schedule.findMany({
    where: {
      date: {
        gte: now,
        lte: reminderTime
      }
    }
  })
  
  // Отправить напоминания...
}
```

## TypeScript типы

```typescript
// lib/types.ts
export interface BotSettings {
  id: string
  telegramBotToken?: string
  openaiApiKey?: string
  webhookUrl?: string
  isActive: boolean
  notificationsEnabled: boolean
  reminderMinutes: number
  dailySummaryTime: string
  createdAt: Date
  updatedAt: Date
}
```

## Валидация

### Zod схема

```typescript
import { z } from 'zod'

export const botSettingsSchema = z.object({
  telegramBotToken: z.string().optional(),
  openaiApiKey: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  isActive: z.boolean(),
  notificationsEnabled: z.boolean(),
  reminderMinutes: z.number().int().min(5).max(120), // От 5 до 120 минут
  dailySummaryTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Формат: HH:mm')
})
```

## API Endpoints

**Документация**: [[Telegram API]]

```typescript
// Получить настройки (admin only)
GET /api/telegram/config
Response: BotSettings

// Обновить настройки (admin only)
POST /api/telegram/config
Body: Partial<BotSettings>

// Тестовое уведомление (admin only)
POST /api/telegram/test
Body: { message: string }
```

## Admin UI

**Страница**: `/admin/settings`

```tsx
<Form>
  <Input 
    name="telegramBotToken" 
    label="Telegram Bot Token"
    type="password"
    placeholder="1234567890:ABCdef..."
  />
  
  <Input 
    name="webhookUrl" 
    label="Webhook URL"
    placeholder="https://shked.example.com/api/telegram/webhook"
  />
  
  <Switch 
    name="isActive" 
    label="Бот активен"
  />
  
  <Switch 
    name="notificationsEnabled" 
    label="Уведомления включены"
  />
  
  <Input 
    name="reminderMinutes" 
    label="Напоминать за (минут)"
    type="number"
    defaultValue={30}
  />
  
  <Input 
    name="dailySummaryTime" 
    label="Время дневных сводок"
    type="time"
    defaultValue="07:00"
  />
  
  <Button type="submit">Сохранить</Button>
  <Button onClick={testBot}>Тестировать бота</Button>
</Form>
```

## Безопасность

### Шифрование токенов

> **TODO**: В production нужно шифровать `telegramBotToken` и `openaiApiKey` в БД

```typescript
import { encrypt, decrypt } from '@/lib/crypto'

// При сохранении
await prisma.botSettings.update({
  where: { id },
  data: {
    telegramBotToken: encrypt(token)
  }
})

// При чтении
const settings = await prisma.botSettings.findFirst()
const token = settings.telegramBotToken 
  ? decrypt(settings.telegramBotToken) 
  : null
```

### Доступ только для admin

```typescript
// app/api/telegram/config/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (session?.user?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Доступ запрещен' },
      { status: 403 }
    )
  }
  
  // Обновить настройки...
}
```

## Environment Variables (альтернатива)

Вместо хранения в БД можно использовать переменные окружения:

```bash
# .env
TELEGRAM_BOT_TOKEN=1234567890:ABCdef...
TELEGRAM_WEBHOOK_URL=https://shked.example.com/api/telegram/webhook
GIGACHAT_API_KEY=your_key_here
BOT_ACTIVE=true
NOTIFICATIONS_ENABLED=true
REMINDER_MINUTES=30
DAILY_SUMMARY_TIME=07:00
```

**Плюсы**:
- ✅ Безопаснее (не в БД)
- ✅ Проще для Docker/Kubernetes

**Минусы**:
- ❌ Нельзя изменить через UI
- ❌ Требует рестарта приложения

## Миграции

### Пример миграции

```sql
-- CreateTable
CREATE TABLE "bot_settings" (
    "id" TEXT NOT NULL,
    "telegram_bot_token" TEXT,
    "openai_api_key" TEXT,
    "webhook_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "reminder_minutes" INTEGER NOT NULL DEFAULT 30,
    "daily_summary_time" TEXT NOT NULL DEFAULT '07:00',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_settings_pkey" PRIMARY KEY ("id")
);
```

## Связанные заметки

### Модели
- [[TelegramUser]] - пользователи бота

### Функции
- [[Telegram интеграция]] - детальное описание
- [[Управление расписанием]] - уведомления о расписании
- [[Система домашних заданий]] - уведомления о ДЗ

### API
- [[Telegram API]] - endpoints для работы

### ADR
- [[ADR-004 Telegram интеграция]] - архитектурное решение

### Роли
- [[Admin]] - управление настройками бота

## Файлы

- **Схема**: `prisma/schema.prisma`
- **Типы**: `lib/types.ts`
- **API**: `app/api/telegram/config/route.ts`
- **Admin страница**: `app/admin/settings/page.tsx`
- **Инициализация**: `lib/telegram/init.ts`

## Официальная документация

- [docs/features/TELEGRAM_BOT.md](../../docs/features/TELEGRAM_BOT.md)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

#model #prisma #telegram #bot #settings #singleton

