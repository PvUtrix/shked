import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/homework/[id]/submissions/[submissionId] - получение конкретной работы студента
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const { id, submissionId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        content: true,
        submissionUrl: true,
        submittedAt: true,
        status: true,
        grade: true,
        comment: true,
        feedback: true,
        homeworkId: true,
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
            title: true,
            subjectId: true,
            groupId: true,
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

    // Проверка прав доступа: админы, лекторы своих предметов, менторы своих групп
    if (session.user.role === 'admin') {
      // Админы имеют полный доступ
    } else if (session.user.role === 'lector') {
      // Лекторы могут просматривать работы по своим предметам
      if (submission.homework.subject?.lectorId !== session.user.id) {
        return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
      }
    } else if (session.user.role === 'mentor') {
      // Менторы могут просматривать работы своих групп
      if (submission.homework.groupId !== session.user.groupId) {
        return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    return NextResponse.json(submission)

  } catch (error) {
    console.error('Ошибка при получении работы:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
