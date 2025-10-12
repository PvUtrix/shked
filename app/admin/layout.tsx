
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminNav } from '@/components/admin/admin-nav'
// import { PageTransitionWrapper } from '@/components/page-transition-wrapper' // Временно отключен
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1">
        <AdminNav user={session?.user} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <footer className="py-4 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            © 2025 Шкед. Система управления университетскими расписаниями.
          </p>
          <p className="text-gray-600 text-sm mt-1">
            Сделано с ❤️ в МФТИ
          </p>
          <div className="mt-2">
            <Link
              href="https://github.com/PvUtrix/shked"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Открыть репозиторий проекта на GitHub (откроется в новой вкладке)"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200 text-sm"
            >
              <ExternalLink className="h-3 w-3 mr-1" aria-hidden="true" />
              Исходный код на GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
