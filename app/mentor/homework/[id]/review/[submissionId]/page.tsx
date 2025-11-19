'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MarkdownViewer } from '@/components/ui/markdown-viewer'
import { InlineCommentViewer } from '@/components/ui/inline-comment-viewer'
import { 
  ArrowLeft, 
  CheckCircle,
  User,
  Calendar,
  FileText
} from 'lucide-react'
import Link from 'next/link'

interface Submission {
  id: string
  content?: string
  submissionUrl: string
  submittedAt: string
  status: string
  grade?: number
  comment?: string
  feedback?: string
  user: {
    id: string
    name?: string
    firstName?: string
    lastName?: string
    email: string
  }
}

export default function MentorReviewSubmissionPage({ 
  params 
}: { 
  params: { id: string; submissionId: string } 
}) {
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/homework/${params.id}/submissions/${params.submissionId}`)
        if (response.ok) {
          const data = await response.json()
          setSubmission(data)
        } else {
          router.push(`/mentor/homework/${params.id}`)
        }
      } catch (error) {
        console.error('Ошибка при получении работы:', error)
        router.push(`/mentor/homework/${params.id}`)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmission()
  }, [params.id, params.submissionId, router])

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

  const isValidSubmissionUrl = (url: string | null | undefined): boolean => {
    if (!url) return false
    try {
      const parsedUrl = new URL(url)
      // Разрешаем только http и https протоколы
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return false
      }
      // Проверяем что URL не пустой и не example.com
      const isExampleDomain = parsedUrl.hostname.includes('example.com') || parsedUrl.hostname.includes('example.org')
      return url.trim().length > 0 && !isExampleDomain
    } catch {
      return false
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Работа не найдена</h2>
        <Button asChild>
          <Link href={`/mentor/homework/${params.id}`}>
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
            <Link href={`/mentor/homework/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Просмотр домашнего задания</h1>
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
          {/* Работа студента с inline комментариями */}
          {submission.content ? (
            <InlineCommentViewer
              content={submission.content}
              submissionId={params.submissionId}
              homeworkId={params.id}
              canComment={false}
            />
          ) : (
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
                      {isValidSubmissionUrl(submission.submissionUrl) ? (
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
          )}

          {/* Проверка лектора */}
          {submission.status === 'REVIEWED' && (submission.comment || submission.feedback) && (
            <Card>
              <CardHeader>
                <CardTitle>Проверка лектора</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submission.grade && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Оценка</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-xl font-bold text-green-600">{submission.grade}</span>
                        <span className="text-sm text-gray-500">/ 5</span>
                      </div>
                    </div>
                  )}
                  
                  {submission.comment && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Краткий комментарий</Label>
                      <p className="text-gray-700 mt-1 whitespace-pre-wrap">{submission.comment}</p>
                    </div>
                  )}

                  {submission.feedback && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Развернутая обратная связь</Label>
                      <div className="mt-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <MarkdownViewer content={submission.feedback} />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Информация для ментора */}
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-900">Информация для ментора</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700">
                Как ментор, вы можете просматривать работы студентов вашей группы. 
                Проверку и выставление оценок выполняет лектор.
              </p>
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
              <CardTitle>Статус проверки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {getStatusBadge(submission.status)}
              <p className="text-sm text-gray-600 mt-2">
                {submission.status === 'REVIEWED' 
                  ? 'Работа проверена лектором' 
                  : 'Работа ожидает проверки лектором'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

