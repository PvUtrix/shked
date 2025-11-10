import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { setWebhook, getWebhookInfo, getBotInfo } from '@/lib/max/bot'
import { logActivity } from '@/lib/activity-log'

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
        maxBotToken: '',
        openaiApiKey: '',
        maxWebhookUrl: '',
        maxIsActive: false,
        notificationsEnabled: true,
        reminderMinutes: 30,
        dailySummaryTime: '07:00',
        webhookInfo: null,
        botInfo: null
      })
    }

    // Get additional bot info
    const webhookInfo = settings.maxBotToken ? await getWebhookInfo() : null
    const botInfo = settings.maxBotToken ? await getBotInfo() : null

    return NextResponse.json({
      maxBotToken: settings.maxBotToken || '',
      openaiApiKey: settings.openaiApiKey || '',
      maxWebhookUrl: settings.maxWebhookUrl || '',
      maxIsActive: settings.maxIsActive,
      notificationsEnabled: settings.notificationsEnabled,
      reminderMinutes: settings.reminderMinutes,
      dailySummaryTime: settings.dailySummaryTime,
      webhookInfo,
      botInfo
    })
  } catch (error) {
    console.error('Error getting Max bot settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
      maxBotToken,
      openaiApiKey,
      maxIsActive,
      notificationsEnabled,
      reminderMinutes,
      dailySummaryTime
    } = body

    // Validate reminder minutes
    if (reminderMinutes && (reminderMinutes < 5 || reminderMinutes > 120)) {
      return NextResponse.json(
        { error: 'Время напоминания должно быть от 5 до 120 минут' },
        { status: 400 }
      )
    }

    // Validate daily summary time
    if (dailySummaryTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dailySummaryTime)) {
      return NextResponse.json(
        { error: 'Неверный формат времени (HH:MM)' },
        { status: 400 }
      )
    }

    // Get base URL for webhook
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const maxWebhookUrl = `${baseUrl}/api/max/webhook`

    // Get old settings for logging
    const oldSettings = await prisma.botSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    // Create or update settings
    const settings = await prisma.botSettings.upsert({
      where: { id: oldSettings?.id || 'default' },
      update: {
        maxBotToken: maxBotToken || undefined,
        openaiApiKey: openaiApiKey || undefined,
        maxWebhookUrl,
        maxIsActive: maxIsActive ?? false,
        notificationsEnabled: notificationsEnabled ?? true,
        reminderMinutes: reminderMinutes ?? 30,
        dailySummaryTime: dailySummaryTime || '07:00'
      },
      create: {
        id: 'default',
        maxBotToken: maxBotToken || undefined,
        openaiApiKey: openaiApiKey || undefined,
        maxWebhookUrl,
        maxIsActive: maxIsActive ?? false,
        notificationsEnabled: notificationsEnabled ?? true,
        reminderMinutes: reminderMinutes ?? 30,
        dailySummaryTime: dailySummaryTime || '07:00'
      }
    })

    // Set webhook if bot token is provided and bot is active
    if (maxBotToken && maxIsActive) {
      const webhookSuccess = await setWebhook(maxWebhookUrl)
      if (!webhookSuccess) {
        console.warn('Failed to set Max webhook')
      }
    }

    // Log settings change
    await logActivity({
      userId: session.user.id,
      action: 'SETTINGS_CHANGE',
      entityType: 'BotSettings',
      entityId: settings.id,
      request,
      details: {
        before: oldSettings ? {
          maxIsActive: oldSettings.maxIsActive,
          notificationsEnabled: oldSettings.notificationsEnabled,
          reminderMinutes: oldSettings.reminderMinutes,
          dailySummaryTime: oldSettings.dailySummaryTime
        } : undefined,
        after: {
          maxIsActive: settings.maxIsActive,
          notificationsEnabled: settings.notificationsEnabled,
          reminderMinutes: settings.reminderMinutes,
          dailySummaryTime: settings.dailySummaryTime
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json({
      message: 'Настройки сохранены',
      settings: {
        id: settings.id,
        maxIsActive: settings.maxIsActive,
        maxWebhookUrl: settings.maxWebhookUrl
      }
    })
  } catch (error) {
    console.error('Error saving Max bot settings:', error)

    // Log error
    const session = await getServerSession(authOptions)
    if (session?.user) {
      await logActivity({
        userId: session.user.id,
        action: 'SETTINGS_CHANGE',
        entityType: 'BotSettings',
        request,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        result: 'FAILURE'
      })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
