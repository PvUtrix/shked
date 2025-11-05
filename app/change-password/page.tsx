'use client'
import React from 'react'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ChangePasswordPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mustChange, setMustChange] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      // Проверяем, нужно ли менять пароль
      const needsChange = (session?.user as any)?.mustChangePassword || false
      setMustChange(needsChange)
      
      // Если не нужно менять пароль, редиректим на главную страницу роли
      if (!needsChange) {
        const role = session?.user?.role
        if (role === 'admin') {
          router.push('/admin')
        } else if (role === 'lector' || role === 'co_lecturer') {
          router.push('/lector')
        } else if (role === 'assistant') {
          router.push('/assistant')
        } else if (role === 'mentor') {
          router.push('/mentor')
        } else if (role === 'education_office_head') {
          router.push('/education-office')
        } else if (role === 'department_admin') {
          router.push('/department')
        } else {
          router.push('/student')
        }
      }
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Валидация
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Ошибка',
        description: 'Все поля обязательны для заполнения',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Ошибка',
        description: 'Новый пароль должен содержать минимум 6 символов',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Ошибка',
        description: 'Новые пароли не совпадают',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    if (currentPassword === newPassword) {
      toast({
        title: 'Ошибка',
        description: 'Новый пароль должен отличаться от текущего',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Пароль успешно изменен',
        })
        
        // Обновляем сессию, чтобы сбросить флаг mustChangePassword
        await update()
        
        // Редиректим на главную страницу роли
        const role = session?.user?.role
        if (role === 'admin') {
          router.push('/admin')
        } else if (role === 'lector' || role === 'co_lecturer') {
          router.push('/lector')
        } else if (role === 'assistant') {
          router.push('/assistant')
        } else if (role === 'mentor') {
          router.push('/mentor')
        } else if (role === 'education_office_head') {
          router.push('/education-office')
        } else if (role === 'department_admin') {
          router.push('/department')
        } else {
          router.push('/student')
        }
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось изменить пароль',
          variant: 'destructive',
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Ошибка при смене пароля:', error)
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при смене пароля',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!mustChange) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Смена пароля</CardTitle>
          <CardDescription className="text-center">
            Необходимо сменить пароль для продолжения работы
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mustChange && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Вы обязаны сменить пароль при первом входе в систему
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Текущий пароль"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
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
                  placeholder="Новый пароль (минимум 6 символов)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Подтвердите новый пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Смена пароля...' : 'Сменить пароль'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

