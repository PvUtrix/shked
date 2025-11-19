import { sendMessage } from './bot'
import { prisma } from '@/lib/db'

export interface NotificationData {
  userId: string
  scheduleId: string
  message: string
  type: 'reminder' | 'change' | 'summary' | 'broadcast'
}

/**
 * Отправить напоминание о занятии
 */
export async function sendScheduleReminder(userId: string, scheduleId: string): Promise<boolean> {
  try {
    const maxUser = await prisma.maxUser.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            group: true
          }
        }
      }
    })

    if (!maxUser || !maxUser.notifications || !maxUser.isActive) {
      return false
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        subject: true,
        group: true
      }
    })

    if (!schedule) {
      return false
    }

    const message = `🔔 *Напоминание о занятии*

📚 *${schedule.subject.name}*
⏰ Начало через 30 минут (${schedule.startTime})
📍 ${schedule.location || 'Аудитория не указана'}
👨‍🏫 ${schedule.subject.instructor || 'Преподаватель не указан'}

${schedule.description ? `📝 ${schedule.description}` : ''}

Удачного занятия! 🎓`

    const success = await sendMessage({
      chat_id: maxUser.chatId,
      text: message,
      parse_mode: 'Markdown'
    })

    return success
  } catch (error) {
    console.error('Ошибка при отправке напоминания:', error)
    return false
  }
}

/**
 * Отправить уведомление об изменении расписания
 */
export async function sendScheduleChange(groupId: string, schedule: any): Promise<boolean> {
  try {
    const maxUsers = await prisma.maxUser.findMany({
      where: {
        user: {
          groupId: groupId
        },
        notifications: true,
        isActive: true
      },
      include: {
        user: true
      }
    })

    if (maxUsers.length === 0) {
      return true
    }

    const message = `📢 *Изменение в расписании*

📚 *${schedule.subject.name}*
📅 ${schedule.date.toLocaleDateString('ru-RU')}
⏰ ${schedule.startTime} - ${schedule.endTime}
📍 ${schedule.location || 'Аудитория не указана'}
👨‍🏫 ${schedule.subject.instructor || 'Преподаватель не указан'}

${schedule.description ? `📝 ${schedule.description}` : ''}

Пожалуйста, обратите внимание на изменения!`

    let successCount = 0
    for (const maxUser of maxUsers) {
      const success = await sendMessage({
        chat_id: maxUser.chatId,
        text: message,
        parse_mode: 'Markdown'
      })
      if (success) successCount++
    }

    console.error(`Отправлено уведомлений об изменении: ${successCount}/${maxUsers.length}`)
    return successCount > 0
  } catch (error) {
    console.error('Ошибка при отправке уведомления об изменении:', error)
    return false
  }
}

/**
 * Отправить дневную сводку расписания
 */
export async function sendDailySummary(userId: string): Promise<boolean> {
  try {
    const maxUser = await prisma.maxUser.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            group: true
          }
        }
      }
    })

    if (!maxUser || !maxUser.notifications || !maxUser.isActive) {
      return false
    }

    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const schedules = await prisma.schedule.findMany({
      where: {
        groupId: maxUser.user.groupId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        subject: true
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    if (schedules.length === 0) {
      const message = `🌅 *Доброе утро!*

📅 На сегодня занятий нет.
Хорошего дня! 😊`

      return await sendMessage({
        chat_id: maxUser.chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    }

    let message = `🌅 *Доброе утро!*

📅 *Расписание на сегодня:*

`

    schedules.forEach((schedule, index) => {
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

    message += `Удачного дня! 🎓`

    return await sendMessage({
      chat_id: maxUser.chatId,
      text: message,
      parse_mode: 'Markdown'
    })
  } catch (error) {
    console.error('Ошибка при отправке дневной сводки:', error)
    return false
  }
}

/**
 * Рассылка по группе
 */
export async function broadcastToGroup(groupId: string, message: string): Promise<{ sent: number, total: number }> {
  try {
    const maxUsers = await prisma.maxUser.findMany({
      where: {
        user: {
          groupId: groupId
        },
        notifications: true,
        isActive: true
      }
    })

    if (maxUsers.length === 0) {
      return { sent: 0, total: 0 }
    }

    let sentCount = 0
    for (const maxUser of maxUsers) {
      const success = await sendMessage({
        chat_id: maxUser.chatId,
        text: message,
        parse_mode: 'Markdown'
      })
      if (success) sentCount++
    }

    return { sent: sentCount, total: maxUsers.length }
  } catch (error) {
    console.error('Ошибка при рассылке по группе:', error)
    return { sent: 0, total: 0 }
  }
}

/**
 * Рассылка всем пользователям
 */
export async function broadcastToAll(message: string, role?: string): Promise<{ sent: number, total: number }> {
  try {
    const whereClause: any = {
      notifications: true,
      isActive: true
    }

    if (role) {
      whereClause.user = {
        role: role
      }
    }

    const maxUsers = await prisma.maxUser.findMany({
      where: whereClause,
      include: {
        user: true
      }
    })

    if (maxUsers.length === 0) {
      return { sent: 0, total: 0 }
    }

    let sentCount = 0
    for (const maxUser of maxUsers) {
      const success = await sendMessage({
        chat_id: maxUser.chatId,
        text: message,
        parse_mode: 'Markdown'
      })
      if (success) sentCount++
    }

    return { sent: sentCount, total: maxUsers.length }
  } catch (error) {
    console.error('Ошибка при рассылке всем:', error)
    return { sent: 0, total: 0 }
  }
}

/**
 * Отправить тестовое сообщение
 */
export async function sendTestMessage(userId: string): Promise<boolean> {
  try {
    const maxUser = await prisma.maxUser.findUnique({
      where: { userId }
    })

    if (!maxUser) {
      return false
    }

    const message = `🧪 *Тестовое сообщение*

Это тестовое сообщение от системы ШКЕД.
Если вы получили это сообщение, значит уведомления работают корректно! ✅

Время: ${new Date().toLocaleString('ru-RU')}`

    return await sendMessage({
      chat_id: maxUser.chatId,
      text: message,
      parse_mode: 'Markdown'
    })
  } catch (error) {
    console.error('Ошибка при отправке тестового сообщения:', error)
    return false
  }
}

/**
 * Отправить напоминание о дедлайне домашнего задания
 */
export async function sendHomeworkDeadlineReminder(userId: string, homeworkId: string, hoursLeft: number): Promise<boolean> {
  try {
    const maxUser = await prisma.maxUser.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            group: true
          }
        }
      }
    })

    if (!maxUser || !maxUser.notifications || !maxUser.isActive) {
      return false
    }

    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        subject: true,
        submissions: {
          where: {
            userId: userId
          }
        }
      }
    })

    if (!homework) {
      return false
    }

    const submission = homework.submissions[0]
    const status = submission ? 
      (submission.status === 'REVIEWED' ? '✅ Проверено' : 
       submission.status === 'SUBMITTED' ? '📤 Сдано' : '❌ Не сдано') : 
      '❌ Не сдано'

    const message = `📝 *Напоминание о домашнем задании*

📚 *${homework.title}*
📖 ${homework.subject.name}
⏰ Дедлайн через ${hoursLeft} часов
📊 Статус: ${status}

${homework.description ? `📝 ${homework.description}` : ''}

${homework.taskUrl ? `🔗 [Открыть задание](${homework.taskUrl})` : ''}

${status.includes('Не сдано') ? '⚠️ Не забудьте сдать задание вовремя!' : '✅ Задание уже сдано!'}`

    const success = await sendMessage({
      chat_id: maxUser.chatId,
      text: message,
      parse_mode: 'Markdown'
    })

    return success
  } catch (error) {
    console.error('Ошибка при отправке напоминания о дедлайне:', error)
    return false
  }
}

/**
 * Отправить уведомление о новом домашнем задании
 */
export async function sendNewHomeworkNotification(groupId: string, homework: any): Promise<boolean> {
  try {
    const maxUsers = await prisma.maxUser.findMany({
      where: {
        user: {
          groupId: groupId
        },
        notifications: true,
        isActive: true
      },
      include: {
        user: true
      }
    })

    if (maxUsers.length === 0) {
      return true
    }

    const deadline = new Date(homework.deadline).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const message = `📝 *Новое домашнее задание*

📚 *${homework.title}*
📖 ${homework.subject.name}
⏰ Дедлайн: ${deadline}

${homework.description ? `📝 ${homework.description}` : ''}

${homework.taskUrl ? `🔗 [Открыть задание](${homework.taskUrl})` : ''}

Удачи в выполнении! 🎓`

    let successCount = 0
    for (const maxUser of maxUsers) {
      const success = await sendMessage({
        chat_id: maxUser.chatId,
        text: message,
        parse_mode: 'Markdown'
      })
      if (success) successCount++
    }

    console.error(`Отправлено уведомлений о новом ДЗ: ${successCount}/${maxUsers.length}`)
    return successCount > 0
  } catch (error) {
    console.error('Ошибка при отправке уведомления о новом ДЗ:', error)
    return false
  }
}

/**
 * Отправить уведомление о проверке домашнего задания
 */
export async function sendHomeworkReviewNotification(userId: string, homework: any, submission: any): Promise<boolean> {
  try {
    const maxUser = await prisma.maxUser.findUnique({
      where: { userId },
      include: {
        user: true
      }
    })

    if (!maxUser || !maxUser.notifications || !maxUser.isActive) {
      return false
    }

    const message = `📝 *Домашнее задание проверено*

📚 *${homework.title}*
📖 ${homework.subject.name}
🎯 Оценка: ${submission.grade}/5
📊 Статус: ✅ Проверено

${submission.comment ? `💬 Комментарий преподавателя:
${submission.comment}` : ''}

Отличная работа! 🎉`

    const success = await sendMessage({
      chat_id: maxUser.chatId,
      text: message,
      parse_mode: 'Markdown'
    })

    return success
  } catch (error) {
    console.error('Ошибка при отправке уведомления о проверке:', error)
    return false
  }
}

/**
 * Отправить еженедельную сводку по домашним заданиям
 */
export async function sendWeeklyHomeworkSummary(userId: string): Promise<boolean> {
  try {
    const maxUser = await prisma.maxUser.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            group: true
          }
        }
      }
    })

    if (!maxUser || !maxUser.notifications || !maxUser.isActive) {
      return false
    }

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1) // Понедельник
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // Воскресенье

    const homework = await prisma.homework.findMany({
      where: {
        groupId: maxUser.user.groupId,
        isActive: true,
        deadline: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      include: {
        subject: true,
        submissions: {
          where: {
            userId: userId
          }
        }
      },
      orderBy: {
        deadline: 'asc'
      }
    })

    if (homework.length === 0) {
      const message = `📝 *Сводка по домашним заданиям*

📅 На эту неделю домашних заданий нет.
Хорошей недели! 😊`

      return await sendMessage({
        chat_id: maxUser.chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    }

    let message = `📝 *Сводка по домашним заданиям на неделю*

`

    homework.forEach((hw, index) => {
      const submission = hw.submissions[0]
      const status = submission ? 
        (submission.status === 'REVIEWED' ? '✅ Проверено' : 
         submission.status === 'SUBMITTED' ? '📤 Сдано' : '❌ Не сдано') : 
        '❌ Не сдано'
      
      const deadline = new Date(hw.deadline).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      message += `${index + 1}. *${hw.title}*\n`
      message += `   📚 ${hw.subject.name}\n`
      message += `   ⏰ ${deadline}\n`
      message += `   📊 ${status}\n`
      if (submission?.grade) {
        message += `   🎯 Оценка: ${submission.grade}/5\n`
      }
      message += `\n`
    })

    message += `Удачной недели! 🎓`

    return await sendMessage({
      chat_id: maxUser.chatId,
      text: message,
      parse_mode: 'Markdown'
    })
  } catch (error) {
    console.error('Ошибка при отправке еженедельной сводки:', error)
    return false
  }
}

/**
 * Получить статистику уведомлений
 */
export async function getNotificationStats(): Promise<{
  totalUsers: number
  activeUsers: number
  notificationsEnabled: number
  recentActivity: number
}> {
  try {
    const [
      totalUsers,
      activeUsers,
      notificationsEnabled,
      recentActivity
    ] = await Promise.all([
      prisma.maxUser.count(),
      prisma.maxUser.count({ where: { isActive: true } }),
      prisma.maxUser.count({ where: { notifications: true } }),
      prisma.maxUser.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Последние 7 дней
          }
        }
      })
    ])

    return {
      totalUsers,
      activeUsers,
      notificationsEnabled,
      recentActivity
    }
  } catch (error) {
    console.error('Ошибка при получении статистики уведомлений:', error)
    return {
      totalUsers: 0,
      activeUsers: 0,
      notificationsEnabled: 0,
      recentActivity: 0
    }
  }
}
