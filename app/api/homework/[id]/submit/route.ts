import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { HomeworkSubmissionFormData } from '@/lib/types'

// POST /api/homework/[id]/submit - сдача домашнего задания
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body: HomeworkSubmissionFormData = await request.json()
    
    if (!body.submissionUrl) {
      return NextResponse.json(
        { error: 'Ссылка на выполненное задание обязательна' },
        { status: 400 }
      )
    }

    // Проверка существования домашнего задания
    const homework = await prisma.homework.findUnique({
      where: { id: params.id },
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

    // Создание или обновление сдачи
    const submission = await prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_userId: {
          homeworkId: params.id,
          userId: session.user.id
        }
      },
      update: {
        submissionUrl: body.submissionUrl,
        status: 'SUBMITTED',
        submittedAt: new Date()
      },
      create: {
        homeworkId: params.id,
        userId: session.user.id,
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body: HomeworkSubmissionFormData = await request.json()
    
    if (!body.submissionUrl) {
      return NextResponse.json(
        { error: 'Ссылка на выполненное задание обязательна' },
        { status: 400 }
      )
    }

    // Проверка существования сдачи
    const existingSubmission = await prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_userId: {
          homeworkId: params.id,
          userId: session.user.id
        }
      },
      include: {
        homework: true
      }
    })

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'Сдача не найдена' },
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

    // Обновление сдачи
    const submission = await prisma.homeworkSubmission.update({
      where: {
        homeworkId_userId: {
          homeworkId: params.id,
          userId: session.user.id
        }
      },
      data: {
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

    return NextResponse.json(submission)

  } catch (error) {
    console.error('Ошибка при обновлении сдачи:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
