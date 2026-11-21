import { describe, it, expect } from '@jest/globals'
import { isValidWebhookRequest, webhookSecret, WEBHOOK_SECRET_HEADER } from '@/lib/bot/webhook-secret'

describe('lib/bot/webhook-secret', () => {
  it('derives a different secret per channel, in the format both messengers accept', () => {
    const tg = webhookSecret('telegram')
    const max = webhookSecret('max')
    expect(tg).toMatch(/^[0-9a-f]{64}$/)
    expect(max).toMatch(/^[0-9a-f]{64}$/)
    expect(tg).not.toBe(max)
  })

  it('accepts a request carrying the secret in the channel header', () => {
    const headers = new Headers({ [WEBHOOK_SECRET_HEADER.telegram]: webhookSecret('telegram')! })
    expect(isValidWebhookRequest('telegram', headers)).toBe(true)
  })

  it('rejects a missing, wrong or cross-channel secret', () => {
    expect(isValidWebhookRequest('telegram', new Headers())).toBe(false)
    expect(isValidWebhookRequest('telegram', new Headers({ [WEBHOOK_SECRET_HEADER.telegram]: 'nope' }))).toBe(false)
    expect(isValidWebhookRequest('max', new Headers({ [WEBHOOK_SECRET_HEADER.max]: webhookSecret('telegram')! }))).toBe(false)
  })

  it('rejects everything when NEXTAUTH_SECRET is not set', () => {
    const saved = process.env.NEXTAUTH_SECRET
    delete process.env.NEXTAUTH_SECRET
    try {
      expect(webhookSecret('telegram')).toBeNull()
      expect(isValidWebhookRequest('telegram', new Headers({ [WEBHOOK_SECRET_HEADER.telegram]: 'x' }))).toBe(false)
    } finally {
      process.env.NEXTAUTH_SECRET = saved
    }
  })
})
