import { NextRequest, NextResponse } from 'next/server'
import { MaxUpdate, sendMessage } from '@/lib/max/bot'
import { handleMessage } from '@/lib/bot/commands'
import { refreshProfile } from '@/lib/bot/channels'
import { isValidWebhookRequest } from '@/lib/bot/webhook-secret'

/**
 * MAX webhook (POST /subscriptions points here). Handles message_created and
 * bot_started; the payload shape follows the MAX Update object docs.
 */
export async function POST(request: NextRequest) {
  if (!isValidWebhookRequest('max', request.headers)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const update: MaxUpdate = await request.json()

    let platformUserId: string | undefined
    let chatId: string | undefined
    let text: string | undefined
    let profile: { username?: string; firstName?: string; lastName?: string } = {}

    if (update.update_type === 'message_created' && update.message?.sender) {
      const { sender, recipient, body } = update.message
      platformUserId = String(sender.user_id)
      chatId = recipient.chat_id != null ? String(recipient.chat_id) : undefined
      text = body?.text ?? undefined
      profile = { username: sender.username ?? undefined, firstName: sender.first_name, lastName: sender.last_name ?? undefined }
    } else if (update.update_type === 'bot_started' && update.user && update.chat_id != null) {
      // The start button; a deep-link payload carries a link token like Telegram's /start.
      platformUserId = String(update.user.user_id)
      chatId = String(update.chat_id)
      text = update.payload ? `/start ${update.payload}` : '/start'
      profile = { username: update.user.username ?? undefined, firstName: update.user.first_name, lastName: update.user.last_name ?? undefined }
    }

    if (platformUserId && chatId && text) {
      await refreshProfile('max', platformUserId, chatId, profile)
      const reply = await handleMessage({ channel: 'max', platformUserId, chatId, text, profile })
      await sendMessage({ chat_id: chatId, text: reply, parse_mode: 'Markdown' })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Max webhook error:', error)
    return NextResponse.json({ ok: false })
  }
}
