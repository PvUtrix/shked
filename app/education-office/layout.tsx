import React from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Footer } from '@/components/footer'
import { LogoutButton } from '@/components/auth/logout-button'

export default async function EducationOfficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'education_office_head') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Simple header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">ШКЕД - Учебный отдел</h1>
            <p className="text-sm text-muted-foreground">{session.user.name}</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 p-6 container mx-auto">
        {children}
      </main>

      <Footer />
    </div>
  )
}
