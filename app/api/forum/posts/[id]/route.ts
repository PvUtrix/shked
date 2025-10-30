import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH /api/forum/posts/[id] - Редактировать пост
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const post = await prisma.forumPost.findUnique({
      where: { id: params.id }
    })

    if (!post) {
      return NextResponse.json({ error: 'Пост не найден' }, { status: 404 })
    }

    // Проверка прав (только автор или admin могут редактировать)
    const canEdit = 
      session.user.role === 'admin' ||
      post.authorId === session.user.id

    if (!canEdit) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Содержимое поста не может быть пустым' },
        { status: 400 }
      )
    }

    const updated = await prisma.forumPost.update({
      where: { id: params.id },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Ошибка при редактировании поста:', error)
    return NextResponse.json(
      { error: 'Не удалось редактировать пост' },
      { status: 500 }
    )
  }
}

// DELETE /api/forum/posts/[id] - Удалить пост
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const post = await prisma.forumPost.findUnique({
      where: { id: params.id }
    })

    if (!post) {
      return NextResponse.json({ error: 'Пост не найден' }, { status: 404 })
    }

    // Проверка прав (только автор или admin могут удалять)
    const canDelete = 
      session.user.role === 'admin' ||
      post.authorId === session.user.id

    if (!canDelete) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    await prisma.forumPost.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Пост удален' })
  } catch (error) {
    console.error('Ошибка при удалении поста:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить пост' },
      { status: 500 }
    )
  }
}


