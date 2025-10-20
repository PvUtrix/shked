import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { setWebhook, getWebhookInfo, getBotInfo } from '@/lib/telegram/bot'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const settings = await prisma.botSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!settings) {
      return NextResponse.json({
        telegramBotToken: '',
        openaiApiKey: '',
        webhookUrl: '',
        isActive: false,
        notificationsEnabled: true,
        reminderMinutes: 30,
        dailySummaryTime: '07:00',
        webhookInfo: null,
        botInfo: null
      })
    }

    // Получаем дополнительную информацию о боте
    const webhookInfo = settings.telegramBotToken ? await getWebhookInfo() : null
    const botInfo = settings.telegramBotToken ? await getBotInfo() : null

    return NextResponse.json({
      telegramBotToken: settings.telegramBotToken || '',
      openaiApiKey: settings.openaiApiKey || '',
      webhookUrl: settings.webhookUrl || '',
      isActive: settings.isActive,
      notificationsEnabled: settings.notificationsEnabled,
      reminderMinutes: settings.reminderMinutes,
      dailySummaryTime: settings.dailySummaryTime,
      webhookInfo,
      botInfo
    })
  } catch (error) {
    console.error('Ошибка при получении настроек бота:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const {
      telegramBotToken,
      openaiApiKey,
      isActive,
      notificationsEnabled,
      reminderMinutes,
      dailySummaryTime
    } = body

    // Валидация токена бота
    if (telegramBotToken && !/^\d+:[A-Za-z0-9_-]+$/.test(telegramBotToken)) {
      return NextResponse.json(
        { error: 'Неверный формат токена бота. Ожидается формат: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz' },
        { status: 400 }
      )
    }

    if (reminderMinutes && (reminderMinutes < 5 || reminderMinutes > 120)) {
      return NextResponse.json(
        { error: 'Время напоминания должно быть от 5 до 120 минут' },
        { status: 400 }
      )
    }

    if (dailySummaryTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dailySummaryTime)) {
      return NextResponse.json(
        { error: 'Неверный формат времени (HH:MM)' },
        { status: 400 }
      )
    }

    // Получаем базовый URL для webhook
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const webhookUrl = `${baseUrl}/api/telegram/webhook`

    // Создаем или обновляем настройки
    const settings = await prisma.botSettings.upsert({
      where: { id: 'default' },
      update: {
        telegramBotToken: telegramBotToken || undefined,
        openaiApiKey: openaiApiKey || undefined,
        webhookUrl,
        isActive: isActive ?? false,
        notificationsEnabled: notificationsEnabled ?? true,
        reminderMinutes: reminderMinutes ?? 30,
        dailySummaryTime: dailySummaryTime || '07:00'
      },
      create: {
        id: 'default',
        telegramBotToken: telegramBotToken || undefined,
        openaiApiKey: openaiApiKey || undefined,
        webhookUrl,
        isActive: isActive ?? false,
        notificationsEnabled: notificationsEnabled ?? true,
        reminderMinutes: reminderMinutes ?? 30,
        dailySummaryTime: dailySummaryTime || '07:00'
      }
    })

    // Если токен бота указан, устанавливаем webhook
    if (telegramBotToken && isActive) {
      const webhookSuccess = await setWebhook(webhookUrl)
      if (!webhookSuccess) {
        console.warn('Не удалось установить webhook')
      }
    }

    return NextResponse.json({
      message: 'Настройки сохранены',
      settings: {
        id: settings.id,
        isActive: settings.isActive,
        webhookUrl: settings.webhookUrl
      }
    })
  } catch (error) {
    console.error('Ошибка при сохранении настроек бота:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
