import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/schedules - получение списка расписания
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const groupId = searchParams.get('groupId')
    const lector = searchParams.get('lector') === 'true'
    const mentor = searchParams.get('mentor') === 'true'
    const date = searchParams.get('date')

    const where: any = {}

    // Фильтрация по предмету
    if (subjectId) {
      where.subjectId = subjectId
    }

    // Фильтрация по группе
    if (groupId) {
      where.groupId = groupId
    }

    // Фильтрация по дате
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      
      where.date = {
        gte: startDate,
        lt: endDate
      }
    }

    // Для студентов показываем только их группу
    if (session.user.role === 'student' && session.user.groupId) {
      where.groupId = session.user.groupId
    }

    // Для преподавателей показываем только их предметы
    if (session.user.role === 'lector' || lector) {
      where.subject = {
        lectorId: session.user.id
      }
    }

    // Для менторов показываем только их группы
    if (session.user.role === 'mentor' || mentor) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })
      
      if (user?.mentorGroupIds) {
        const groupIds = Array.isArray(user.mentorGroupIds) ? user.mentorGroupIds : []
        where.groupId = {
          in: groupIds
        }
      }
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            lector: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json({ schedules })

  } catch (error) {
    console.error('Ошибка при получении расписания:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}