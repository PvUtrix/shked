import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/homework/[id]/submissions/[submissionId] - получение конкретной сдачи
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Только админы могут просматривать сдачи
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: params.submissionId },
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

    if (!submission) {
      return NextResponse.json(
        { error: 'Сдача не найдена' },
        { status: 404 }
      )
    }

    // Проверяем, что сдача принадлежит указанному домашнему заданию
    if (submission.homeworkId !== params.id) {
      return NextResponse.json(
        { error: 'Сдача не принадлежит указанному заданию' },
        { status: 400 }
      )
    }

    return NextResponse.json(submission)

  } catch (error) {
    console.error('Ошибка при получении сдачи:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
