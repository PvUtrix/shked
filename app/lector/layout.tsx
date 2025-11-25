import React from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LectorNav } from '@/components/lector/lector-nav'
import { Footer } from '@/components/footer'

export default async function LectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Разрешаем доступ преподавателям и связанным ролям
  const allowedRoles = ['admin', 'lector', 'co_lecturer', 'assistant', 'education_office_head', 'department_admin']
  if (!session || !allowedRoles.includes(session.user.role)) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1">
        <LectorNav user={session?.user} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}
