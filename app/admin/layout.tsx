import React from 'react'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
// import { PageTransitionWrapper } from '@/components/page-transition-wrapper' // Временно отключен

// Полностью клиентский layout через динамический импорт
// В Next.js 16 ssr: false недопустим в Server Components, поэтому используем обычный dynamic import
const AdminLayoutClient = dynamic(
  () => import('@/components/admin/admin-layout-client').then(mod => ({ default: mod.AdminLayoutClient })),
  {
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex flex-1">
          <aside className="bg-white border-r border-gray-200 h-full w-64">
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </aside>
          <main className="flex-1 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </main>
        </div>
        <footer className="py-4 border-t border-gray-200 bg-white">
          <div className="container mx-auto px-4 text-center">
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
        </footer>
      </div>
    )
  }
)

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    redirect('/login')
  }

  return (
    <AdminLayoutClient user={session?.user}>
      {children}
    </AdminLayoutClient>
  )
}
