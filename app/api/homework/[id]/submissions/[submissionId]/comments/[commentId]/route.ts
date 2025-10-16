import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PUT /api/homework/[id]/submissions/[submissionId]/comments/[commentId] - обновление комментария
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; submissionId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { content, resolved } = body

    // Получаем комментарий
    const comment = await prisma.homeworkComment.findUnique({
      where: { id: params.commentId }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Комментарий не найден' },
        { status: 404 }
      )
    }

    // Только автор комментария или админ могут редактировать
    if (comment.authorId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Обновляем комментарий
    const updatedComment = await prisma.homeworkComment.update({
      where: { id: params.commentId },
      data: {
        ...(content !== undefined && { content }),
        ...(resolved !== undefined && { resolved })
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

    return NextResponse.json(updatedComment)

  } catch (error) {
    console.error('Ошибка при обновлении комментария:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/homework/[id]/submissions/[submissionId]/comments/[commentId] - удаление комментария
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; submissionId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Получаем комментарий
    const comment = await prisma.homeworkComment.findUnique({
      where: { id: params.commentId }
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Комментарий не найден' },
        { status: 404 }
      )
    }

    // Только автор комментария или админ могут удалять
    if (comment.authorId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Удаляем комментарий
    await prisma.homeworkComment.delete({
      where: { id: params.commentId }
    })

    return NextResponse.json({ message: 'Комментарий удален' })

  } catch (error) {
    console.error('Ошибка при удалении комментария:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

