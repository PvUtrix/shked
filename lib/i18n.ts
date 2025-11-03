// Утилиты для работы с переводами
import { defaultLocale } from '@/i18n/config'
import ruMessages from '@/messages/ru.json'

// Тип для сообщений переводов
export type Messages = typeof ruMessages

// Получение сообщений для заданной локали
export async function getMessages(locale: string = defaultLocale): Promise<Messages> {
  // Сейчас используем только русский язык
  return ruMessages
}

// Получение локали (всегда возвращает 'ru')
export function getLocale(): string {
  return defaultLocale
}

