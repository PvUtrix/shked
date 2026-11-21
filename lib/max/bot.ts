import { prisma } from '@/lib/db'
import { resolveSecret } from '@/lib/bot-secrets'
import { webhookSecret } from '@/lib/bot/webhook-secret'

/**
 * MAX Bot API transport, per https://dev.max.ru/docs-api (read 2026-11-21):
 * requests go to platform-api2.max.ru with the token in the Authorization
 * header (query-string tokens are no longer accepted), webhooks are
 * registered with POST /subscriptions and come back with the secret in the
 * X-Max-Bot-Api-Secret header.
 */

const MAX_API_URL = process.env.MAX_API_URL || 'https://platform-api2.max.ru'

/** The part of a MAX update this app reads (see the Update object docs). */
export interface MaxUpdate {
  update_type: string
  timestamp?: number
  /** message_created */
  message?: {
    sender?: { user_id: number; first_name?: string; last_name?: string | null; username?: string | null; name?: string }
    recipient: { chat_id?: number | null; user_id?: number | null; chat_type?: string }
    body?: { mid?: string; text?: string | null } | null
  }
  /** bot_started */
  chat_id?: number
  user?: { user_id: number; first_name?: string; last_name?: string | null; username?: string | null; name?: string }
  payload?: string | null
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

export async function getBotSettings(): Promise<MaxBotSettings | null> {
  try {
    const settings = await prisma.botSettings.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!settings) return null
    return {
      id: settings.id,
      maxBotToken: resolveSecret('maxBotToken', settings.maxBotToken),
      openaiApiKey: resolveSecret('llmApiKey', settings.openaiApiKey),
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

async function maxRequest(
  token: string,
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  options: { query?: Record<string, string>; body?: unknown } = {}
): Promise<Response> {
  const url = new URL(path, MAX_API_URL)
  for (const [k, v] of Object.entries(options.query ?? {})) url.searchParams.set(k, v)
  return fetch(url, {
    method,
    headers: { Authorization: token, ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
}

/** Send a text message to a chat. Returns false when it was not delivered. */
export async function sendMessage(message: MaxMessage): Promise<boolean> {
  const settings = await getBotSettings()
  if (!settings?.maxBotToken || !settings.maxIsActive) return false
  try {
    const response = await maxRequest(settings.maxBotToken, 'POST', '/messages', {
      query: { chat_id: message.chat_id },
      body: { text: message.text.slice(0, 4000), format: message.parse_mode === 'HTML' ? 'html' : 'markdown' },
    })
    if (!response.ok) {
      console.error('Max sendMessage failed:', response.status, await response.text())
      return false
    }
    return true
  } catch (error) {
    console.error('Max sendMessage error:', error)
    return false
  }
}

/** Register the webhook, with the shared secret MAX sends back. */
export async function setWebhook(webhookUrl: string): Promise<boolean> {
  const settings = await getBotSettings()
  const secret = webhookSecret('max')
  if (!settings?.maxBotToken || !secret) return false
  try {
    const response = await maxRequest(settings.maxBotToken, 'POST', '/subscriptions', {
      body: { url: webhookUrl, update_types: ['message_created', 'bot_started'], secret },
    })
    if (!response.ok) {
      console.error('Max setWebhook failed:', response.status, await response.text())
      return false
    }
    await prisma.botSettings.updateMany({ data: { maxWebhookUrl: webhookUrl } })
    return true
  } catch (error) {
    console.error('Max setWebhook error:', error)
    return false
  }
}

export async function getWebhookInfo(): Promise<unknown> {
  const settings = await getBotSettings()
  if (!settings?.maxBotToken) return null
  try {
    const response = await maxRequest(settings.maxBotToken, 'GET', '/subscriptions')
    return response.ok ? await response.json() : null
  } catch (error) {
    console.error('Max getWebhookInfo error:', error)
    return null
  }
}

export async function getBotInfo(): Promise<unknown> {
  const settings = await getBotSettings()
  if (!settings?.maxBotToken) return null
  try {
    const response = await maxRequest(settings.maxBotToken, 'GET', '/me')
    return response.ok ? await response.json() : null
  } catch (error) {
    console.error('Max getBotInfo error:', error)
    return null
  }
}
