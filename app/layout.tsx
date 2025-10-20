
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { initializeCronJobs } from '@/lib/cron/init'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ШКЕД - Система управления расписанием',
  description: 'Современная веб-платформа для управления расписанием занятий в университете с Telegram ботом',
}

// Инициализация cron задач при старте приложения
if (typeof window === 'undefined') {
  initializeCronJobs()
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
