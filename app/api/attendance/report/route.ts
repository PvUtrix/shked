import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/attendance/report - Получить отчет по посещаемости
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверка прав доступа
    if (!['admin', 'teacher', 'department_admin', 'education_office_head'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const subjectId = searchParams.get('subjectId')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Построение условий фильтрации
    const where: any = {}
    
    if (userId) {
      where.userId = userId
    }

    if (groupId || subjectId || startDate || endDate) {
      where.schedule = {}
      
      if (groupId) {
        where.schedule.groupId = groupId
      }
      
      if (subjectId) {
        where.schedule.subjectId = subjectId
      }
      
      if (startDate || endDate) {
        where.schedule.date = {}
        if (startDate) {
          where.schedule.date.gte = new Date(startDate)
        }
        if (endDate) {
          where.schedule.date.lte = new Date(endDate)
        }
      }
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        schedule: {
          include: {
            subject: {
              select: {
                id: true,
                name: true
              }
            },
            group: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { schedule: { date: 'desc' } },
        { markedAt: 'desc' }
      ]
    })

    // Подсчет статистики
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      excused: attendance.filter(a => a.status === 'EXCUSED').length
    }

    return NextResponse.json({
      attendance,
      stats
    })
  } catch (error) {
    console.error('Ошибка при получении отчета по посещаемости:', error)
    return NextResponse.json(
      { error: 'Не удалось получить отчет' },
      { status: 500 }
    )
  }
}


