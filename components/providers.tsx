'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from './theme-provider'
import { NextIntlClientProvider } from 'next-intl'
import { defaultLocale } from '@/i18n/config'

// Загружаем сообщения синхронно для Client Provider
// В будущем можно сделать асинхронную загрузку при добавлении новых языков
import ruMessages from '@/messages/ru.json'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <NextIntlClientProvider locale={defaultLocale} messages={ruMessages}>
          {children}
        </NextIntlClientProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
