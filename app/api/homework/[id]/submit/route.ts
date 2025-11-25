import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { HomeworkSubmissionFormData } from '@/lib/types'
import { logActivity } from '@/lib/activity-log'

// POST /api/homework/[id]/submit - сдача домашнего задания
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: homeworkId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body: HomeworkSubmissionFormData = await request.json()

    // Проверяем, что есть либо контент, либо ссылка
    if (!body.content && !body.submissionUrl) {
      return NextResponse.json(
        { error: 'Необходимо указать контент задания или ссылку на выполненное задание' },
        { status: 400 }
      )
    }

    // Проверка существования домашнего задания
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: { group: true }
    })

    if (!homework) {
      return NextResponse.json(
        { error: 'Домашнее задание не найдено' },
        { status: 404 }
      )
    }

    // Проверка, что студент принадлежит к группе задания
    if (homework.groupId && homework.groupId !== session.user.groupId) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Проверка, что дедлайн не истек
    if (new Date() > homework.deadline) {
      return NextResponse.json(
        { error: 'Дедлайн истек' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли уже работа
    const existingSubmission = await prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_userId: {
          homeworkId: homeworkId,
          userId: session.user.id
        }
      }
    })

    // Создание или обновление работы студента
    const submission = await prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_userId: {
          homeworkId: homeworkId,
          userId: session.user.id
        }
      },
      update: {
        content: body.content,  // MDX контент
        submissionUrl: body.submissionUrl,
        status: 'SUBMITTED',
        submittedAt: new Date()
      },
      create: {
        homeworkId: homeworkId,
        userId: session.user.id,
        content: body.content,  // MDX контент
        submissionUrl: body.submissionUrl,
        status: 'SUBMITTED',
        submittedAt: new Date()
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

    // Логируем сдачу домашнего задания
    await logActivity({
      userId: session.user.id,
      action: existingSubmission ? 'UPDATE' : 'CREATE',
      entityType: 'HomeworkSubmission',
      entityId: submission.id,
      request,
      details: {
        before: existingSubmission ? {
          id: existingSubmission.id,
          homeworkId: existingSubmission.homeworkId,
          status: existingSubmission.status,
          submittedAt: existingSubmission.submittedAt?.toISOString()
        } : undefined,
        after: {
          id: submission.id,
          homeworkId: submission.homeworkId,
          homeworkTitle: submission.homework.title,
          status: submission.status,
          submittedAt: submission.submittedAt?.toISOString(),
          hasContent: !!submission.content,
          hasUrl: !!submission.submissionUrl
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json(submission, { status: 201 })

  } catch (error) {
    console.error('Ошибка при сдаче домашнего задания:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/homework/[id]/submit - обновление сданного задания
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: homeworkId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body: HomeworkSubmissionFormData = await request.json()
    
    // Проверяем, что есть либо контент, либо ссылка
    if (!body.content && !body.submissionUrl) {
      return NextResponse.json(
        { error: 'Необходимо указать контент задания или ссылку на выполненное задание' },
        { status: 400 }
      )
    }

    // Проверка существования работы студента
    const existingSubmission = await prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_userId: {
          homeworkId: homeworkId,
          userId: session.user.id
        }
      },
      include: {
        homework: true
      }
    })

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      )
    }

    // Проверка, что дедлайн не истек
    if (new Date() > existingSubmission.homework.deadline) {
      return NextResponse.json(
        { error: 'Дедлайн истек' },
        { status: 400 }
      )
    }

    // Обновление работы студента
    const submission = await prisma.homeworkSubmission.update({
      where: {
        homeworkId_userId: {
          homeworkId: homeworkId,
          userId: session.user.id
        }
      },
      data: {
        content: body.content,  // MDX контент
        submissionUrl: body.submissionUrl,
        submittedAt: new Date()
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

    // Логируем обновление работы
    await logActivity({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'HomeworkSubmission',
      entityId: submission.id,
      request,
      details: {
        before: {
          id: existingSubmission.id,
          homeworkId: existingSubmission.homeworkId,
          status: existingSubmission.status,
          submittedAt: existingSubmission.submittedAt?.toISOString()
        },
        after: {
          id: submission.id,
          homeworkId: submission.homeworkId,
          homeworkTitle: submission.homework.title,
          status: submission.status,
          submittedAt: submission.submittedAt?.toISOString(),
          hasContent: !!submission.content,
          hasUrl: !!submission.submissionUrl
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json(submission)

  } catch (error) {
    console.error('Ошибка при обновлении работы:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
