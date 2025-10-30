# TelegramUser (Модель данных)

> Связь пользователя системы с Telegram аккаунтом

## Описание

Модель `TelegramUser` связывает пользователя системы ([[User]]) с его Telegram аккаунтом для уведомлений и интерактивного взаимодействия через Telegram бота.

**Функция**: [[Telegram интеграция]]  
**ADR**: [[ADR-004 Telegram интеграция]]

## Prisma Schema

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
  
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("telegram_users")
}
```

## Поля модели

### Связи
- `userId` - ID пользователя в системе ([[User]]) - уникальный (один пользователь = один Telegram)
- `user` - relation к User

### Telegram данные
- `telegramId` - ID пользователя в Telegram (уникальный)
- `chatId` - ID чата для отправки сообщений
- `username` - никнейм в Telegram (@username)
- `firstName` - имя в Telegram
- `lastName` - фамилия в Telegram

### Настройки
- `isActive` - аккаунт активен (по умолчанию `true`)
- `notifications` - включены уведомления (по умолчанию `true`)

### Timestamps
- `createdAt` - дата привязки аккаунта
- `updatedAt` - дата последнего обновления

## Связи (Relations)

### One-to-One
- [[User]] - пользователь системы (студент, лектор, администратор)

## Создание связи

### Процесс привязки

**Workflow**: [[Telegram интеграция#Привязка аккаунта]]

1. Пользователь в профиле нажимает "Получить токен"
2. Система генерирует токен с TTL 15 минут
3. Пользователь отправляет боту `/link TOKEN`
4. Бот проверяет токен и создает TelegramUser

### Код создания

```typescript
// app/api/telegram/link/route.ts
export async function POST(request: NextRequest) {
  const { token, telegramId, chatId, username, firstName, lastName } = await request.json()
  
  // Проверить токен в Redis
  const userId = await redis.get(`telegram-link:${token}`)
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Токен недействителен или истек' },
      { status: 400 }
    )
  }
  
  // Создать связь
  const telegramUser = await prisma.telegramUser.create({
    data: {
      userId,
      telegramId: telegramId.toString(),
      chatId: chatId.toString(),
      username,
      firstName,
      lastName,
      isActive: true,
      notifications: true
    }
  })
  
  // Удалить токен
  await redis.del(`telegram-link:${token}`)
  
  return NextResponse.json({ success: true, telegramUser })
}
```

## Примеры использования

### Получение Telegram данных пользователя

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    telegramUser: true
  }
})

if (user.telegramUser) {
  console.log('Telegram подключен:', user.telegramUser.username)
} else {
  console.log('Telegram не подключен')
}
```

### Проверка привязки при логине

```typescript
const user = await prisma.user.findUnique({
  where: { email },
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    telegramUser: {
      select: {
        username: true,
        isActive: true
      }
    }
  }
})

return {
  ...user,
  telegramConnected: !!user.telegramUser,
  telegramUsername: user.telegramUser?.username
}
```

### Отправка уведомления пользователю

```typescript
// lib/telegram/notifications.ts
export async function sendNotification(
  userId: string,
  message: string
) {
  const telegramUser = await prisma.telegramUser.findUnique({
    where: { userId }
  })
  
  if (!telegramUser) {
    console.log('Telegram не подключен для пользователя:', userId)
    return
  }
  
  if (!telegramUser.isActive || !telegramUser.notifications) {
    console.log('Уведомления отключены для пользователя:', userId)
    return
  }
  
  await bot.sendMessage(telegramUser.chatId, {
    text: message,
    parse_mode: 'Markdown'
  })
}
```

### Массовая рассылка для группы

```typescript
// Отправить уведомление всем студентам группы
const group = await prisma.group.findUnique({
  where: { id: groupId },
  include: {
    users: {
      where: { role: 'student' },
      include: { telegramUser: true }
    }
  }
})

for (const student of group.users) {
  if (student.telegramUser?.notifications) {
    await bot.sendMessage(student.telegramUser.chatId, {
      text: `📢 Объявление для группы ${group.name}:\n\n${message}`
    })
  }
}
```

### Получение пользователя по telegramId

```typescript
// В webhook handler
const telegramUser = await prisma.telegramUser.findUnique({
  where: { telegramId: update.message.from.id.toString() },
  include: {
    user: {
      include: {
        group: true
      }
    }
  }
})

if (!telegramUser) {
  await bot.sendMessage(chatId, {
    text: 'Аккаунт не привязан. Используй /link TOKEN'
  })
  return
}

// Теперь доступен user.role, user.group и т.д.
console.log('Пользователь:', telegramUser.user.name)
console.log('Роль:', telegramUser.user.role)
```

### Обновление настроек уведомлений

```typescript
// Команда /settings в боте
async function handleSettingsCommand(chatId: string) {
  const telegramUser = await prisma.telegramUser.findUnique({
    where: { chatId }
  })
  
  // Отправить inline keyboard
  await bot.sendMessage(chatId, {
    text: 'Настройки уведомлений:',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: telegramUser.notifications ? '🔔 Отключить' : '🔕 Включить',
            callback_data: 'toggle_notifications'
          }
        ]
      ]
    }
  })
}

// Callback query handler
async function handleToggleNotifications(chatId: string) {
  const telegramUser = await prisma.telegramUser.update({
    where: { chatId },
    data: {
      notifications: {
        set: !telegramUser.notifications
      }
    }
  })
  
  await bot.sendMessage(chatId, {
    text: telegramUser.notifications 
      ? '✅ Уведомления включены' 
      : '🔕 Уведомления отключены'
  })
}
```

### Деактивация пользователя

```typescript
// При блокировке пользователя в системе
await prisma.telegramUser.update({
  where: { userId },
  data: {
    isActive: false
  }
})
```

### Отвязка аккаунта

```typescript
// В профиле пользователя - кнопка "Отвязать Telegram"
await prisma.telegramUser.delete({
  where: { userId }
})
```

## Статистика

### Количество подключений

```typescript
const stats = await prisma.telegramUser.aggregate({
  _count: { id: true },
  where: { isActive: true }
})

const totalUsers = await prisma.user.count({
  where: { role: { in: ['student', 'teacher'] }}
})

console.log({
  connected: stats._count.id,
  total: totalUsers,
  connectionRate: ((stats._count.id / totalUsers) * 100).toFixed(1) + '%'
})
```

### Статистика по ролям

```typescript
const byRole = await prisma.telegramUser.groupBy({
  by: ['user.role'],
  _count: { id: true },
  where: { isActive: true }
})
```

### Пользователи без Telegram

```typescript
const usersWithoutTelegram = await prisma.user.findMany({
  where: {
    telegramUser: null,
    role: { in: ['student', 'teacher'] }
  },
  select: {
    id: true,
    name: true,
    email: true,
    role: true
  }
})
```

## TypeScript типы

```typescript
// lib/types.ts
export interface TelegramUser {
  id: string
  userId: string
  telegramId: string
  chatId: string
  username?: string
  firstName?: string
  lastName?: string
  isActive: boolean
  notifications: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TelegramUserWithUser extends TelegramUser {
  user: User
}
```

## API Endpoints

**Документация**: [[Telegram API]]

```typescript
// Получить токен для привязки
GET /api/telegram/link
Response: { token: "abc123..." }

// Привязать аккаунт (вызывается ботом)
POST /api/telegram/link
Body: {
  token: "abc123...",
  telegramId: "123456789",
  chatId: "-987654321",
  username: "ivan_ivanov",
  firstName: "Иван",
  lastName: "Иванов"
}

// Обновить настройки
PATCH /api/telegram/settings
Body: {
  notifications: true
}

// Отвязать аккаунт
DELETE /api/telegram/link

// Статистика (admin only)
GET /api/telegram/stats
Response: {
  connected: 45,
  total: 60,
  connectionRate: "75%"
}
```

## Безопасность

### Проверка принадлежности

```typescript
// Только владелец может изменять настройки
const session = await getServerSession()
const telegramUser = await prisma.telegramUser.findUnique({
  where: { id: telegramUserId }
})

if (telegramUser.userId !== session.user.id && session.user.role !== 'admin') {
  return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
}
```

### Валидация токена

```typescript
// Токен действует 15 минут
await redis.setex(`telegram-link:${token}`, 900, userId)
```

## Миграции

### Пример миграции

```sql
-- CreateTable
CREATE TABLE "telegram_users" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "telegram_id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "telegram_users_user_id_key" ON "telegram_users"("user_id");
CREATE UNIQUE INDEX "telegram_users_telegram_id_key" ON "telegram_users"("telegram_id");

ALTER TABLE "telegram_users" 
  ADD CONSTRAINT "telegram_users_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;
```

## Связанные заметки

### Модели
- [[User]] - пользователь системы
- [[BotSettings]] - настройки бота

### Функции
- [[Telegram интеграция]] - детальное описание

### API
- [[Telegram API]] - endpoints для работы

### ADR
- [[ADR-004 Telegram интеграция]] - архитектурное решение

### Роли
- [[Admin]] - управление ботом
- [[Student]] - получение уведомлений
- [[Teacher]] - получение уведомлений

## Файлы

- **Схема**: `prisma/schema.prisma`
- **Типы**: `lib/types.ts`
- **API**: `app/api/telegram/**/*.ts`
- **Библиотека**: `lib/telegram/**/*.ts`
- **Страница профиля**: `app/student/profile/page.tsx`, `app/teacher/profile/page.tsx`

## Официальная документация

- [docs/features/TELEGRAM_BOT.md](../../docs/features/TELEGRAM_BOT.md)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

#model #prisma #telegram #notifications #integration

