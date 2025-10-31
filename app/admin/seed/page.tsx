'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runSeed = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: true }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        toast.success('Тестовые пользователи созданы успешно!')
      } else {
        setError(data.error || 'Произошла ошибка')
        toast.error(data.error || 'Произошла ошибка')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка'
      setError(errorMessage)
      toast.error('Ошибка при выполнении запроса')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Создание тестовых пользователей</h1>
        <p className="text-gray-600">
          Этот инструмент создаст 8 демо-пользователей для всех ролей системы
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Seed Database
          </CardTitle>
          <CardDescription>
            Нажмите кнопку ниже, чтобы создать тестовых пользователей. 
            Если пользователь уже существует, он будет пропущен (upsert).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runSeed} 
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Создание пользователей...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Создать тестовых пользователей
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Ошибка</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start mb-4">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">{result.message}</h3>
              </div>
            </div>

            {result.users && (
              <div className="mt-4 bg-white rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold mb-3 text-gray-900">Созданные пользователи:</h4>
                <div className="space-y-2">
                  {result.users.map((user: any, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.email}</p>
                        <p className="text-sm text-gray-600">
                          Пароль: <code className="bg-gray-200 px-2 py-0.5 rounded">{user.password}</code>
                        </p>
                      </div>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-2 text-blue-900">📝 Список демо-аккаунтов:</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <p>👨‍💼 <strong>Админ:</strong> admin@shked.com / admin123</p>
            <p>🎓 <strong>Студент:</strong> student@demo.com / student123</p>
            <p>👨‍🏫 <strong>Преподаватель:</strong> teacher@demo.com / teacher123</p>
            <p>👤 <strong>Ментор:</strong> mentor@demo.com / mentor123</p>
            <p>🤝 <strong>Ассистент:</strong> assistant@demo.com / assistant123</p>
            <p>👥 <strong>Со-препод:</strong> coteacher@demo.com / coteacher123</p>
            <p>📊 <strong>Учебный отдел:</strong> eduoffice@demo.com / eduoffice123</p>
            <p>🏛️ <strong>Админ кафедры:</strong> deptadmin@demo.com / deptadmin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

