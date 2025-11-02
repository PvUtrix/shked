
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, LogIn } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const t = useTranslations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: t('auth.login.error'),
          description: t('auth.login.invalidCredentials'),
          variant: 'destructive',
        })
        setIsLoading(false)
      } else if (result?.ok) {
        // Для демо аккаунтов определяем роль по email и делаем прямой редирект
        const normalizedEmail = email.toLowerCase().trim()
        let redirectPath = '/student' // По умолчанию
        
        if (normalizedEmail === 'admin@shked.com' || normalizedEmail === 'john@doe.com') {
          redirectPath = '/admin'
        } else if (normalizedEmail === 'lector@demo.com') {
          redirectPath = '/lector'
        } else if (normalizedEmail === 'assistant@demo.com') {
          redirectPath = '/assistant'
        } else if (normalizedEmail === 'coteacher@demo.com') {
          redirectPath = '/lector'
        } else if (normalizedEmail === 'mentor@demo.com') {
          redirectPath = '/mentor'
        } else if (normalizedEmail === 'eduoffice@demo.com') {
          redirectPath = '/education-office'
        } else if (normalizedEmail === 'deptadmin@demo.com') {
          redirectPath = '/department'
        } else if (normalizedEmail.includes('student123@demo.com') || normalizedEmail.endsWith('@student.mipt.ru')) {
          redirectPath = '/student'
        }
        
        // Показываем toast уведомление (не блокируем выполнение)
        toast({
          title: t('auth.login.success'),
          description: t('auth.login.welcome'),
        })
        
        // Ждем установки cookie сессии с повторными попытками
        // Это критично для e2e тестов, где Playwright проверяет доступ
        let sessionReady = false
        let attempts = 0
        while (!sessionReady && attempts < 20) {
          try {
            const response = await fetch('/api/auth/session', {
              credentials: 'include',
              cache: 'no-store'
            })
            const session = await response.json()
            if (session?.user) {
              sessionReady = true
              break
            }
          } catch (e) {
            // Игнорируем ошибки
          }
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }
        
        // Делаем редирект после установки сессии
        window.location.replace(redirectPath)
      }
    } catch (error) {
      toast({
        title: t('common.messages.error'),
        description: t('auth.login.errorOccurred'),
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{t('auth.login.title')}</CardTitle>
        <CardDescription>
          {t('auth.login.description')}
        </CardDescription>
        <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
          <p className="font-medium mb-2">{t('auth.login.demoAccountsTitle')}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <p><strong>{t('auth.login.admin')}:</strong> admin@shked.com / admin123</p>
            <p><strong>{t('auth.login.student')}:</strong> student@demo.com / student123</p>
            <p><strong>{t('auth.login.lector')}:</strong> lector@demo.com / lector123</p>
            <p><strong>{t('auth.login.mentor')}:</strong> mentor@demo.com / mentor123</p>
            <p><strong>{t('auth.login.assistant')}:</strong> assistant@demo.com / assistant123</p>
            <p><strong>{t('auth.login.coTeacher')}:</strong> coteacher@demo.com / coteacher123</p>
            <p><strong>{t('auth.login.eduOffice')}:</strong> eduoffice@demo.com / eduoffice123</p>
            <p><strong>{t('auth.login.deptAdmin')}:</strong> deptadmin@demo.com / deptadmin123</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder={t('auth.login.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder={t('auth.login.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            <LogIn className="w-4 h-4 mr-2" />
            {isLoading ? t('auth.login.loggingIn') : t('auth.login.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
