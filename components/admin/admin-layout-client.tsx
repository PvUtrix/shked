'use client'
import React from 'react'

import { AdminNav } from './admin-nav'
import { Footer } from '@/components/footer'

interface AdminLayoutClientProps {
  children: React.ReactNode
  user?: {
    name?: string
    email?: string
  }
}

/**
 * Клиентский компонент layout для админской панели
 * Загружается через dynamic import с ssr: false для предотвращения гидратационных ошибок
 */
export function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1">
        <AdminNav user={user} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}

