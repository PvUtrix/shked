
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, LogIn } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

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
          title: 'Ошибка входа',
          description: 'Неверные учетные данные',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Успешный вход',
          description: 'Добро пожаловать в Шкед!',
        })
        router.refresh()
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при входе',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Вход в систему</CardTitle>
        <CardDescription>
          Введите свои учетные данные для входа в Шкед
        </CardDescription>
        <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
          <p className="font-medium mb-2">Демо аккаунты (8 ролей):</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <p><strong>👨‍💼 Админ:</strong> admin@shked.com / admin123</p>
            <p><strong>🎓 Студент:</strong> student@demo.com / student123</p>
            <p><strong>👨‍🏫 Преподаватель:</strong> lector@demo.com / lector123</p>
            <p><strong>👤 Ментор:</strong> mentor@demo.com / mentor123</p>
            <p><strong>🤝 Ассистент:</strong> assistant@demo.com / assistant123</p>
            <p><strong>👥 Со-препод:</strong> coteacher@demo.com / coteacher123</p>
            <p><strong>📊 Учебный отдел:</strong> eduoffice@demo.com / eduoffice123</p>
            <p><strong>🏛️ Админ кафедры:</strong> deptadmin@demo.com / deptadmin123</p>
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
                placeholder="Email"
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
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            <LogIn className="w-4 h-4 mr-2" />
            {isLoading ? 'Входим...' : 'Войти'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
