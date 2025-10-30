import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/forum/topics - Получить список топиков
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const groupId = searchParams.get('groupId')

    const where: any = {}
    
    if (subjectId) where.subjectId = subjectId
    if (groupId) where.groupId = groupId

    const topics = await prisma.forumTopic.findMany({
      where,
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
        _count: {
          select: {
            posts: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' }
      ]
    })

    return NextResponse.json(topics)
  } catch (error) {
    console.error('Ошибка при получении топиков:', error)
    return NextResponse.json(
      { error: 'Не удалось получить топики' },
      { status: 500 }
    )
  }
}

// POST /api/forum/topics - Создать топик
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { subjectId, groupId, title, content } = body

    // Валидация
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Не все обязательные поля заполнены' },
        { status: 400 }
      )
    }

    // Создание топика
    const topic = await prisma.forumTopic.create({
      data: {
        subjectId: subjectId || null,
        groupId: groupId || null,
        authorId: session.user.id,
        title,
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
        }
      }
    })

    return NextResponse.json(topic, { status: 201 })
  } catch (error) {
    console.error('Ошибка при создании топика:', error)
    return NextResponse.json(
      { error: 'Не удалось создать топик' },
      { status: 500 }
    )
  }
}


