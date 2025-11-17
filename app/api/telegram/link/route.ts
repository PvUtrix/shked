import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateLinkToken, saveLinkToken } from '@/lib/telegram/commands'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'

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

    // Генерируем deep link URL для Telegram
    const encodedToken = Buffer.from(token).toString('base64')
    let deepLinkUrl: string | undefined

    if (env.TELEGRAM_BOT_USERNAME) {
      deepLinkUrl = `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${encodedToken}`
    }

    return NextResponse.json({
      token,
      deepLinkUrl,
      expiresIn: 15, // минут
      instructions: deepLinkUrl
        ? [
            '1. Нажмите на ссылку ниже для автоматической привязки',
            '2. Нажмите кнопку "Start" в Telegram боте',
            '3. Ваш аккаунт будет автоматически привязан'
          ]
        : [
            '1. Откройте Telegram бота',
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
        identifier: `telegram_link_${session.user.id}`,
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

    // Проверяем, есть ли уже привязанный Telegram аккаунт
    const existingTelegramUser = await prisma.telegramUser.findUnique({
      where: { userId: session.user.id }
    })

    if (existingTelegramUser) {
      return NextResponse.json({
        message: 'Telegram аккаунт уже привязан',
        telegramUser: {
          telegramId: existingTelegramUser.telegramId,
          username: existingTelegramUser.username,
          firstName: existingTelegramUser.firstName,
          lastName: existingTelegramUser.lastName,
          isActive: existingTelegramUser.isActive,
          notifications: existingTelegramUser.notifications,
          createdAt: existingTelegramUser.createdAt
        }
      })
    }

    return NextResponse.json({
      message: 'Токен действителен. Отправьте команду /link [токен] в Telegram боте для завершения привязки.',
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
