/**
 * Resolution of bot and LLM secrets.
 *
 * Secrets come from environment variables first. Values stored in the
 * `bot_settings` table are a deprecated fallback kept so that existing
 * deployments keep working; they will be removed once every deployment
 * sets the environment variables.
 *
 * Secret values are never sent to the browser: API routes return only
 * `SecretStatus` (whether a value is set and where it comes from).
 */

export type SecretSource = 'env' | 'database'

export interface SecretStatus {
  isSet: boolean
  source: SecretSource | null
}

export const SECRET_ENV = {
  telegramBotToken: 'TELEGRAM_BOT_TOKEN',
  maxBotToken: 'MAX_BOT_TOKEN',
  llmApiKey: 'GIGACHAT_API_KEY',
} as const

export type SecretName = keyof typeof SECRET_ENV

function fromEnv(name: SecretName): string | null {
  const value = process.env[SECRET_ENV[name]]
  return value && value.trim() !== '' ? value.trim() : null
}

/** The effective value: the environment variable, else the stored value. */
export function resolveSecret(name: SecretName, storedValue: string | null | undefined): string | null {
  return fromEnv(name) ?? (storedValue && storedValue.trim() !== '' ? storedValue : null)
}

/** Where the effective value comes from, without revealing it. */
export function secretStatus(name: SecretName, storedValue: string | null | undefined): SecretStatus {
  if (fromEnv(name)) return { isSet: true, source: 'env' }
  if (storedValue && storedValue.trim() !== '') return { isSet: true, source: 'database' }
  return { isSet: false, source: null }
}
