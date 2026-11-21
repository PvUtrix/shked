import crypto from 'crypto'

export type WebhookChannel = 'telegram' | 'max'

/**
 * The shared secret a messenger sends back with every webhook request.
 *
 * It is derived from NEXTAUTH_SECRET, so it needs no extra configuration and
 * changes when that secret is rotated (re-save the bot settings afterwards to
 * register the webhook again). 64 hex characters satisfy both Telegram's
 * secret_token and MAX's secret format.
 */
export function webhookSecret(channel: WebhookChannel): string | null {
  const base = process.env.NEXTAUTH_SECRET
  if (!base) return null
  return crypto.createHmac('sha256', base).update(`${channel}-webhook`).digest('hex')
}

/** Header each messenger uses to send the secret back. */
export const WEBHOOK_SECRET_HEADER: Record<WebhookChannel, string> = {
  telegram: 'x-telegram-bot-api-secret-token',
  max: 'x-max-bot-api-secret',
}

/** Constant-time check of the secret header on an incoming webhook request. */
export function isValidWebhookRequest(channel: WebhookChannel, headers: Headers): boolean {
  const expected = webhookSecret(channel)
  const received = headers.get(WEBHOOK_SECRET_HEADER[channel])
  if (!expected || !received) return false
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(new Uint8Array(a), new Uint8Array(b))
}
