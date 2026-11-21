import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { resolveSecret, secretStatus } from '@/lib/bot-secrets'

describe('bot-secrets', () => {
  const saved = { ...process.env }

  beforeEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.MAX_BOT_TOKEN
    delete process.env.GIGACHAT_API_KEY
  })

  afterEach(() => {
    process.env = { ...saved }
  })

  it('prefers the environment variable over the stored value', () => {
    process.env.TELEGRAM_BOT_TOKEN = '111:env-token'
    expect(resolveSecret('telegramBotToken', '222:db-token')).toBe('111:env-token')
    expect(secretStatus('telegramBotToken', '222:db-token')).toEqual({ isSet: true, source: 'env' })
  })

  it('falls back to the stored value when the variable is unset or blank', () => {
    process.env.GIGACHAT_API_KEY = '   '
    expect(resolveSecret('llmApiKey', 'db-key')).toBe('db-key')
    expect(secretStatus('llmApiKey', 'db-key')).toEqual({ isSet: true, source: 'database' })
  })

  it('reports a missing secret without a value', () => {
    expect(resolveSecret('maxBotToken', null)).toBeNull()
    expect(resolveSecret('maxBotToken', '')).toBeNull()
    expect(secretStatus('maxBotToken', undefined)).toEqual({ isSet: false, source: null })
  })

  it('never includes the secret value in the status', () => {
    process.env.MAX_BOT_TOKEN = 'very-secret'
    expect(JSON.stringify(secretStatus('maxBotToken', 'also-secret'))).not.toMatch(/secret"/)
  })
})
