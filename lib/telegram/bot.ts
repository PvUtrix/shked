import { prisma } from '@/lib/db'
import crypto from 'crypto'

export interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      last_name?: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    date: number
    text?: string
  }
  callback_query?: {
    id: string
    from: {
      id: number
      is_bot: boolean
      first_name: string
      last_name?: string
      username?: string
    }
    message?: {
      message_id: number
      chat: {
        id: number
        type: string
      }
    }
    data?: string
  }
}

export interface BotSettings {
  id: string
  telegramBotToken: string | null
  openaiApiKey: string | null
  webhookUrl: string | null
  isActive: boolean
  notificationsEnabled: boolean
  reminderMinutes: number
  dailySummaryTime: string
}

export interface TelegramMessage {
  chat_id: number
  text: string
  parse_mode?: 'Markdown' | 'HTML'
  reply_markup?: {
    inline_keyboard?: Array<Array<{
      text: string
      callback_data: string
    }>>
  }
}

export interface TelegramEditMessage {
  chat_id: number
  message_id: number
  text: string
  parse_mode?: 'Markdown' | 'HTML'
  reply_markup?: {
    inline_keyboard?: Array<Array<{
      text: string
      callback_data: string
    }>>
  }
}

export interface TelegramCallbackAnswer {
  callback_query_id: string
  text?: string
  show_alert?: boolean
}

/**
 * Получить настройки бота из базы данных
 */
export async function getBotSettings(): Promise<BotSettings | null> {
  try {
    const settings = await prisma.botSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    })
    return settings
  } catch (error) {
    console.error('Ошибка при получении настроек бота:', error)
    return null
  }
}

/**
 * Проверить подпись webhook от Telegram
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secretToken: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secretToken)
    .update(body)
    .digest('hex')
  
  return signature === `sha256=${expectedSignature}`
}

/**
 * Отправить сообщение через Telegram Bot API
 */
export async function sendMessage(message: TelegramMessage): Promise<boolean> {
  const settings = await getBotSettings()
  if (!settings?.telegramBotToken || !settings.isActive) {
    console.error('Бот не настроен или неактивен')
    return false
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Ошибка отправки сообщения:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error)
    return false
  }
}

/**
 * Редактировать сообщение
 */
export async function editMessage(editMessage: TelegramEditMessage): Promise<boolean> {
  const settings = await getBotSettings()
  if (!settings?.telegramBotToken || !settings.isActive) {
    console.error('Бот не настроен или неактивен')
    return false
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/editMessageText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editMessage)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Ошибка редактирования сообщения:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Ошибка при редактировании сообщения:', error)
    return false
  }
}

/**
 * Ответить на callback query
 */
export async function answerCallbackQuery(answer: TelegramCallbackAnswer): Promise<boolean> {
  const settings = await getBotSettings()
  if (!settings?.telegramBotToken || !settings.isActive) {
    console.error('Бот не настроен или неактивен')
    return false
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(answer)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Ошибка ответа на callback:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Ошибка при ответе на callback:', error)
    return false
  }
}

/**
 * Установить webhook URL
 */
export async function setWebhook(webhookUrl: string): Promise<boolean> {
  const settings = await getBotSettings()
  if (!settings?.telegramBotToken) {
    console.error('Токен бота не настроен')
    return false
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query']
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Ошибка установки webhook:', error)
      return false
    }

    // Обновить URL в базе данных
    await prisma.botSettings.updateMany({
      data: { webhookUrl }
    })

    return true
  } catch (error) {
    console.error('Ошибка при установке webhook:', error)
    return false
  }
}

/**
 * Получить информацию о webhook
 */
export async function getWebhookInfo(): Promise<any> {
  const settings = await getBotSettings()
  if (!settings?.telegramBotToken) {
    return null
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/getWebhookInfo`)
    return await response.json()
  } catch (error) {
    console.error('Ошибка при получении информации о webhook:', error)
    return null
  }
}

/**
 * Получить информацию о боте
 */
export async function getBotInfo(): Promise<any> {
  const settings = await getBotSettings()
  if (!settings?.telegramBotToken) {
    return null
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/getMe`)
    return await response.json()
  } catch (error) {
    console.error('Ошибка при получении информации о боте:', error)
    return null
  }
}
