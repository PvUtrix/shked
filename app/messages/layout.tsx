import React from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { StudentNav } from '@/components/student/student-nav'
import { AdminNav } from '@/components/admin/admin-nav'
import { LectorNav } from '@/components/lector/lector-nav'
import { MentorNav } from '@/components/mentor/mentor-nav'
import { Footer } from '@/components/footer'
import { LogoutButton } from '@/components/auth/logout-button'
import Link from 'next/link'

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const role = session.user.role

  // Roles with Sidebar Navigation
  if (role === 'student') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex flex-1">
          <StudentNav user={session.user} />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
        <Footer />
      </div>
    )
  }

  if (role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex flex-1">
          <AdminNav user={session.user} />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
        <Footer />
      </div>
    )
  }

  if (role === 'lector' || role === 'co_lecturer') {
     return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex flex-1">
          <LectorNav user={session.user} />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
        <Footer />
      </div>
    )
  }

  if (role === 'mentor') {
     return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex flex-1">
          <MentorNav user={session.user} />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
        <Footer />
      </div>
    )
  }

  // Roles with Simple Header (Assistant, Department Admin, Education Office Head)
  let dashboardLink = '/'
  let roleTitle = 'ШКЕД'

  if (role === 'assistant') {
    dashboardLink = '/assistant'
    roleTitle = 'ШКЕД - Ассистент'
  } else if (role === 'department_admin') {
    dashboardLink = '/department'
    roleTitle = 'ШКЕД - Администратор кафедры'
  } else if (role === 'education_office_head') {
    dashboardLink = '/education-office'
    roleTitle = 'ШКЕД - Учебный отдел'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href={dashboardLink}>
            <h1 className="text-xl font-bold hover:text-blue-600 transition-colors">{roleTitle}</h1>
          </Link>
          <div className="flex items-center gap-4">
             <p className="text-sm text-muted-foreground hidden sm:block">{session.user.name}</p>
             <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 container mx-auto">
        {children}
      </main>

      <Footer />
    </div>
  )
}
