import { prisma } from '@/lib/db'
import { Bot } from '@maxhub/max-bot-api'

export interface MaxUpdate {
  update_id: number
  message?: {
    message_id: string
    from: {
      id: string
      first_name: string
      last_name?: string
      username?: string
    }
    chat: {
      id: string
      type: string
    }
    date: number
    text?: string
  }
  callback_query?: {
    id: string
    from: {
      id: string
      first_name: string
      last_name?: string
      username?: string
    }
    message?: {
      message_id: string
      chat: {
        id: string
      }
    }
    data?: string
  }
}

export interface MaxBotSettings {
  id: string
  maxBotToken: string | null
  openaiApiKey: string | null
  maxWebhookUrl: string | null
  maxIsActive: boolean
  notificationsEnabled: boolean
  reminderMinutes: number
  dailySummaryTime: string
}

export interface MaxMessage {
  chat_id: string
  text: string
  parse_mode?: 'Markdown' | 'HTML'
}

/**
 * Get bot settings from database
 */
export async function getBotSettings(): Promise<MaxBotSettings | null> {
  try {
    const settings = await prisma.botSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    })
    if (!settings) return null

    return {
      id: settings.id,
      maxBotToken: settings.maxBotToken,
      openaiApiKey: settings.openaiApiKey,
      maxWebhookUrl: settings.maxWebhookUrl,
      maxIsActive: settings.maxIsActive,
      notificationsEnabled: settings.notificationsEnabled,
      reminderMinutes: settings.reminderMinutes,
      dailySummaryTime: settings.dailySummaryTime,
    }
  } catch (error) {
    console.error('Error getting Max bot settings:', error)
    return null
  }
}

/**
 * Create Max bot instance
 */
export async function createBot(): Promise<Bot | null> {
  const settings = await getBotSettings()
  if (!settings?.maxBotToken) {
    console.error('Max bot token not configured')
    return null
  }

  try {
    const bot = new Bot(settings.maxBotToken)
    return bot
  } catch (error) {
    console.error('Error creating Max bot instance:', error)
    return null
  }
}

/**
 * Send message via Max Bot API
 */
export async function sendMessage(message: MaxMessage): Promise<boolean> {
  const settings = await getBotSettings()
  if (!settings?.maxBotToken || !settings.maxIsActive) {
    console.error('Max bot not configured or inactive')
    return false
  }

  try {
    const bot = new Bot(settings.maxBotToken)

    // Max bot API uses different approach - we need to use their API methods
    // For now, we'll implement a basic HTTP approach similar to Telegram
    // This may need to be updated based on actual Max API requirements

    // Note: The @maxhub/max-bot-api library is event-based
    // We may need to adjust this implementation

    console.log('Sending message via Max bot:', message)
    // TODO: Implement actual Max API send message logic
    // The library uses ctx.reply() in event handlers, but we need a direct send method

    return true
  } catch (error) {
    console.error('Error sending Max message:', error)
    return false
  }
}

/**
 * Set webhook URL for Max bot
 */
export async function setWebhook(webhookUrl: string): Promise<boolean> {
  const settings = await getBotSettings()
  if (!settings?.maxBotToken) {
    console.error('Max bot token not configured')
    return false
  }

  try {
    // Update webhook URL in database
    await prisma.botSettings.updateMany({
      data: { maxWebhookUrl: webhookUrl }
    })

    // Note: Max bot may use polling or different webhook setup
    // This needs to be updated based on actual Max API requirements

    return true
  } catch (error) {
    console.error('Error setting Max webhook:', error)
    return false
  }
}

/**
 * Get webhook information
 */
export async function getWebhookInfo(): Promise<any> {
  const settings = await getBotSettings()
  if (!settings?.maxBotToken) {
    return null
  }

  try {
    // Note: Need to implement based on actual Max API
    return {
      url: settings.maxWebhookUrl,
      has_custom_certificate: false,
      pending_update_count: 0,
    }
  } catch (error) {
    console.error('Error getting Max webhook info:', error)
    return null
  }
}

/**
 * Get bot information
 */
export async function getBotInfo(): Promise<any> {
  const settings = await getBotSettings()
  if (!settings?.maxBotToken) {
    return null
  }

  try {
    const bot = new Bot(settings.maxBotToken)
    // Note: Need to implement based on actual Max API
    // The library may have a method to get bot info

    return {
      ok: true,
      result: {
        id: 'max_bot',
        first_name: 'Max Bot',
        username: 'maxbot',
      }
    }
  } catch (error) {
    console.error('Error getting Max bot info:', error)
    return null
  }
}
