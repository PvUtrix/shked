import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/homework/[id]/submissions/[submissionId]/comments - получение всех комментариев
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверяем существование submission
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: params.submissionId },
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

    // Проверка прав доступа
    const canView = 
      session.user.role === 'admin' ||
      (session.user.role === 'lector' && submission.homework.subject?.lectorId === session.user.id) ||
      (session.user.role === 'mentor' && submission.homework.groupId === session.user.groupId) ||
      (session.user.role === 'student' && submission.userId === session.user.id)

    if (!canView) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Получаем все комментарии
    const comments = await prisma.homeworkComment.findMany({
      where: { submissionId: params.submissionId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ comments })

  } catch (error) {
    console.error('Ошибка при получении комментариев:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/homework/[id]/submissions/[submissionId]/comments - создание комментария
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { content, startOffset, endOffset, selectedText } = body

    // Валидация
    if (!content || startOffset === undefined || endOffset === undefined || !selectedText) {
      return NextResponse.json(
        { error: 'Необходимо указать все поля комментария' },
        { status: 400 }
      )
    }

    // Проверяем существование submission
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: params.submissionId },
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

    // Только лекторы и админы могут создавать комментарии
    const canComment = 
      session.user.role === 'admin' ||
      (session.user.role === 'lector' && submission.homework.subject?.lectorId === session.user.id)

    if (!canComment) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только лекторы и администраторы могут оставлять комментарии.' },
        { status: 403 }
      )
    }

    // Создаем комментарий
    const comment = await prisma.homeworkComment.create({
      data: {
        submissionId: params.submissionId,
        authorId: session.user.id,
        content,
        startOffset,
        endOffset,
        selectedText
      },
      include: {
        author: {
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

    return NextResponse.json(comment, { status: 201 })

  } catch (error) {
    console.error('Ошибка при создании комментария:', error)
    console.error('Детали ошибки:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack')
    
    // Если это ошибка Prisma о несуществующей таблице
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('relation') || errorMessage.includes('table') || errorMessage.includes('homework_comments')) {
      return NextResponse.json(
        { error: 'Таблица комментариев не найдена. Необходимо применить миграцию базы данных.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: errorMessage },
      { status: 500 }
    )
  }
}

