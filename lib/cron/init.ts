import cron from 'node-cron'
import { 
  sendScheduleReminder, 
  sendDailySummary,
  sendHomeworkDeadlineReminder,
  sendWeeklyHomeworkSummary
} from '@/lib/telegram/notifications'
import { prisma } from '@/lib/db'

/**
 * Инициализация всех cron задач
 */
export async function initializeCronJobs() {
  // Не инициализируем cron задачи в тестовых окружениях
  if (!process.env.DATABASE_URL) {
    console.log('⏭️  Пропуск инициализации cron задач (DATABASE_URL не найден)')
    return
  }

  // Не инициализируем cron задачи в CI/тестах
  if (process.env.NODE_ENV === 'test' || process.env.CI === 'true') {
    console.log('⏭️  Пропуск инициализации cron задач (тестовое окружение)')
    return
  }

  // Проверяем подключение к базе данных перед инициализацией
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (error) {
    console.log('⏭️  Пропуск инициализации cron задач (база данных недоступна)')
    console.error('Ошибка подключения к БД:', error instanceof Error ? error.message : error)
    return
  }

  console.log('🕐 Инициализация cron задач...')

  // Напоминания о занятиях - каждые 5 минут
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔔 Проверка напоминаний о занятиях...')
    await checkScheduleReminders()
  })

  // Дневные сводки - каждый день в 7:00
  cron.schedule('0 7 * * *', async () => {
    console.log('📅 Отправка дневных сводок...')
    await sendDailySummaries()
  })

  // Проверка дедлайнов домашних заданий - каждые 2 часа
  cron.schedule('0 */2 * * *', async () => {
    console.log('📝 Проверка дедлайнов домашних заданий...')
    await checkHomeworkDeadlines()
  })

  // Еженедельные сводки по ДЗ - каждый понедельник в 8:00
  cron.schedule('0 8 * * 1', async () => {
    console.log('📝 Отправка еженедельных сводок по ДЗ...')
    await sendWeeklyHomeworkSummaries()
  })

  console.log('✅ Cron задачи инициализированы')
}

/**
 * Проверить и отправить напоминания о занятиях
 */
async function checkScheduleReminders() {
  try {
    // Получаем настройки бота
    const botSettings = await prisma.botSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!botSettings?.isActive || !botSettings.notificationsEnabled) {
      return
    }

    const reminderMinutes = botSettings.reminderMinutes || 30
    const now = new Date()
    const reminderTime = new Date(now.getTime() + reminderMinutes * 60 * 1000)

    // Находим занятия, которые начинаются через указанное время
    const upcomingSchedules = await prisma.schedule.findMany({
      where: {
        date: {
          gte: now,
          lte: reminderTime
        }
      },
      include: {
        subject: true,
        group: {
          include: {
            users: {
              include: {
                telegramUser: {
                  where: {
                    isActive: true,
                    notifications: true
                  }
                }
              }
            }
          }
        }
      }
    })

    console.log(`Найдено ${upcomingSchedules.length} занятий для напоминаний`)

    // Отправляем напоминания
    for (const schedule of upcomingSchedules) {
      if (schedule.group?.users) {
        for (const user of schedule.group.users) {
          if (user.telegramUser && user.telegramUser.isActive) {
            await sendScheduleReminder(user.id, schedule.id)
            console.log(`Напоминание отправлено пользователю ${user.firstName} ${user.lastName}`)
          }
        }
      }
    }
  } catch (error) {
    console.error('Ошибка при проверке напоминаний:', error)
  }
}

/**
 * Отправить дневные сводки всем пользователям
 */
async function sendDailySummaries() {
  try {
    // Получаем настройки бота
    const botSettings = await prisma.botSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!botSettings?.isActive || !botSettings.notificationsEnabled) {
      return
    }

    // Получаем всех активных пользователей с Telegram
    const telegramUsers = await prisma.telegramUser.findMany({
      where: {
        isActive: true,
        notifications: true
      },
      include: {
        user: true
      }
    })

    console.log(`Отправка дневных сводок ${telegramUsers.length} пользователям`)

    // Отправляем сводки
    for (const telegramUser of telegramUsers) {
      await sendDailySummary(telegramUser.userId)
      console.log(`Дневная сводка отправлена пользователю ${telegramUser.user.firstName} ${telegramUser.user.lastName}`)
    }
  } catch (error) {
    console.error('Ошибка при отправке дневных сводок:', error)
  }
}

/**
 * Проверить и отправить напоминания о дедлайнах домашних заданий
 */
async function checkHomeworkDeadlines() {
  try {
    // Получаем настройки бота
    const botSettings = await prisma.botSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!botSettings?.isActive || !botSettings.notificationsEnabled) {
      return
    }

    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)

    // Находим домашние задания с дедлайнами в ближайшие 24 часа
    const homeworkWithDeadlines = await prisma.homework.findMany({
      where: {
        isActive: true,
        deadline: {
          gte: now,
          lte: tomorrow
        }
      },
      include: {
        group: {
          include: {
            users: {
              include: {
                telegramUser: {
                  where: {
                    isActive: true,
                    notifications: true
                  }
                }
              }
            }
          }
        }
      }
    })

    console.log(`Найдено ${homeworkWithDeadlines.length} домашних заданий с приближающимися дедлайнами`)

    // Отправляем напоминания
    for (const homework of homeworkWithDeadlines) {
      if (homework.group?.users) {
        for (const user of homework.group.users) {
          if (user.telegramUser && user.telegramUser.isActive) {
            const hoursLeft = Math.ceil((homework.deadline.getTime() - now.getTime()) / (1000 * 60 * 60))
            
            // Отправляем напоминания за 24 часа и за 2 часа
            if (hoursLeft <= 24 && hoursLeft > 22) {
              await sendHomeworkDeadlineReminder(user.id, homework.id, hoursLeft)
              console.log(`Напоминание о ДЗ отправлено пользователю ${user.firstName} ${user.lastName} (24 часа)`)
            } else if (hoursLeft <= 2 && hoursLeft > 0) {
              await sendHomeworkDeadlineReminder(user.id, homework.id, hoursLeft)
              console.log(`Напоминание о ДЗ отправлено пользователю ${user.firstName} ${user.lastName} (2 часа)`)
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Ошибка при проверке дедлайнов ДЗ:', error)
  }
}

/**
 * Отправить еженедельные сводки по домашним заданиям
 */
async function sendWeeklyHomeworkSummaries() {
  try {
    // Получаем настройки бота
    const botSettings = await prisma.botSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!botSettings?.isActive || !botSettings.notificationsEnabled) {
      return
    }

    // Получаем всех активных пользователей с Telegram
    const telegramUsers = await prisma.telegramUser.findMany({
      where: {
        isActive: true,
        notifications: true
      },
      include: {
        user: true
      }
    })

    console.log(`Отправка еженедельных сводок по ДЗ ${telegramUsers.length} пользователям`)

    // Отправляем сводки
    for (const telegramUser of telegramUsers) {
      await sendWeeklyHomeworkSummary(telegramUser.userId)
      console.log(`Еженедельная сводка по ДЗ отправлена пользователю ${telegramUser.user.firstName} ${telegramUser.user.lastName}`)
    }
  } catch (error) {
    console.error('Ошибка при отправке еженедельных сводок по ДЗ:', error)
  }
}

/**
 * Остановить все cron задачи
 */
export function stopCronJobs() {
  console.log('🛑 Остановка cron задач...')
  cron.getTasks().forEach(task => {
    task.stop()
  })
  console.log('✅ Cron задачи остановлены')
}
