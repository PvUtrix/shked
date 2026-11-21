import { NextRequest, NextResponse } from 'next/server'
import { TelegramUpdate, sendMessage, answerCallbackQuery } from '@/lib/telegram/bot'
import { handleMessage } from '@/lib/bot/commands'
import { refreshProfile } from '@/lib/bot/channels'
import { isValidWebhookRequest } from '@/lib/bot/webhook-secret'

export async function POST(request: NextRequest) {
  // Only Telegram knows the secret set with setWebhook.
  if (!isValidWebhookRequest('telegram', request.headers)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const update: TelegramUpdate = await request.json()

    if (update.message?.text) {
      const { from, chat, text } = update.message
      const profile = { username: from.username, firstName: from.first_name, lastName: from.last_name }
      await refreshProfile('telegram', String(from.id), String(chat.id), profile)

      const reply = await handleMessage({
        channel: 'telegram',
        platformUserId: String(from.id),
        chatId: String(chat.id),
        text,
        profile,
      })
      await sendMessage({ chat_id: chat.id, text: reply, parse_mode: 'Markdown' })
    }

    if (update.callback_query) {
      // No inline keyboards are sent yet; acknowledge so the client stops waiting.
      await answerCallbackQuery({ callback_query_id: update.callback_query.id })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    // 200 so Telegram does not retry an update this code cannot handle.
    return NextResponse.json({ ok: false })
  }
}
