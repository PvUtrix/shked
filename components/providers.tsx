'use client'
import React from 'react'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from './theme-provider'
import { NextIntlClientProvider } from 'next-intl'
import { defaultLocale } from '@/i18n/config'
import { useEffect } from 'react'

// Загружаем сообщения синхронно для Client Provider
// В будущем можно сделать асинхронную загрузку при добавлении новых языков
import ruMessages from '@/messages/ru.json'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Пасхальное яйцо для любопытных разработчиков в консоли
    // Защита от двойного вывода в StrictMode
    if (typeof window !== 'undefined' && !(window as any).__CONTRIBUTE_MESSAGE_SHOWN) {
      (window as any).__CONTRIBUTE_MESSAGE_SHOWN = true
      
      const githubUrl = 'https://github.com/PvUtrix/shked'

      console.error(
        '%c🧐 Любопытно, как это работает?',
        'color: #9333ea; font-size: 16px; font-weight: bold; padding: 4px 0;'
      )
      console.error(
        '%cПрисоединяйся к разработке! Мы всегда рады новым контрибьюторам 🚀',
        'color: #3b82f6; font-size: 14px; padding: 2px 0;'
      )
      console.error(
        `%c👉 ${githubUrl}`,
        'color: #2563eb; font-size: 12px; text-decoration: underline; padding: 2px 0;'
      )
      console.error(
        '%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'color: #9ca3af; font-size: 10px;'
      )
    }
  }, [])

  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <NextIntlClientProvider 
          locale={defaultLocale} 
          messages={ruMessages}
          timeZone="Europe/Moscow"
        >
          {children}
        </NextIntlClientProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
