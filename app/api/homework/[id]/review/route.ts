import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { HomeworkReviewFormData } from '@/lib/types'

// PUT /api/homework/[id]/review - проверка и оценка домашнего задания
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body: HomeworkReviewFormData & { userId: string } = await request.json()
    
    if (!body.userId) {
      return NextResponse.json(
        { error: 'ID студента обязателен' },
        { status: 400 }
      )
    }

    // Проверка существования работы студента
    const existingSubmission = await prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_userId: {
          homeworkId: params.id,
          userId: body.userId
        }
      },
      include: {
        homework: true,
        user: {
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

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      )
    }

    // Валидация оценки
    if (body.grade !== undefined && (body.grade < 1 || body.grade > 5)) {
      return NextResponse.json(
        { error: 'Оценка должна быть от 1 до 5' },
        { status: 400 }
      )
    }

    // Обновление работы студента
    const submission = await prisma.homeworkSubmission.update({
      where: {
        homeworkId_userId: {
          homeworkId: params.id,
          userId: body.userId
        }
      },
      data: {
        status: 'REVIEWED',
        grade: body.grade,
        comment: body.comment,  // Комментарий преподавателя (MDX)
        feedback: body.feedback,  // Развернутая обратная связь (MDX)
        reviewedAt: new Date()
      },
      include: {
        homework: {
          include: {
            subject: true,
            group: true
          }
        },
        user: {
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

    return NextResponse.json(submission)

  } catch (error) {
    console.error('Ошибка при проверке домашнего задания:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
