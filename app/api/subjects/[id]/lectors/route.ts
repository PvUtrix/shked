import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logActivity } from '@/lib/activity-log'

// POST /api/subjects/[id]/lectors - добавление преподавателя к предмету
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Только admin может назначать преподавателей
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const subjectId = params.id
    const body = await request.json()

    // Валидация
    if (!body.userId) {
      return NextResponse.json(
        { error: 'userId обязателен' },
        { status: 400 }
      )
    }

    // Проверяем существование предмета
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    })

    if (!subject) {
      return NextResponse.json(
        { error: 'Предмет не найден' },
        { status: 404 }
      )
    }

    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({
      where: { id: body.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Если назначается основной преподаватель, убираем флаг isPrimary у остальных
    if (body.isPrimary) {
      await prisma.subjectLector.updateMany({
        where: {
          subjectId: subjectId,
          isPrimary: true
        },
        data: {
          isPrimary: false
        }
      })
    }

    // Создаем или обновляем назначение
    const assignment = await prisma.subjectLector.upsert({
      where: {
        subjectId_userId: {
          subjectId: subjectId,
          userId: body.userId
        }
      },
      create: {
        subjectId: subjectId,
        userId: body.userId,
        role: body.role || 'LECTOR',
        isPrimary: body.isPrimary || false
      },
      update: {
        role: body.role || 'LECTOR',
        isPrimary: body.isPrimary || false
      },
      include: {
        lector: {
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

    // Логируем действие
    await logActivity({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'SubjectLector',
      entityId: assignment.id,
      request,
      details: {
        after: {
          id: assignment.id,
          subjectId,
          userId: body.userId,
          role: assignment.role,
          isPrimary: assignment.isPrimary
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json(assignment, { status: 201 })

  } catch (error) {
    console.error('Ошибка при назначении преподавателя:', error)

    const session = await getServerSession(authOptions)
    if (session?.user) {
      await logActivity({
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'SubjectLector',
        request,
        details: {
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        },
        result: 'FAILURE'
      })
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
