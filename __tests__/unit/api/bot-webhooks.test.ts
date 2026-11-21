/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

const handleMessage = jest.fn<(...a: unknown[]) => Promise<string>>()
const refreshProfile = jest.fn<(...a: unknown[]) => Promise<void>>()
const sendTelegram = jest.fn<(...a: unknown[]) => Promise<boolean>>()
const sendMax = jest.fn<(...a: unknown[]) => Promise<boolean>>()

jest.mock('@/lib/bot/commands', () => ({ handleMessage: (...a: unknown[]) => handleMessage(...a) }))
jest.mock('@/lib/bot/channels', () => ({ refreshProfile: (...a: unknown[]) => refreshProfile(...a) }))
jest.mock('@/lib/telegram/bot', () => ({
  sendMessage: (...a: unknown[]) => sendTelegram(...a),
  answerCallbackQuery: jest.fn(),
}))
jest.mock('@/lib/max/bot', () => ({ sendMessage: (...a: unknown[]) => sendMax(...a) }))

const telegram = require('@/app/api/telegram/webhook/route') as typeof import('@/app/api/telegram/webhook/route')
const max = require('@/app/api/max/webhook/route') as typeof import('@/app/api/max/webhook/route')
const { webhookSecret, WEBHOOK_SECRET_HEADER } = require('@/lib/bot/webhook-secret') as typeof import('@/lib/bot/webhook-secret')

function post(body: unknown, headers: Record<string, string> = {}) {
  // The routes only use headers and json(), which a plain Request provides.
  return new Request('https://example.test/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof telegram.POST>[0]
}

describe('bot webhook routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    handleMessage.mockResolvedValue('reply')
  })

  it('rejects Telegram updates without the secret token', async () => {
    const res = await telegram.POST(post({ update_id: 1 }))
    expect(res.status).toBe(401)
    expect(handleMessage).not.toHaveBeenCalled()
  })

  it('answers a Telegram message through the shared core', async () => {
    const update = {
      update_id: 1,
      message: { message_id: 5, date: 0, text: '/help', chat: { id: 777, type: 'private' }, from: { id: 42, is_bot: false, first_name: 'Anna' } },
    }
    const res = await telegram.POST(post(update, { [WEBHOOK_SECRET_HEADER.telegram]: webhookSecret('telegram')! }))
    expect(res.status).toBe(200)
    expect(handleMessage).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'telegram', platformUserId: '42', chatId: '777', text: '/help' })
    )
    expect(sendTelegram).toHaveBeenCalledWith({ chat_id: 777, text: 'reply', parse_mode: 'Markdown' })
  })

  it('rejects MAX updates signed for another channel', async () => {
    const res = await max.POST(post({ update_type: 'message_created' }, { [WEBHOOK_SECRET_HEADER.max]: webhookSecret('telegram')! }))
    expect(res.status).toBe(401)
  })

  it('maps a MAX message_created update (sender, recipient.chat_id, body.text)', async () => {
    const update = {
      update_type: 'message_created',
      timestamp: 1763700000000,
      message: {
        sender: { user_id: 1001, first_name: 'Ivan', username: 'ivan' },
        recipient: { chat_id: 555, chat_type: 'dialog' },
        body: { mid: 'mid.1', text: '/schedule' },
      },
    }
    const res = await max.POST(post(update, { [WEBHOOK_SECRET_HEADER.max]: webhookSecret('max')! }))
    expect(res.status).toBe(200)
    expect(handleMessage).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'max', platformUserId: '1001', chatId: '555', text: '/schedule' })
    )
    expect(sendMax).toHaveBeenCalledWith({ chat_id: '555', text: 'reply', parse_mode: 'Markdown' })
  })

  it('turns a MAX bot_started payload into /start with the link token', async () => {
    const update = { update_type: 'bot_started', chat_id: 556, user: { user_id: 1002, first_name: 'Olga' }, payload: 'dG9r' }
    await max.POST(post(update, { [WEBHOOK_SECRET_HEADER.max]: webhookSecret('max')! }))
    expect(handleMessage).toHaveBeenCalledWith(expect.objectContaining({ platformUserId: '1002', chatId: '556', text: '/start dG9r' }))
  })
})
