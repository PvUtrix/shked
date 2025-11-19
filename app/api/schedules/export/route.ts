import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createICalendar, createICalResponse, ICalEvent } from '@/lib/export/ical'

// GET /api/schedules/export - Экспорт расписания в iCal формат
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response('Необходима авторизация', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        group: true,
        subgroupMemberships: {
          include: {
            subgroup: true,
          },
        },
      },
    })

    if (!user) {
      return new Response('Пользователь не найден', { status: 404 })
    }

    // Получить параметры фильтрации
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const subjectId = searchParams.get('subjectId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Построить where условие
    const where: any = { isActive: true }

    // Для студентов - показывать только их расписание
    if (user.role === 'student') {
      const userSubgroupIds = user.subgroupMemberships.map((m) => m.subgroupId)

      where.OR = [
        { groupId: user.groupId, subgroupId: null }, // Общее расписание группы
        { subgroupId: { in: userSubgroupIds } }, // Расписание подгрупп студента
      ]
    } else {
      // Для преподавателей и администраторов - применять фильтры
      if (groupId) {
        where.groupId = groupId
      }

      if (subjectId) {
        where.subjectId = subjectId
      }
    }

    // Фильтр по датам
    if (startDate) {
      where.date = { ...where.date, gte: new Date(startDate) }
    }

    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) }
    }

    // Если даты не указаны, экспортировать на 3 месяца вперёд
    if (!startDate && !endDate) {
      const today = new Date()
      const threeMonthsLater = new Date()
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)

      where.date = {
        gte: today,
        lte: threeMonthsLater,
      }
    }

    // Получить расписание
    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        subject: {
          select: {
            name: true,
            description: true,
            lectors: {
              include: {
                lector: {
                  select: {
                    firstName: true,
                    lastName: true,
                    middleName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        group: {
          select: {
            name: true,
          },
        },
        subgroup: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Преобразовать в iCal события
    const events: ICalEvent[] = schedules.map((schedule) => {
      // Создать Date объекты для начала и конца занятия
      const scheduleDate = new Date(schedule.date)
      const [startHour, startMinute] = schedule.startTime.split(':').map(Number)
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number)

      const startDate = new Date(scheduleDate)
      startDate.setHours(startHour, startMinute, 0, 0)

      const endDate = new Date(scheduleDate)
      endDate.setHours(endHour, endMinute, 0, 0)

      // Сформировать описание
      let description = schedule.subject.description || ''
      if (schedule.description) {
        description += (description ? '\\n\\n' : '') + schedule.description
      }
      if (schedule.eventType) {
        description += (description ? '\\n\\n' : '') + `Тип занятия: ${schedule.eventType}`
      }
      if (schedule.videoUrl) {
        description += (description ? '\\n\\n' : '') + `Запись: ${schedule.videoUrl}`
      }

      // Найти основного преподавателя
      const primaryLector = schedule.subject.lectors.find((l) => l.isPrimary)
      const lector = primaryLector || schedule.subject.lectors[0]

      // Сформировать заголовок
      let title = schedule.subject.name
      if (schedule.group) {
        title += ` (${schedule.group.name}${schedule.subgroup ? ` - ${schedule.subgroup.name}` : ''})`
      }

      return {
        uid: schedule.id,
        title,
        description,
        location: schedule.location || undefined,
        start: startDate,
        end: endDate,
        url: schedule.zoomMeetingId ? `https://zoom.us/j/${schedule.zoomMeetingId}` : undefined,
        organizer: lector?.lector
          ? {
              name: `${lector.lector.lastName || ''} ${lector.lector.firstName || ''}`.trim(),
              email: lector.lector.email,
            }
          : undefined,
      }
    })

    // Создать iCal контент
    const calendarName = user.role === 'student' && user.group
      ? `Расписание - ${user.group.name}`
      : 'Расписание ШКЭД'

    const icalContent = createICalendar(events, calendarName)

    // Сформировать имя файла
    const filename = user.role === 'student' && user.group
      ? `Расписание_${user.group.name.replace(/[^\w]/g, '_')}.ics`
      : 'Расписание_ШКЭД.ics'

    // Вернуть iCal файл
    return createICalResponse(icalContent, filename)
  } catch (error) {
    console.error('Ошибка при экспорте расписания в iCal:', error)
    return new Response('Ошибка при экспорте расписания', { status: 500 })
  }
}
