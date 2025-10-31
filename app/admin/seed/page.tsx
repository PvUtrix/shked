'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Loader2, Users, RefreshCw, Download, Upload, Database, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

type Operation = 'seed' | 'reset' | 'save' | 'restore'

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [operation, setOperation] = useState<Operation | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingOperation, setPendingOperation] = useState<Operation | null>(null)

  const runSeed = async () => {
    setLoading(true)
    setOperation('seed')
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
      setOperation(null)
    }
  }

  const resetDatabase = async () => {
    setLoading(true)
    setOperation('reset')
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/reset-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          message: 'База данных успешно сброшена и заполнена тестовыми данными!',
          stats: data.stats,
        })
        toast.success('База данных восстановлена!')
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
      setOperation(null)
    }
  }

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Введите название шаблона')
      return
    }

    setLoading(true)
    setOperation('save')
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/db-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'save',
          name: templateName.trim()
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          message: `Шаблон "${templateName}" успешно сохранен!`,
          snapshot: data.snapshot,
        })
        toast.success('Шаблон сохранен!')
        setTemplateName('')
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
      setOperation(null)
    }
  }

  const restoreTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Введите название шаблона')
      return
    }

    setLoading(true)
    setOperation('restore')
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/db-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'restore',
          name: templateName.trim()
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          message: `Шаблон "${templateName}" успешно восстановлен!`,
          stats: data.stats,
        })
        toast.success('Шаблон восстановлен!')
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
      setOperation(null)
    }
  }

  const handleConfirmOperation = (op: Operation) => {
    setPendingOperation(op)
    setConfirmDialogOpen(true)
  }

  const executeOperation = () => {
    setConfirmDialogOpen(false)
    
    switch (pendingOperation) {
      case 'reset':
        resetDatabase()
        break
      case 'restore':
        restoreTemplate()
        break
      default:
        break
    }
    
    setPendingOperation(null)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Управление тестовой базой данных</h1>
        <p className="text-gray-600">
          Создание пользователей, сброс базы и управление шаблонами для тестирования
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Создание пользователей */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Создать пользователей
            </CardTitle>
            <CardDescription>
              Добавить 8 демо-пользователей (не удаляет существующие данные)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runSeed} 
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading && operation === 'seed' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Создать пользователей
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Полный сброс базы */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <Trash2 className="h-5 w-5 mr-2" />
              Сбросить базу
            </CardTitle>
            <CardDescription>
              ⚠️ Удалит ВСЕ данные и создаст тестовое окружение
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleConfirmOperation('reset')} 
              disabled={loading}
              size="lg"
              variant="destructive"
              className="w-full"
            >
              {loading && operation === 'reset' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Сброс...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Сбросить и заполнить
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Управление шаблонами */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Шаблоны базы данных
          </CardTitle>
          <CardDescription>
            Сохраните текущее состояние БД как шаблон для быстрого восстановления
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="templateName">Название шаблона</Label>
            <Input
              id="templateName"
              placeholder="Например: initial-state, test-data-v1"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={saveTemplate} 
              disabled={loading || !templateName.trim()}
              variant="outline"
              className="w-full"
            >
              {loading && operation === 'save' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Сохранить шаблон
                </>
              )}
            </Button>

            <Button 
              onClick={() => handleConfirmOperation('restore')} 
              disabled={loading || !templateName.trim()}
              variant="outline"
              className="w-full"
            >
              {loading && operation === 'restore' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Восстановление...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Восстановить шаблон
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>💡 <strong>Совет:</strong> Создайте шаблон после настройки идеального тестового окружения</p>
            <p>📁 Шаблоны сохраняются в <code className="bg-gray-100 px-1 rounded">data/templates/</code></p>
          </div>
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

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-3 text-blue-900">📝 Список демо-аккаунтов:</h4>
          <div className="grid md:grid-cols-2 gap-2 text-sm text-blue-800">
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

      {/* Диалог подтверждения */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={executeOperation}
        title={pendingOperation === 'reset' ? '⚠️ Подтверждение сброса' : '⚠️ Подтверждение восстановления'}
        description={
          pendingOperation === 'reset'
            ? 'Вы уверены, что хотите удалить ВСЕ данные из базы? Это действие необратимо!'
            : `Вы уверены, что хотите восстановить шаблон "${templateName}"? Все текущие данные будут заменены.`
        }
        confirmText="Да, продолжить"
        cancelText="Отмена"
      />
    </div>
  )
}

