import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/mentor-meetings - Получить список встреч
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mentorId = searchParams.get('mentorId')
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')

    const where: any = {}
    
    // Фильтрация по ролям
    if (session.user.role === 'mentor') {
      where.mentorId = session.user.id
    } else if (session.user.role === 'student') {
      where.studentId = session.user.id
    } else if (mentorId) {
      where.mentorId = mentorId
    } else if (studentId) {
      where.studentId = studentId
    }
    
    if (status) {
      where.status = status
    }

    const meetings = await prisma.mentorMeeting.findMany({
      where,
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    })

    return NextResponse.json(meetings)
  } catch (error) {
    console.error('Ошибка при получении встреч:', error)
    return NextResponse.json(
      { error: 'Не удалось получить встречи' },
      { status: 500 }
    )
  }
}

// POST /api/mentor-meetings - Создать встречу
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверка прав доступа
    if (!['admin', 'mentor', 'student'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { mentorId, studentId, scheduledAt, duration, agenda, location, meetingType } = body

    // Валидация
    if (!mentorId || !studentId || !scheduledAt || !duration) {
      return NextResponse.json(
        { error: 'Не все обязательные поля заполнены' },
        { status: 400 }
      )
    }

    // Проверка, что пользователь может создавать встречи
    if (session.user.role === 'mentor' && session.user.id !== mentorId) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    if (session.user.role === 'student' && session.user.id !== studentId) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Создание встречи
    const meeting = await prisma.mentorMeeting.create({
      data: {
        mentorId,
        studentId,
        scheduledAt: new Date(scheduledAt),
        duration,
        agenda: agenda || null,
        location: location || null,
        meetingType: meetingType || null
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error('Ошибка при создании встречи:', error)
    return NextResponse.json(
      { error: 'Не удалось создать встречу' },
      { status: 500 }
    )
  }
}


