import ru from '@/messages/ru.json'
import en from '@/messages/en.json'
import { APP_TIME_ZONE } from '@/lib/schedule/time'

export { APP_TIME_ZONE }

/**
 * Bot texts live in messages/{ru,en}.json under "bot", like the web UI.
 * The locale comes from BOT_LOCALE (default "ru"); dates are shown in
 * APP_TIME_ZONE (default Europe/Moscow), the time zone of the timetable.
 */

const catalogs = { ru, en } as const
export type BotLocale = keyof typeof catalogs

export function botLocale(): BotLocale {
  return process.env.BOT_LOCALE === 'en' ? 'en' : 'ru'
}

export type BotT = (key: string, values?: Record<string, string | number>) => string

type Catalog = { [key: string]: string | Catalog }

function lookup(catalog: Catalog, path: string): string | undefined {
  let node: string | Catalog | undefined = catalog
  for (const part of path.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = node[part]
  }
  return typeof node === 'string' ? node : undefined
}

/**
 * A translator over the "bot" namespace that always knows the app name.
 * Bot messages use plain {name} placeholders only, so a small lookup is
 * enough here (and works in Node and Jest without next-intl's ESM build).
 * A missing key falls back to Russian, then to the key itself.
 */
export function botT(locale: BotLocale = botLocale()): BotT {
  const primary = (catalogs[locale] as unknown as { bot: Catalog }).bot
  const fallback = (catalogs.ru as unknown as { bot: Catalog }).bot
  const raw = (key: string) => lookup(primary, key) ?? lookup(fallback, key) ?? key
  const app = raw('appName')
  return (key, values = {}) => {
    const all: Record<string, string | number> = { app, ...values }
    return raw(key).replace(/\{(\w+)\}/g, (match, name: string) => (name in all ? String(all[name]) : match))
  }
}

const intlLocale: Record<BotLocale, string> = { ru: 'ru-RU', en: 'en-GB' }

/** Format a date in the app time zone, independent of the server's zone. */
export function formatInAppZone(
  date: Date,
  options: Intl.DateTimeFormatOptions,
  locale: BotLocale = botLocale()
): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { timeZone: APP_TIME_ZONE, ...options }).format(date)
}

export function formatDeadline(date: Date, locale: BotLocale = botLocale()): string {
  return formatInAppZone(date, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }, locale)
}
