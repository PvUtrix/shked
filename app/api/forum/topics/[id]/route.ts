import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/forum/topics/[id] - Получить топик с постами
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const topic = await prisma.forumTopic.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        },
        posts: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!topic) {
      return NextResponse.json({ error: 'Топик не найден' }, { status: 404 })
    }

    return NextResponse.json(topic)
  } catch (error) {
    console.error('Ошибка при получении топика:', error)
    return NextResponse.json(
      { error: 'Не удалось получить топик' },
      { status: 500 }
    )
  }
}

// PATCH /api/forum/topics/[id] - Обновить топик
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const topic = await prisma.forumTopic.findUnique({
      where: { id: params.id }
    })

    if (!topic) {
      return NextResponse.json({ error: 'Топик не найден' }, { status: 404 })
    }

    // Проверка прав (только автор или admin может редактировать)
    const canEdit = 
      session.user.role === 'admin' ||
      topic.authorId === session.user.id

    if (!canEdit) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, isPinned, isClosed } = body

    const updated = await prisma.forumTopic.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(isPinned !== undefined && { isPinned }),
        ...(isClosed !== undefined && { isClosed })
      },
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
    console.error('Ошибка при обновлении топика:', error)
    return NextResponse.json(
      { error: 'Не удалось обновить топик' },
      { status: 500 }
    )
  }
}

// DELETE /api/forum/topics/[id] - Удалить топик
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const topic = await prisma.forumTopic.findUnique({
      where: { id: params.id }
    })

    if (!topic) {
      return NextResponse.json({ error: 'Топик не найден' }, { status: 404 })
    }

    // Проверка прав (только автор или admin могут удалять)
    const canDelete = 
      session.user.role === 'admin' ||
      topic.authorId === session.user.id

    if (!canDelete) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    await prisma.forumTopic.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Топик удален' })
  } catch (error) {
    console.error('Ошибка при удалении топика:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить топик' },
      { status: 500 }
    )
  }
}


