# User (Модель данных)

> Основная модель пользователя системы Шкед

## Описание

Модель `User` является центральной сущностью системы. Каждый пользователь имеет одну из четырех ролей и различные права доступа.

## Prisma Schema

```prisma
model User {
  id            String      @id @default(cuid())
  name          String?
  email         String      @unique
  emailVerified DateTime?
  image         String?
  password      String
  firstName     String?
  lastName      String?
  role          String      @default("student")
  groupId       String?
  canHelp       String?     // Чем могу быть полезен
  lookingFor    String?     // Что ищу
  mentorGroupIds Json?      // Группы для ментора (массив ID групп)
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  accounts      Account[]
  sessions      Session[]
  userGroups    UserGroup[]
  group         Group?      @relation(fields: [groupId], references: [id])
  telegramUser  TelegramUser?
  homeworkSubmissions HomeworkSubmission[]
  assignedSubjects Subject[] // Предметы для преподавателя
  homeworkComments HomeworkComment[] @relation("HomeworkCommentAuthor")

  @@map("users")
}
```

## Поля модели

### Основные поля
- `id` - уникальный идентификатор (CUID)
- `email` - email (уникальный, используется для входа)
- `password` - хешированный пароль (bcrypt)
- `name` - полное имя
- `firstName` / `lastName` - имя и фамилия отдельно
- `image` - URL аватара пользователя

### Роль и группа
- `role` - роль пользователя (`admin` | `student` | `lector` | `mentor`)
- `groupId` - ID группы (для студентов)
- `mentorGroupIds` - массив ID групп (для менторов)

### Дополнительные
- `canHelp` - чем пользователь может помочь (свободный текст)
- `lookingFor` - что пользователь ищет (свободный текст)
- `isActive` - активен ли аккаунт
- `emailVerified` - дата верификации email (для NextAuth)

### Timestamps
- `createdAt` - дата создания
- `updatedAt` - дата последнего обновления

## Связи (Relations)

### One-to-One
- [[TelegramUser]] - связь с Telegram аккаунтом
- [[Group]] - принадлежность к группе (для студентов)

### One-to-Many
- [[Account]][] - OAuth аккаунты (NextAuth)
- [[Session]][] - активные сессии
- [[UserGroup]][] - связи с группами + подгруппы
- [[HomeworkSubmission]][] - работы студента
- [[HomeworkComment]][] - комментарии к работам (для лекторов)
- [[Subject]][] - назначенные предметы (для лекторов)

## Роли пользователей

### Admin
**Заметка**: [[Admin]]  
**Права**: Полный доступ ко всем функциям системы

**Возможности**:
- ✅ CRUD пользователей, групп, предметов, расписания
- ✅ Изменение ролей пользователей
- ✅ Настройки Telegram бота
- ✅ Просмотр всей статистики

### Student
**Заметка**: [[Student]]  
**Права**: Просмотр расписания и сдача домашних заданий

**Возможности**:
- ✅ Просмотр персонального расписания (с учетом подгрупп)
- ✅ Сдача домашних заданий (MDX редактор)
- ✅ Просмотр оценок и feedback
- ✅ Telegram уведомления
- ❌ Создание контента

### Lector (Преподаватель)
**Заметка**: [[Lector]]  
**Права**: Управление своими предметами и домашними заданиями

**Возможности**:
- ✅ Создание ДЗ для своих предметов (MDX редактор)
- ✅ Просмотр и проверка работ студентов
- ✅ Выставление оценок и feedback (MDX)
- ✅ Inline комментарии к работам
- ✅ Просмотр расписания по своим предметам
- ❌ Управление группами и расписанием

### Mentor
**Заметка**: [[Mentor]]  
**Права**: Мониторинг назначенных групп

**Возможности**:
- ✅ Просмотр студентов своих групп
- ✅ Мониторинг выполнения ДЗ
- ✅ Просмотр работ студентов (без проверки)
- ❌ Создание ДЗ
- ❌ Оценивание работ

## API Endpoints

### Основные операции
**API**: [[Users API]]

- `GET /api/users` - список пользователей (admin only)
- `GET /api/users/[id]` - получить пользователя
- `POST /api/users` - создать пользователя (admin only)
- `PUT /api/users/[id]` - обновить пользователя
- `DELETE /api/users/[id]` - удалить пользователя (admin only)
- `PUT /api/users/[id]/role` - изменить роль (admin only)

### Профиль
- `GET /api/profile` - получить свой профиль
- `PUT /api/profile` - обновить свой профиль

## Компоненты

### Admin компоненты
- [[user-form.tsx]] - форма создания/редактирования пользователя
- [[admin-nav.tsx]] - навигация админа

### Auth компоненты
- [[login-form.tsx]] - форма входа
- [[logout-button.tsx]] - кнопка выхода

## TypeScript типы

### Основной тип
```typescript
// lib/types.ts
export type UserRole = 'admin' | 'student' | 'lector' | 'mentor'

export interface User {
  id: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  role: UserRole
  groupId?: string
  mentorGroupIds?: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### С relations
```typescript
export interface UserWithRelations extends User {
  group?: Group
  telegramUser?: TelegramUser
  homeworkSubmissions?: HomeworkSubmission[]
  assignedSubjects?: Subject[]
}
```

## Аутентификация

**Система**: [[NextAuth.js аутентификация]]  
**Конфигурация**: `lib/auth.ts`

### Credentials Provider
```typescript
CredentialsProvider({
  async authorize(credentials) {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email }
    })
    
    if (!user) return null
    
    const isValid = await bcrypt.compare(
      credentials.password,
      user.password
    )
    
    if (!isValid) return null
    
    return user
  }
})
```

### JWT Session
```typescript
session: {
  strategy: 'jwt'
},
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id
      token.role = user.role
    }
    return token
  },
  async session({ session, token }) {
    session.user.id = token.id
    session.user.role = token.role
    return session
  }
}
```

## Примеры использования

### Создание пользователя
```typescript
const hashedPassword = await bcrypt.hash(password, 10)

const user = await prisma.user.create({
  data: {
    email: 'student@mipt.ru',
    password: hashedPassword,
    name: 'Иван Иванов',
    firstName: 'Иван',
    lastName: 'Иванов',
    role: 'student',
    groupId: 'group-id'
  }
})
```

### Получение с relations
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    group: true,
    telegramUser: true,
    homeworkSubmissions: {
      include: {
        homework: {
          include: {
            subject: true
          }
        }
      }
    },
    assignedSubjects: true // Для лекторов
  }
})
```

### Обновление роли
```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    role: 'lector'
  }
})
```

### Назначение ментора к группам
```typescript
await prisma.user.update({
  where: { id: mentorId },
  data: {
    mentorGroupIds: ['group1-id', 'group2-id']
  }
})
```

## Валидация

### Zod схема
```typescript
import { z } from 'zod'

export const userSchema = z.object({
  email: z.string().email('Неверный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  name: z.string().min(1, 'Имя обязательно'),
  role: z.enum(['admin', 'student', 'lector', 'mentor']),
  groupId: z.string().optional()
})
```

## Безопасность

### Хеширование паролей
- ✅ Используется **bcrypt** с salt rounds = 10
- ✅ Пароли никогда не передаются в plain text
- ✅ При обновлении профиля пароль опционален

### Защита API
- ✅ Middleware проверяет аутентификацию
- ✅ Role-based access control в каждом endpoint
- ✅ Студенты видят только свой профиль
- ✅ Админы видят все профили

### Примеры защиты
```typescript
// middleware.ts
if (!token) {
  return NextResponse.redirect(new URL('/login', req.url))
}

// API route
if (session.user.role !== 'admin' && session.user.id !== userId) {
  return NextResponse.json(
    { error: 'Forbidden' },
    { status: 403 }
  )
}
```

## Файлы

- **Схема**: `prisma/schema.prisma`
- **Типы**: `lib/types.ts`
- **Auth конфигурация**: `lib/auth.ts`
- **API**: `app/api/users/route.ts`, `app/api/users/[id]/route.ts`
- **Компоненты**: `components/admin/user-form.tsx`

## Связанные заметки

### Модели
- [[Group]] - учебные группы
- [[UserGroup]] - связь с группами + подгруппы
- [[TelegramUser]] - Telegram интеграция
- [[HomeworkSubmission]] - работы студентов
- [[HomeworkComment]] - комментарии к работам
- [[Subject]] - предметы (для лекторов)

### Роли
- [[Admin]] - администраторы
- [[Student]] - студенты
- [[Lector]] - преподаватели
- [[Mentor]] - менторы

### API
- [[Users API]] - endpoints для работы с пользователями
- [[Auth API]] - NextAuth endpoints

### Архитектура
- [[NextAuth.js аутентификация]] - система аутентификации
- [[Middleware аутентификации]] - защита роутов

## Официальная документация

- [docs/features/USER_ROLES.md](../../docs/features/USER_ROLES.md)

---

#model #prisma #user #core #authentication

