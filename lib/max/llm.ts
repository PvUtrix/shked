import axios from 'axios'
import { getBotSettings } from './bot'
import { prisma } from '@/lib/db'

export interface UserContext {
  userId: string
  role: string
  firstName?: string
  lastName?: string
  groupName?: string
  subgroups?: string[]
  currentDate: string
}

export interface ScheduleData {
  id: string
  subject: {
    name: string
    instructor?: string
  }
  date: Date
  startTime: string
  endTime: string
  location?: string
  eventType?: string
  description?: string
}

/**
 * Get user context for LLM
 */
export async function getUserContext(userId: string): Promise<UserContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      group: true,
      userGroups: true
    }
  })

  if (!user) {
    throw new Error('Пользователь не найден')
  }

  const subgroups = []
  if (user.userGroups.length > 0) {
    const userGroup = user.userGroups[0]
    if (userGroup.subgroupCommerce) subgroups.push(`Коммерциализация: ${userGroup.subgroupCommerce}`)
    if (userGroup.subgroupTutorial) subgroups.push(`Тьюториал: ${userGroup.subgroupTutorial}`)
    if (userGroup.subgroupFinance) subgroups.push(`Финансы: ${userGroup.subgroupFinance}`)
    if (userGroup.subgroupSystemThinking) subgroups.push(`Системное мышление: ${userGroup.subgroupSystemThinking}`)
  }

  return {
    userId: user.id,
    role: user.role,
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    groupName: user.group?.name,
    subgroups,
    currentDate: new Date().toLocaleDateString('ru-RU')
  }
}

/**
 * Get user schedule
 */
export async function getSchedule(userId: string, date?: Date): Promise<ScheduleData[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { group: true }
  })

  if (!user?.groupId) {
    return []
  }

  const targetDate = date || new Date()
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  const schedules = await prisma.schedule.findMany({
    where: {
      groupId: user.groupId,
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

  return schedules.map(schedule => ({
    id: schedule.id,
    subject: {
      name: schedule.subject.name,
      instructor: schedule.subject.instructor || undefined
    },
    date: schedule.date,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    location: schedule.location || undefined,
    eventType: schedule.eventType || undefined,
    description: schedule.description || undefined
  }))
}

/**
 * Get next class
 */
export async function getNextClass(userId: string): Promise<ScheduleData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { group: true }
  })

  if (!user?.groupId) {
    return null
  }

  const now = new Date()
  const schedules = await prisma.schedule.findMany({
    where: {
      groupId: user.groupId,
      date: {
        gte: now
      }
    },
    include: {
      subject: true
    },
    orderBy: [
      { date: 'asc' },
      { startTime: 'asc' }
    ],
    take: 1
  })

  if (schedules.length === 0) {
    return null
  }

  const schedule = schedules[0]
  return {
    id: schedule.id,
    subject: {
      name: schedule.subject.name,
      instructor: schedule.subject.instructor || undefined
    },
    date: schedule.date,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    location: schedule.location || undefined,
    eventType: schedule.eventType || undefined,
    description: schedule.description || undefined
  }
}

/**
 * Get group info (for admins)
 */
export async function getGroupInfo(groupId: string): Promise<any> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      users: true,
      schedules: {
        include: {
          subject: true
        }
      }
    }
  })

  if (!group) {
    return null
  }

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    semester: group.semester,
    year: group.year,
    studentCount: group.users.length,
    scheduleCount: group.schedules.length,
    nextSchedule: group.schedules
      .filter(s => new Date(s.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
  }
}

/**
 * Get user stats (for admins)
 */
export async function getUserStats(): Promise<any> {
  const [totalUsers, activeMaxUsers, totalGroups, totalSchedules] = await Promise.all([
    prisma.user.count(),
    prisma.maxUser.count({ where: { isActive: true } }),
    prisma.group.count(),
    prisma.schedule.count()
  ])

  return {
    totalUsers,
    activeMaxUsers,
    totalGroups,
    totalSchedules
  }
}

/**
 * Get GigaChat access token
 */
export async function getGigaChatToken(): Promise<string | null> {
  const settings = await getBotSettings()

  // Try to get key from DB settings first
  const apiKey = settings?.openaiApiKey || process.env.GIGACHAT_API_KEY

  if (!apiKey) {
    console.error('GigaChat API ключ не найден')
    return null
  }

  try {
    const response = await axios.post('https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
      'scope=GIGACHAT_API_PERS',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'RqUID': crypto.randomUUID(),
          'Authorization': `Bearer ${apiKey}`
        }
      }
    )

    return response.data.access_token
  } catch (error) {
    console.error('Ошибка получения токена GigaChat:', error)
    return null
  }
}

/**
 * Process user query via GigaChat
 */
export async function processUserQuery(
  userId: string,
  query: string
): Promise<string> {
  const accessToken = await getGigaChatToken()
  if (!accessToken) {
    return 'Извините, сервис временно недоступен. GigaChat API ключ не настроен.'
  }

  try {
    const userContext = await getUserContext(userId)

    const systemPrompt = `Ты бот системы ШКЕД - управление расписанием университета.

Пользователь: ${userContext.role} (${userContext.firstName} ${userContext.lastName})
Группа: ${userContext.groupName || 'не указана'}
Подгруппы: ${userContext.subgroups?.join(', ') || 'не указаны'}
Текущая дата: ${userContext.currentDate}

Отвечай на вопросы о расписании, помогай с навигацией.
Отвечай на русском языке, будь дружелюбным и полезным.

Доступные команды:
- /start - приветствие
- /schedule - расписание на сегодня
- /tomorrow - расписание на завтра
- /week - расписание на неделю
- /settings - настройки
- /help - помощь

Можешь отвечать на естественные вопросы типа:
- "Когда моя следующая пара?"
- "Что у меня завтра?"
- "Покажи расписание на неделю"
- "Где занятие по финансовому моделированию?"`

    // Get data for context
    const schedules = await getSchedule(userId)
    const nextClass = await getNextClass(userId)

    const contextData = {
      userRole: userContext.role,
      groupName: userContext.groupName,
      subgroups: userContext.subgroups,
      currentDate: userContext.currentDate,
      todaySchedule: schedules.map(s => ({
        subject: s.subject.name,
        time: `${s.startTime}-${s.endTime}`,
        location: s.location,
        instructor: s.subject.instructor,
        type: s.eventType
      })),
      nextClass: nextClass ? {
        subject: nextClass.subject.name,
        date: nextClass.date.toLocaleDateString('ru-RU'),
        time: `${nextClass.startTime}-${nextClass.endTime}`,
        location: nextClass.location,
        instructor: nextClass.subject.instructor
      } : null
    }

    const enhancedPrompt = `${systemPrompt}

Контекст пользователя:
- Роль: ${contextData.userRole}
- Группа: ${contextData.groupName}
- Подгруппы: ${contextData.subgroups?.join(', ') || 'не указаны'}
- Текущая дата: ${contextData.currentDate}

Расписание на сегодня:
${contextData.todaySchedule.length > 0
      ? contextData.todaySchedule.map(s => `- ${s.subject} (${s.time}) ${s.location ? `в ${s.location}` : ''}`).join('\n')
      : 'Занятий нет'
    }

${contextData.nextClass ? `Следующее занятие: ${contextData.nextClass.subject} (${contextData.nextClass.date} в ${contextData.nextClass.time})` : 'Следующих занятий нет'}

Вопрос пользователя: ${query}`

    const response = await axios.post(
      'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
      {
        model: 'GigaChat',
        messages: [
          { role: 'system', content: enhancedPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data.choices[0].message.content || 'Не удалось обработать запрос'
  } catch (error) {
    console.error('Ошибка при обработке запроса GigaChat:', error)
    return 'Извините, произошла ошибка при обработке вашего запроса.'
  }
}
