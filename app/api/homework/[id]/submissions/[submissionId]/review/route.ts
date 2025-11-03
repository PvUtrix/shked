import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logActivity } from '@/lib/activity-log'

// POST /api/homework/[id]/submissions/[submissionId]/review - проверка работы студента
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const { id, submissionId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { grade, comment, feedback, status } = body

    // Получаем работу студента с информацией о домашнем задании
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      include: {
        homework: {
          include: {
            subject: {
              select: {
                lectorId: true
              }
            }
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      )
    }

    // Проверяем, что работа принадлежит указанному домашнему заданию
    if (submission.homeworkId !== id) {
      return NextResponse.json(
        { error: 'Работа не принадлежит указанному заданию' },
        { status: 400 }
      )
    }

    // Проверка прав доступа: только админы и лекторы могут проверять
    if (session.user.role === 'admin') {
      // Админы имеют полный доступ
    } else if (session.user.role === 'lector') {
      // Лекторы могут проверять работы только по своим предметам
      if (submission.homework.subject?.lectorId !== session.user.id) {
        return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Доступ запрещен. Только лекторы и администраторы могут проверять работы.' }, { status: 403 })
    }

    // Обновляем работу
    const updatedSubmission = await prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        grade: grade || null,
        comment: comment || null,
        feedback: feedback || null,
        status: status || 'REVIEWED'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        homework: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Логируем проверку работы
    await logActivity({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'HomeworkSubmission',
      entityId: updatedSubmission.id,
      request,
      details: {
        before: {
          id: submission.id,
          homeworkId: submission.homeworkId,
          grade: submission.grade,
          status: submission.status
        },
        after: {
          id: updatedSubmission.id,
          homeworkId: updatedSubmission.homeworkId,
          homeworkTitle: updatedSubmission.homework.title,
          grade: updatedSubmission.grade,
          status: updatedSubmission.status,
          hasComment: !!updatedSubmission.comment,
          hasFeedback: !!updatedSubmission.feedback,
          studentId: updatedSubmission.userId
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json(updatedSubmission)

  } catch (error) {
    console.error('Ошибка при проверке работы:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

