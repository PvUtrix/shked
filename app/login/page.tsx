
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { ArrowLeft } from 'lucide-react'
import { LogoWithText } from '@/components/ui/logo'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function LoginPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    // Редиректы для всех 8 ролей
    // eslint-disable-next-line no-fallthrough
    switch (session.user.role) {
      case 'admin':
        redirect('/admin')
        break
      case 'lector':
        redirect('/lector')
        break
      case 'assistant':
        redirect('/assistant')
        break
      case 'co_lecturer':
        redirect('/lector') // Со-преподаватели используют тот же интерфейс
        break
      case 'mentor':
        redirect('/mentor')
        break
      case 'education_office_head':
        redirect('/education-office')
        break
      case 'department_admin':
        redirect('/department')
        break
      case 'student':
      default:
        redirect('/student')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <LogoWithText size={40} variant="white" textClassName="text-3xl" />
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
