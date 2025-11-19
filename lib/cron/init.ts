import cron from 'node-cron'
import {
  sendScheduleReminder as sendTelegramScheduleReminder,
  sendDailySummary as sendTelegramDailySummary,
  sendHomeworkDeadlineReminder as sendTelegramHomeworkDeadlineReminder,
  sendWeeklyHomeworkSummary as sendTelegramWeeklyHomeworkSummary
} from '@/lib/telegram/notifications'
import {
  sendScheduleReminder as sendMaxScheduleReminder,
  sendDailySummary as sendMaxDailySummary,
  sendHomeworkDeadlineReminder as sendMaxHomeworkDeadlineReminder,
  sendWeeklyHomeworkSummary as sendMaxWeeklyHomeworkSummary
} from '@/lib/max/notifications'
import { prisma } from '@/lib/db'

/**
 * Инициализация всех cron задач
 */
export async function initializeCronJobs() {
  // Не инициализируем cron задачи в тестовых окружениях
  if (!process.env.DATABASE_URL) {
    console.error('⏭️  Пропуск инициализации cron задач (DATABASE_URL не найден)')
    return
  }

  // Не инициализируем cron задачи в CI/тестах
  if (process.env.NODE_ENV === 'test' || process.env.CI === 'true') {
    console.error('⏭️  Пропуск инициализации cron задач (тестовое окружение)')
    return
  }

  // Проверяем подключение к базе данных перед инициализацией
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (error) {
    console.error('⏭️  Пропуск инициализации cron задач (база данных недоступна)')
    console.error('Ошибка подключения к БД:', error instanceof Error ? error.message : error)
    return
  }

  console.error('🕐 Инициализация cron задач...')

  // Напоминания о занятиях - каждые 5 минут
  cron.schedule('*/5 * * * *', async () => {
    console.error('🔔 Проверка напоминаний о занятиях...')
    await checkScheduleReminders()
  })

  // Дневные сводки - каждый день в 7:00
  cron.schedule('0 7 * * *', async () => {
    console.error('📅 Отправка дневных сводок...')
    await sendDailySummaries()
  })

  // Проверка дедлайнов домашних заданий - каждые 2 часа
  cron.schedule('0 */2 * * *', async () => {
    console.error('📝 Проверка дедлайнов домашних заданий...')
    await checkHomeworkDeadlines()
  })

  // Еженедельные сводки по ДЗ - каждый понедельник в 8:00
  cron.schedule('0 8 * * 1', async () => {
    console.error('📝 Отправка еженедельных сводок по ДЗ...')
    await sendWeeklyHomeworkSummaries()
  })

  console.error('✅ Cron задачи инициализированы')
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
                },
                maxUser: {
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

    console.error(`Найдено ${upcomingSchedules.length} занятий для напоминаний`)

    // Отправляем напоминания
    for (const schedule of upcomingSchedules) {
      if (schedule.group?.users) {
        for (const user of schedule.group.users) {
          // Telegram notifications
          if (user.telegramUser && user.telegramUser.isActive) {
            await sendTelegramScheduleReminder(user.id, schedule.id)
            console.error(`[Telegram] Напоминание отправлено пользователю ${user.firstName} ${user.lastName}`)
          }
          // Max notifications
          if (user.maxUser && user.maxUser.isActive) {
            await sendMaxScheduleReminder(user.id, schedule.id)
            console.error(`[Max] Напоминание отправлено пользователю ${user.firstName} ${user.lastName}`)
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

    // Получаем всех активных пользователей с Max
    const maxUsers = await prisma.maxUser.findMany({
      where: {
        isActive: true,
        notifications: true
      },
      include: {
        user: true
      }
    })

    console.error(`Отправка дневных сводок ${telegramUsers.length} Telegram пользователям и ${maxUsers.length} Max пользователям`)

    // Отправляем сводки через Telegram
    for (const telegramUser of telegramUsers) {
      await sendTelegramDailySummary(telegramUser.userId)
      console.error(`[Telegram] Дневная сводка отправлена пользователю ${telegramUser.user.firstName} ${telegramUser.user.lastName}`)
    }

    // Отправляем сводки через Max
    for (const maxUser of maxUsers) {
      await sendMaxDailySummary(maxUser.userId)
      console.error(`[Max] Дневная сводка отправлена пользователю ${maxUser.user.firstName} ${maxUser.user.lastName}`)
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
                },
                maxUser: {
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

    console.error(`Найдено ${homeworkWithDeadlines.length} домашних заданий с приближающимися дедлайнами`)

    // Отправляем напоминания
    for (const homework of homeworkWithDeadlines) {
      if (homework.group?.users) {
        for (const user of homework.group.users) {
          const hoursLeft = Math.ceil((homework.deadline.getTime() - now.getTime()) / (1000 * 60 * 60))

          // Отправляем напоминания за 24 часа и за 2 часа
          if (hoursLeft <= 24 && hoursLeft > 22) {
            // Telegram
            if (user.telegramUser && user.telegramUser.isActive) {
              await sendTelegramHomeworkDeadlineReminder(user.id, homework.id, hoursLeft)
              console.error(`[Telegram] Напоминание о ДЗ отправлено пользователю ${user.firstName} ${user.lastName} (24 часа)`)
            }
            // Max
            if (user.maxUser && user.maxUser.isActive) {
              await sendMaxHomeworkDeadlineReminder(user.id, homework.id, hoursLeft)
              console.error(`[Max] Напоминание о ДЗ отправлено пользователю ${user.firstName} ${user.lastName} (24 часа)`)
            }
          } else if (hoursLeft <= 2 && hoursLeft > 0) {
            // Telegram
            if (user.telegramUser && user.telegramUser.isActive) {
              await sendTelegramHomeworkDeadlineReminder(user.id, homework.id, hoursLeft)
              console.error(`[Telegram] Напоминание о ДЗ отправлено пользователю ${user.firstName} ${user.lastName} (2 часа)`)
            }
            // Max
            if (user.maxUser && user.maxUser.isActive) {
              await sendMaxHomeworkDeadlineReminder(user.id, homework.id, hoursLeft)
              console.error(`[Max] Напоминание о ДЗ отправлено пользователю ${user.firstName} ${user.lastName} (2 часа)`)
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

    // Получаем всех активных пользователей с Max
    const maxUsers = await prisma.maxUser.findMany({
      where: {
        isActive: true,
        notifications: true
      },
      include: {
        user: true
      }
    })

    console.error(`Отправка еженедельных сводок по ДЗ ${telegramUsers.length} Telegram пользователям и ${maxUsers.length} Max пользователям`)

    // Отправляем сводки через Telegram
    for (const telegramUser of telegramUsers) {
      await sendTelegramWeeklyHomeworkSummary(telegramUser.userId)
      console.error(`[Telegram] Еженедельная сводка по ДЗ отправлена пользователю ${telegramUser.user.firstName} ${telegramUser.user.lastName}`)
    }

    // Отправляем сводки через Max
    for (const maxUser of maxUsers) {
      await sendMaxWeeklyHomeworkSummary(maxUser.userId)
      console.error(`[Max] Еженедельная сводка по ДЗ отправлена пользователю ${maxUser.user.firstName} ${maxUser.user.lastName}`)
    }
  } catch (error) {
    console.error('Ошибка при отправке еженедельных сводок по ДЗ:', error)
  }
}

/**
 * Остановить все cron задачи
 */
export function stopCronJobs() {
  console.error('🛑 Остановка cron задач...')
  cron.getTasks().forEach(task => {
    task.stop()
  })
  console.error('✅ Cron задачи остановлены')
}
