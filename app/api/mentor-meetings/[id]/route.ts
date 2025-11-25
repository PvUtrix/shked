import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/mentor-meetings/[id] - Получить встречу
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const meeting = await prisma.mentorMeeting.findUnique({
      where: { id: meetingId },
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
      }
    })

    if (!meeting) {
      return NextResponse.json({ error: 'Встреча не найдена' }, { status: 404 })
    }

    // Проверка доступа
    const hasAccess = 
      session.user.role === 'admin' ||
      meeting.mentorId === session.user.id ||
      meeting.studentId === session.user.id

    if (!hasAccess) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    return NextResponse.json(meeting)
  } catch (error) {
    console.error('Ошибка при получении встречи:', error)
    return NextResponse.json(
      { error: 'Не удалось получить встречу' },
      { status: 500 }
    )
  }
}

// PATCH /api/mentor-meetings/[id] - Обновить встречу
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const meeting = await prisma.mentorMeeting.findUnique({
      where: { id: meetingId }
    })

    if (!meeting) {
      return NextResponse.json({ error: 'Встреча не найдена' }, { status: 404 })
    }

    // Проверка доступа
    const canEdit =
      session.user.role === 'admin' ||
      meeting.mentorId === session.user.id

    if (!canEdit) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { scheduledAt, duration, status, agenda, notes, location, meetingType } = body

    const updated = await prisma.mentorMeeting.update({
      where: { id: meetingId },
      data: {
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(duration && { duration }),
        ...(status && { status }),
        ...(agenda !== undefined && { agenda }),
        ...(notes !== undefined && { notes }),
        ...(location !== undefined && { location }),
        ...(meetingType !== undefined && { meetingType })
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Ошибка при обновлении встречи:', error)
    return NextResponse.json(
      { error: 'Не удалось обновить встречу' },
      { status: 500 }
    )
  }
}

// DELETE /api/mentor-meetings/[id] - Отменить встречу
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const meeting = await prisma.mentorMeeting.findUnique({
      where: { id: meetingId }
    })

    if (!meeting) {
      return NextResponse.json({ error: 'Встреча не найдена' }, { status: 404 })
    }

    // Проверка доступа
    const canDelete =
      session.user.role === 'admin' ||
      meeting.mentorId === session.user.id ||
      meeting.studentId === session.user.id

    if (!canDelete) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Отмена встречи (не удаляем физически)
    await prisma.mentorMeeting.update({
      where: { id: meetingId },
      data: { status: 'CANCELLED' }
    })

    return NextResponse.json({ message: 'Встреча отменена' })
  } catch (error) {
    console.error('Ошибка при отмене встречи:', error)
    return NextResponse.json(
      { error: 'Не удалось отменить встречу' },
      { status: 500 }
    )
  }
}


