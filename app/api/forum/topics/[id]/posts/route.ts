import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/forum/topics/[id]/posts - Создать пост в топике
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверка существования топика
    const topic = await prisma.forumTopic.findUnique({
      where: { id: params.id }
    })

    if (!topic) {
      return NextResponse.json({ error: 'Топик не найден' }, { status: 404 })
    }

    // Проверка, не закрыт ли топик
    if (topic.isClosed && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Топик закрыт для обсуждения' }, { status: 403 })
    }

    const body = await request.json()
    const { content } = body

    // Валидация
    if (!content) {
      return NextResponse.json(
        { error: 'Содержимое поста не может быть пустым' },
        { status: 400 }
      )
    }

    // Создание поста
    const post = await prisma.forumPost.create({
      data: {
        topicId: params.id,
        authorId: session.user.id,
        content
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

    // Обновление updatedAt топика
    await prisma.forumTopic.update({
      where: { id: params.id },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Ошибка при создании поста:', error)
    return NextResponse.json(
      { error: 'Не удалось создать пост' },
      { status: 500 }
    )
  }
}


