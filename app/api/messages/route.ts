import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Схема валидации для отправки сообщения
const sendMessageSchema = z.object({
  receiverId: z.string().min(1, 'Получатель обязателен'),
  content: z.string().min(1, 'Содержимое сообщения обязательно'),
})

// GET /api/messages - Получить список диалогов или сообщений с конкретным пользователем
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const otherUserId = searchParams.get('userId')

    if (otherUserId) {
      // Получить сообщения с конкретным пользователем
      const messages = await prisma.directMessage.findMany({
        where: {
          OR: [
            { senderId: user.id, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: user.id },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              middleName: true,
              email: true,
              image: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              middleName: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

      // Отметить непрочитанные сообщения как прочитанные
      await prisma.directMessage.updateMany({
        where: {
          senderId: otherUserId,
          receiverId: user.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({ messages })
    }

    // Получить список диалогов (последнее сообщение с каждым пользователем)
    const sentMessages = await prisma.directMessage.findMany({
      where: { senderId: user.id },
      distinct: ['receiverId'],
      orderBy: { createdAt: 'desc' },
      include: {
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    })

    const receivedMessages = await prisma.directMessage.findMany({
      where: { receiverId: user.id },
      distinct: ['senderId'],
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    })

    // Объединить и удалить дубликаты
    const allContacts = new Map()

    sentMessages.forEach((msg) => {
      if (!allContacts.has(msg.receiverId)) {
        allContacts.set(msg.receiverId, {
          user: msg.receiver,
          lastMessage: msg,
          unreadCount: 0,
        })
      }
    })

    for (const msg of receivedMessages) {
      if (!allContacts.has(msg.senderId)) {
        // Подсчитать непрочитанные сообщения
        const unreadCount = await prisma.directMessage.count({
          where: {
            senderId: msg.senderId,
            receiverId: user.id,
            isRead: false,
          },
        })

        allContacts.set(msg.senderId, {
          user: msg.sender,
          lastMessage: msg,
          unreadCount,
        })
      }
    }

    const conversations = Array.from(allContacts.values()).sort((a, b) => {
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Ошибка при получении сообщений:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении сообщений' },
      { status: 500 }
    )
  }
}

// POST /api/messages - Отправить сообщение
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = sendMessageSchema.parse(body)

    // Проверить, что получатель существует
    const receiver = await prisma.user.findUnique({
      where: { id: validatedData.receiverId },
    })

    if (!receiver) {
      return NextResponse.json({ error: 'Получатель не найден' }, { status: 404 })
    }

    // Нельзя отправить сообщение самому себе
    if (user.id === validatedData.receiverId) {
      return NextResponse.json(
        { error: 'Нельзя отправить сообщение самому себе' },
        { status: 400 }
      )
    }

    // Создать сообщение
    const message = await prisma.directMessage.create({
      data: {
        senderId: user.id,
        receiverId: validatedData.receiverId,
        content: validatedData.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Ошибка при отправке сообщения:', error)
    return NextResponse.json(
      { error: 'Ошибка при отправке сообщения' },
      { status: 500 }
    )
  }
}
