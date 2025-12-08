import React from 'react'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getTranslations } from 'next-intl/server'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { initializeCronJobs } from '@/lib/cron/init'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations()
  
  return {
    title: t('common.metadata.title'),
    description: t('common.metadata.description'),
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/icon.png', type: 'image/png', sizes: '32x32' },
        { url: '/logo.png', type: 'image/png', sizes: '192x192' },
      ],
      apple: [
        { url: '/logo.png', sizes: '192x192', type: 'image/png' },
      ],
    },
  }
}

// Инициализация cron задач при старте приложения
if (typeof window === 'undefined') {
  initializeCronJobs().catch((error) => {
    console.error('Ошибка при инициализации cron задач:', error)
  })
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
          <SonnerToaster />
        </Providers>
      </body>
    </html>
  )
}
