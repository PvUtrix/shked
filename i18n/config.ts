// Конфигурация интернационализации
// Сейчас используется только русский язык, но архитектура готова для добавления новых языков

export const locales = ['ru'] as const
export type Locale = (typeof locales)[number]

// Язык по умолчанию
export const defaultLocale: Locale = 'ru'

// Валидация локали
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

