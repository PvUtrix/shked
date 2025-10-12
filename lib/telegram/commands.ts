import { processUserQuery } from './llm'
import { getSchedule, getNextClass } from './llm'
import { sendMessage } from './bot'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export interface CommandHandler {
  (userId: string, chatId: number, args?: string[]): Promise<string>
}

/**
 * Генерировать токен для привязки аккаунта
 */
export function generateLinkToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Сохранить токен привязки для пользователя
 */
export async function saveLinkToken(userId: string, token: string): Promise<void> {
  // Токен действителен 15 минут
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
  
  await prisma.verificationToken.upsert({
    where: {
      identifier_token: {
        identifier: `telegram_link_${userId}`,
        token: token
      }
    },
    update: {
      expires: expiresAt
    },
    create: {
      identifier: `telegram_link_${userId}`,
      token: token,
      expires: expiresAt
    }
  })
}

/**
 * Найти пользователя по токену привязки
 */
export async function findUserByLinkToken(token: string): Promise<string | null> {
  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: {
        startsWith: 'telegram_link_'
      },
      token: token,
      expires: {
        gt: new Date()
      }
    }
  })

  if (!verificationToken) {
    return null
  }

  // Извлекаем userId из identifier
  const userId = verificationToken.identifier.replace('telegram_link_', '')
  return userId
}

/**
 * Привязать Telegram аккаунт к пользователю
 */
export async function linkTelegramAccount(
  userId: string,
  telegramId: string,
  chatId: string,
  username?: string,
  firstName?: string,
  lastName?: string
): Promise<boolean> {
  try {
    await prisma.telegramUser.upsert({
      where: { userId },
      update: {
        telegramId,
        chatId,
        username,
        firstName,
        lastName,
        isActive: true,
        notifications: true
      },
      create: {
        userId,
        telegramId,
        chatId,
        username,
        firstName,
        lastName,
        isActive: true,
        notifications: true
      }
    })

    // Удаляем использованный токен
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `telegram_link_${userId}`,
        token: {
          not: undefined
        }
      }
    })

    return true
  } catch (error) {
    console.error('Ошибка при привязке Telegram аккаунта:', error)
    return false
  }
}

/**
 * Получить пользователя по Telegram ID
 */
export async function getUserByTelegramId(telegramId: string) {
  return await prisma.telegramUser.findUnique({
    where: { telegramId },
    include: {
      user: {
        include: {
          group: true
        }
      }
    }
  })
}

/**
 * Команда /start
 */
export async function handleStart(userId: string, chatId: number): Promise<string> {
  const telegramUser = await getUserByTelegramId(userId)
  
  if (telegramUser) {
    return `Привет, ${telegramUser.user.firstName}! 👋

Вы уже подключены к системе ШКЕД.
Используйте /help для просмотра доступных команд.`
  }

  return `Добро пожаловать в ШКЕД! 🎓

Для подключения вашего Telegram аккаунта к системе:
1. Войдите в веб-приложение ШКЕД
2. Перейдите в профиль
3. Получите токен привязки
4. Отправьте команду /link [токен]

Используйте /help для просмотра всех команд.`
}

/**
 * Команда /link
 */
export async function handleLink(userId: string, chatId: number, args?: string[]): Promise<string> {
  if (!args || args.length === 0) {
    return `Для привязки аккаунта используйте:
/link [токен]

Получить токен можно в веб-приложении ШКЕД в разделе профиля.`
  }

  const token = args[0]
  const webUserId = await findUserByLinkToken(token)
  
  if (!webUserId) {
    return `❌ Неверный или истекший токен привязки.
Пожалуйста, получите новый токен в веб-приложении ШКЕД.`
  }

  // Получаем информацию о пользователе из Telegram
  const telegramUser = await getUserByTelegramId(userId)
  if (telegramUser) {
    return `✅ Ваш аккаунт уже привязан к системе ШКЕД.`
  }

  // Привязываем аккаунт
  const success = await linkTelegramAccount(
    webUserId,
    userId,
    chatId.toString(),
    undefined, // username будет получен из webhook
    undefined, // firstName будет получен из webhook
    undefined  // lastName будет получен из webhook
  )

  if (success) {
    return `✅ Аккаунт успешно привязан к системе ШКЕД!
Теперь вы можете получать уведомления о расписании.

Используйте /help для просмотра доступных команд.`
  } else {
    return `❌ Ошибка при привязке аккаунта. Попробуйте позже.`
  }
}

/**
 * Команда /schedule
 */
export async function handleSchedule(userId: string, chatId: number): Promise<string> {
  const telegramUser = await getUserByTelegramId(userId)
  
  if (!telegramUser) {
    return `❌ Ваш аккаунт не привязан к системе ШКЕД.
Используйте /link для привязки аккаунта.`
  }

  const schedules = await getSchedule(telegramUser.user.id)
  
  if (schedules.length === 0) {
    return `📅 На сегодня занятий нет.`
  }

  let message = `📅 *Расписание на сегодня:*\n\n`
  
  schedules.forEach((schedule, index) => {
    message += `${index + 1}. *${schedule.subject.name}*\n`
    message += `   ⏰ ${schedule.startTime} - ${schedule.endTime}\n`
    if (schedule.location) {
      message += `   📍 ${schedule.location}\n`
    }
    if (schedule.subject.instructor) {
      message += `   👨‍🏫 ${schedule.subject.instructor}\n`
    }
    if (schedule.eventType) {
      message += `   📚 ${schedule.eventType}\n`
    }
    message += `\n`
  })

  return message
}

/**
 * Команда /tomorrow
 */
export async function handleTomorrow(userId: string, chatId: number): Promise<string> {
  const telegramUser = await getUserByTelegramId(userId)
  
  if (!telegramUser) {
    return `❌ Ваш аккаунт не привязан к системе ШКЕД.
Используйте /link для привязки аккаунта.`
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const schedules = await getSchedule(telegramUser.user.id, tomorrow)
  
  if (schedules.length === 0) {
    return `📅 На завтра занятий нет.`
  }

  let message = `📅 *Расписание на завтра:*\n\n`
  
  schedules.forEach((schedule, index) => {
    message += `${index + 1}. *${schedule.subject.name}*\n`
    message += `   ⏰ ${schedule.startTime} - ${schedule.endTime}\n`
    if (schedule.location) {
      message += `   📍 ${schedule.location}\n`
    }
    if (schedule.subject.instructor) {
      message += `   👨‍🏫 ${schedule.subject.instructor}\n`
    }
    if (schedule.eventType) {
      message += `   📚 ${schedule.eventType}\n`
    }
    message += `\n`
  })

  return message
}

/**
 * Команда /week
 */
export async function handleWeek(userId: string, chatId: number): Promise<string> {
  const telegramUser = await getUserByTelegramId(userId)
  
  if (!telegramUser) {
    return `❌ Ваш аккаунт не привязан к системе ШКЕД.
Используйте /link для привязки аккаунта.`
  }

  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay() + 1) // Понедельник
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6) // Воскресенье

  const schedules = await prisma.schedule.findMany({
    where: {
      groupId: telegramUser.user.groupId,
      date: {
        gte: weekStart,
        lte: weekEnd
      }
    },
    include: {
      subject: true
    },
    orderBy: [
      { date: 'asc' },
      { startTime: 'asc' }
    ]
  })

  if (schedules.length === 0) {
    return `📅 На эту неделю занятий нет.`
  }

  let message = `📅 *Расписание на неделю:*\n\n`
  
  const daysOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const dayOfWeek = schedule.dayOfWeek
    if (!acc[dayOfWeek]) {
      acc[dayOfWeek] = []
    }
    acc[dayOfWeek].push(schedule)
    return acc
  }, {} as Record<number, any[]>)

  for (let day = 1; day <= 7; day++) {
    if (groupedSchedules[day] && groupedSchedules[day].length > 0) {
      message += `*${daysOfWeek[day - 1]}*\n`
      groupedSchedules[day].forEach((schedule, index) => {
        message += `${index + 1}. *${schedule.subject.name}*\n`
        message += `   ⏰ ${schedule.startTime} - ${schedule.endTime}\n`
        if (schedule.location) {
          message += `   📍 ${schedule.location}\n`
        }
        if (schedule.subject.instructor) {
          message += `   👨‍🏫 ${schedule.subject.instructor}\n`
        }
        message += `\n`
      })
    }
  }

  return message
}

/**
 * Команда /settings
 */
export async function handleSettings(userId: string, chatId: number): Promise<string> {
  const telegramUser = await getUserByTelegramId(userId)
  
  if (!telegramUser) {
    return `❌ Ваш аккаунт не привязан к системе ШКЕД.
Используйте /link для привязки аккаунта.`
  }

  return `⚙️ *Настройки уведомлений*

🔔 Уведомления: ${telegramUser.notifications ? 'Включены' : 'Отключены'}
📱 Telegram ID: ${telegramUser.telegramId}
👤 Пользователь: ${telegramUser.user.firstName} ${telegramUser.user.lastName}
🎓 Группа: ${telegramUser.user.group?.name || 'не указана'}

Для изменения настроек обратитесь к администратору.`
}

/**
 * Команда /homework
 */
export async function handleHomework(userId: string, chatId: number): Promise<string> {
  const telegramUser = await getUserByTelegramId(userId)
  
  if (!telegramUser) {
    return `❌ Ваш аккаунт не привязан к системе ШКЕД.
Используйте /link для привязки аккаунта.`
  }

  const homework = await prisma.homework.findMany({
    where: {
      groupId: telegramUser.user.groupId,
      isActive: true,
      deadline: {
        gte: new Date() // Только активные задания
      }
    },
    include: {
      subject: true,
      submissions: {
        where: {
          userId: telegramUser.user.id
        }
      }
    },
    orderBy: {
      deadline: 'asc'
    }
  })

  if (homework.length === 0) {
    return `📝 *Домашние задания*

На данный момент у вас нет активных домашних заданий.`
  }

  let message = `📝 *Ваши домашние задания:*\n\n`
  
  homework.forEach((hw, index) => {
    const submission = hw.submissions[0]
    const status = submission ? 
      (submission.status === 'REVIEWED' ? '✅ Проверено' : 
       submission.status === 'SUBMITTED' ? '📤 Сдано' : '❌ Не сдано') : 
      '❌ Не сдано'
    
    const deadline = new Date(hw.deadline).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    message += `${index + 1}. *${hw.title}*\n`
    message += `   📚 ${hw.subject.name}\n`
    message += `   ⏰ Дедлайн: ${deadline}\n`
    message += `   📊 Статус: ${status}\n`
    if (submission?.grade) {
      message += `   🎯 Оценка: ${submission.grade}\n`
    }
    message += `\n`
  })

  return message
}

/**
 * Команда /homework_due
 */
export async function handleHomeworkDue(userId: string, chatId: number): Promise<string> {
  const telegramUser = await getUserByTelegramId(userId)
  
  if (!telegramUser) {
    return `❌ Ваш аккаунт не привязан к системе ШКЕД.
Используйте /link для привязки аккаунта.`
  }

  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const homework = await prisma.homework.findMany({
    where: {
      groupId: telegramUser.user.groupId,
      isActive: true,
      deadline: {
        gte: now,
        lte: threeDaysFromNow
      }
    },
    include: {
      subject: true,
      submissions: {
        where: {
          userId: telegramUser.user.id
        }
      }
    },
    orderBy: {
      deadline: 'asc'
    }
  })

  if (homework.length === 0) {
    return `📝 *Ближайшие дедлайны*

В ближайшие 3 дня у вас нет дедлайнов по домашним заданиям.`
  }

  let message = `📝 *Ближайшие дедлайны (3 дня):*\n\n`
  
  homework.forEach((hw, index) => {
    const submission = hw.submissions[0]
    const status = submission ? 
      (submission.status === 'REVIEWED' ? '✅ Проверено' : 
       submission.status === 'SUBMITTED' ? '📤 Сдано' : '❌ Не сдано') : 
      '❌ Не сдано'
    
    const deadline = new Date(hw.deadline)
    const hoursLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60))
    
    message += `${index + 1}. *${hw.title}*\n`
    message += `   📚 ${hw.subject.name}\n`
    message += `   ⏰ Осталось: ${hoursLeft} часов\n`
    message += `   📊 Статус: ${status}\n`
    if (submission?.grade) {
      message += `   🎯 Оценка: ${submission.grade}\n`
    }
    message += `\n`
  })

  return message
}

/**
 * Команда /help
 */
export async function handleHelp(userId: string, chatId: number): Promise<string> {
  return `📚 *Доступные команды:*

/start - Приветствие и инструкции
/link [токен] - Привязка аккаунта к системе
/schedule - Расписание на сегодня
/tomorrow - Расписание на завтра
/week - Расписание на неделю
/homework - Мои домашние задания
/homework_due - Ближайшие дедлайны
/settings - Настройки уведомлений
/help - Эта справка

💬 *Естественный язык:*
Можете писать обычными словами:
• "Когда моя следующая пара?"
• "Что у меня завтра?"
• "Покажи расписание на неделю"
• "Где занятие по математике?"
• "Какие домашки у меня есть?"
• "Когда сдавать ДЗ по математике?"

🤖 Бот понимает русский и английский языки.`
}

/**
 * Обработка естественного языка
 */
export async function handleNaturalLanguage(userId: string, chatId: number, text: string): Promise<string> {
  const telegramUser = await getUserByTelegramId(userId)
  
  if (!telegramUser) {
    return `❌ Ваш аккаунт не привязан к системе ШКЕД.
Используйте /link для привязки аккаунта.`
  }

  return await processUserQuery(telegramUser.user.id, text)
}

/**
 * Маршрутизация команд
 */
export async function routeCommand(
  telegramId: string,
  chatId: number,
  command: string,
  args?: string[]
): Promise<string> {
  const userId = telegramId

  switch (command) {
    case '/start':
      return await handleStart(userId, chatId)
    
    case '/link':
      return await handleLink(userId, chatId, args)
    
    case '/schedule':
      return await handleSchedule(userId, chatId)
    
    case '/tomorrow':
      return await handleTomorrow(userId, chatId)
    
    case '/week':
      return await handleWeek(userId, chatId)
    
    case '/homework':
      return await handleHomework(userId, chatId)
    
    case '/homework_due':
      return await handleHomeworkDue(userId, chatId)
    
    case '/settings':
      return await handleSettings(userId, chatId)
    
    case '/help':
      return await handleHelp(userId, chatId)
    
    default:
      // Обработка естественного языка
      return await handleNaturalLanguage(userId, chatId, command)
  }
}
