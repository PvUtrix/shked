// Утилиты для получения переводов в Server Components
import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, isValidLocale } from './config'

export default getRequestConfig(async () => {
  // Всегда используем русский язык (без роутинга языков)
  const locale = defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Europe/Moscow'
  }
})

