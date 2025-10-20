'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Save, 
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Submission {
  id: string
  submissionUrl: string
  submittedAt: string
  status: string
  grade?: number
  comment?: string
  user: {
    id: string
    name?: string
    firstName?: string
    lastName?: string
    email: string
  }
}

export default function ReviewSubmissionPage({ 
  params 
}: { 
  params: { id: string; submissionId: string } 
}) {
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    grade: '',
    comment: '',
    status: 'SUBMITTED'
  })

  useEffect(() => {
    fetchSubmission()
  }, [params.id, params.submissionId])

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/homework/${params.id}/submissions/${params.submissionId}`)
      if (response.ok) {
        const data = await response.json()
        setSubmission(data)
        setFormData({
          grade: data.grade?.toString() || '',
          comment: data.comment || '',
          status: data.status || 'SUBMITTED'
        })
      } else {
        router.push(`/admin/homework/${params.id}`)
      }
    } catch (error) {
      console.error('Ошибка при получении работы:', error)
      router.push(`/admin/homework/${params.id}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/homework/${params.id}/submissions/${params.submissionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grade: formData.grade ? parseInt(formData.grade) : null,
          comment: formData.comment,
          status: formData.status
        }),
      })

      if (response.ok) {
        toast.success('Работа проверена')
        router.push(`/admin/homework/${params.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при проверке работы')
      }
    } catch (error) {
      console.error('Ошибка при проверке работы:', error)
      toast.error('Ошибка при проверке работы')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      return dateObj.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return typeof date === 'string' ? date : date.toString()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge className="bg-yellow-100 text-yellow-800">Сдано</Badge>
      case 'REVIEWED':
        return <Badge className="bg-green-100 text-green-800">Проверено</Badge>
      case 'LATE':
        return <Badge className="bg-red-100 text-red-800">Опоздание</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Не сдано</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Работа не найдена</h2>
        <Button asChild>
          <Link href={`/admin/homework/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к заданию
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/homework/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Проверка домашнего задания</h1>
            <p className="text-gray-600">
              {submission.user?.name || 
               `${submission.user?.firstName || ''} ${submission.user?.lastName || ''}`.trim() ||
               submission.user?.email}
            </p>
          </div>
        </div>
        {getStatusBadge(submission.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основная информация */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Работа студента
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Ссылка на работу</Label>
                  <div className="mt-1">
                    {submission.submissionUrl ? (
                      <Button variant="outline" asChild>
                        <a href={submission.submissionUrl} target="_blank" rel="noopener noreferrer">
                          Открыть работу
                        </a>
                      </Button>
                    ) : (
                      <p className="text-gray-500 italic">Ссылка не предоставлена</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Время сдачи</Label>
                  <p className="text-sm text-gray-600">{formatDate(submission.submittedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Форма проверки */}
          <Card>
            <CardHeader>
              <CardTitle>Проверка работы</CardTitle>
              <CardDescription>
                Оцените работу и оставьте комментарий
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="status">Статус</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUBMITTED">Сдано</SelectItem>
                      <SelectItem value="REVIEWED">Проверено</SelectItem>
                      <SelectItem value="LATE">Опоздание</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="grade">Оценка (1-5)</Label>
                  <Select
                    value={formData.grade}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите оценку" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Неудовлетворительно</SelectItem>
                      <SelectItem value="2">2 - Неудовлетворительно</SelectItem>
                      <SelectItem value="3">3 - Удовлетворительно</SelectItem>
                      <SelectItem value="4">4 - Хорошо</SelectItem>
                      <SelectItem value="5">5 - Отлично</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="comment">Комментарий</Label>
                  <Textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Оставьте комментарий к работе..."
                    rows={4}
                  />
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Сохранить проверку
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Информация о студенте</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">
                    {submission.user?.name || 
                     `${submission.user?.firstName || ''} ${submission.user?.lastName || ''}`.trim() ||
                     'Имя не указано'}
                  </p>
                  <p className="text-sm text-gray-500">{submission.user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Сдано</p>
                  <p className="font-medium">{formatDate(submission.submittedAt)}</p>
                </div>
              </div>

              {submission.grade && (
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Оценка</p>
                    <p className="font-medium text-green-600">{submission.grade}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setFormData(prev => ({ ...prev, status: 'REVIEWED', grade: '5' }))}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Отлично (5)
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setFormData(prev => ({ ...prev, status: 'REVIEWED', grade: '4' }))}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Хорошо (4)
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setFormData(prev => ({ ...prev, status: 'REVIEWED', grade: '3' }))}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Удовлетворительно (3)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
