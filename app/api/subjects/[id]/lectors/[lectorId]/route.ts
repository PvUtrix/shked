import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logActivity } from '@/lib/activity-log'

// DELETE /api/subjects/[id]/lectors/[lectorId] - удаление преподавателя из предмета
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lectorId: string }> }
) {
  try {
    const { id: subjectId, lectorId: assignmentId } = await params
    const session = await getServerSession(authOptions)

    // Только admin может удалять назначения преподавателей
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Проверяем существование назначения
    const assignment = await prisma.subjectLector.findUnique({
      where: { id: assignmentId },
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

    if (!assignment) {
      return NextResponse.json(
        { error: 'Назначение не найдено' },
        { status: 404 }
      )
    }

    // Проверяем, что назначение относится к нужному предмету
    if (assignment.subjectId !== subjectId) {
      return NextResponse.json(
        { error: 'Назначение не относится к данному предмету' },
        { status: 400 }
      )
    }

    // Удаляем назначение
    await prisma.subjectLector.delete({
      where: { id: assignmentId }
    })

    // Логируем действие
    await logActivity({
      userId: session.user.id,
      action: 'DELETE',
      entityType: 'SubjectLector',
      entityId: assignmentId,
      request,
      details: {
        before: {
          id: assignment.id,
          subjectId,
          userId: assignment.userId,
          role: assignment.role,
          isPrimary: assignment.isPrimary,
          lector: assignment.lector
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json({ message: 'Преподаватель удален' })

  } catch (error) {
    console.error('Ошибка при удалении назначения преподавателя:', error)

    const session = await getServerSession(authOptions)
    if (session?.user) {
      await logActivity({
        userId: session.user.id,
        action: 'DELETE',
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
