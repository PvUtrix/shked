
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { GraduationCap, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function LoginPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    if (session.user.role === 'admin') {
      redirect('/admin')
    } else if (session.user.role === 'lector') {
      redirect('/lector')
    } else if (session.user.role === 'mentor') {
      redirect('/mentor')
    } else {
      redirect('/student')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <GraduationCap className="h-10 w-10 text-white" />
            <h1 className="text-3xl font-bold text-white">Шкед</h1>
          </div>
          <p className="text-white/70">Система управления расписанием</p>
        </div>

        {/* Login Form */}
        <div className="fade-in-up">
          <LoginForm />
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Button asChild variant="ghost" className="text-white hover:bg-white/20">
            <Link href="/" className="flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              На главную
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
