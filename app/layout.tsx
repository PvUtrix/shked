
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getTranslations } from 'next-intl/server'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { initializeCronJobs } from '@/lib/cron/init'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations()
  
  return {
    title: t('common.metadata.title'),
    description: t('common.metadata.description'),
  }
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
