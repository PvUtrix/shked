import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/messages/unread - Получить количество непрочитанных сообщений
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

    const unreadCount = await prisma.directMessage.count({
      where: {
        receiverId: user.id,
        isRead: false,
      },
    })

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error('Ошибка при получении непрочитанных сообщений:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении непрочитанных сообщений' },
      { status: 500 }
    )
  }
}
