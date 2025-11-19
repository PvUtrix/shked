import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateLinkToken, saveLinkToken } from '@/lib/max/commands'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const userId = session.user.id
    const token = generateLinkToken()
    
    // Сохраняем токен в БД
    await saveLinkToken(userId, token)

    return NextResponse.json({
      token,
      expiresIn: 15, // минут
      instructions: [
        '1. Откройте Max бота',
        '2. Отправьте команду /link',
        '3. Введите полученный токен',
        '4. Ваш аккаунт будет привязан'
      ]
    })
  } catch (error) {
    console.error('Ошибка при генерации токена привязки:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Токен не указан' },
        { status: 400 }
      )
    }

    // Проверяем токен
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: `max_link_${session.user.id}`,
        token: token,
        expires: {
          gt: new Date()
        }
      }
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Неверный или истекший токен' },
        { status: 400 }
      )
    }

    // Проверяем, есть ли уже привязанный Max аккаунт
    const existingMaxUser = await prisma.maxUser.findUnique({
      where: { userId: session.user.id }
    })

    if (existingMaxUser) {
      return NextResponse.json({
        message: 'Max аккаунт уже привязан',
        maxUser: {
          maxId: existingMaxUser.maxId,
          username: existingMaxUser.username,
          firstName: existingMaxUser.firstName,
          lastName: existingMaxUser.lastName,
          isActive: existingMaxUser.isActive,
          notifications: existingMaxUser.notifications,
          createdAt: existingMaxUser.createdAt
        }
      })
    }

    return NextResponse.json({
      message: 'Токен действителен. Отправьте команду /link [токен] в Max боте для завершения привязки.',
      token: token,
      expiresAt: verificationToken.expires
    })
  } catch (error) {
    console.error('Ошибка при проверке токена привязки:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
