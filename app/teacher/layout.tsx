import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TeacherNav } from '@/components/teacher/teacher-nav'
import { Footer } from '@/components/footer'

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Разрешаем доступ teacher и lector (для обратной совместимости)
  if (!session || !['teacher', 'lector'].includes(session.user.role)) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1">
        <TeacherNav user={session?.user} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}


