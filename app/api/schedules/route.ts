
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')

    let whereClause = {}
    
    // Если пользователь студент, показываем только его группу
    if (session.user.role === 'student' && session.user.groupId) {
      whereClause = { groupId: session.user.groupId }
    }
    
    // Если указана группа в параметрах, используем её
    if (groupId) {
      whereClause = { groupId }
    }

    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: {
        subject: true,
        group: true
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Ошибка при получении расписаний:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { subjectId, groupId, subgroupId, date, startTime, endTime, location, eventType, description } = body

    if (!subjectId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Обязательные поля: subjectId, date, startTime, endTime' },
        { status: 400 }
      )
    }

    const scheduleDate = new Date(date)
    const dayOfWeek = scheduleDate.getDay()

    const schedule = await prisma.schedule.create({
      data: {
        subjectId,
        groupId,
        subgroupId,
        date: scheduleDate,
        dayOfWeek,
        startTime,
        endTime,
        location,
        eventType,
        description
      },
      include: {
        subject: true,
        group: true
      }
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Ошибка при создании расписания:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
