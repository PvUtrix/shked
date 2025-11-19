'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { MarkdownViewer } from '@/components/ui/markdown-viewer'
import {
  ArrowLeft,
  Edit,
  Users,
  FileText,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { Homework } from '@/lib/types'

export default function LectorHomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [homework, setHomework] = useState<Homework | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const response = await fetch(`/api/homework/${id}`)
        if (response.ok) {
          const data = await response.json()
          setHomework(data)
        } else {
          router.push('/lector/homework')
        }
      } catch (error) {
        console.error('Ошибка при получении домашнего задания:', error)
        router.push('/lector/homework')
      } finally {
        setLoading(false)
      }
    }

    fetchHomework()
  }, [id, router])

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!homework) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Домашнее задание не найдено</h2>
        <p className="text-gray-600 mb-4">Возможно, оно было удалено или у вас нет доступа к нему.</p>
        <Button asChild>
          <Link href="/lector/homework">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к списку
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
            <Link href="/lector/homework">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{homework.title}</h1>
            <p className="text-gray-600">{homework.subject?.name}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/lector/homework/${homework.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Редактировать
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основная информация */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Описание задания
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Краткое описание */}
              {homework.description && (
                <div>
                  <Label className="text-sm font-medium">Краткое описание:</Label>
                  <p className="text-gray-700 mt-1 whitespace-pre-wrap">{homework.description}</p>
                </div>
              )}

              {/* MDX Контент */}
              {homework.content && (
                <div>
                  <Label className="text-sm font-medium">Содержание задания:</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <MarkdownViewer content={homework.content} />
                  </div>
                </div>
              )}

              {homework.taskUrl && (
                <div className="mt-4">
                  <Button variant="outline" asChild>
                    <a href={homework.taskUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Открыть задание
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Дополнительные материалы */}
          {Array.isArray(homework.materials) && homework.materials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Дополнительные материалы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {homework.materials.map((material: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{material.name}</span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={material.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Работы студентов */}
          {Array.isArray(homework.submissions) && homework.submissions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Работы студентов</CardTitle>
                <CardDescription>
                  {homework.submissions.length} работ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {homework.submissions.map((submission: any) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">
                            {submission.user?.name || 
                             `${submission.user?.firstName || ''} ${submission.user?.lastName || ''}`.trim() ||
                             submission.user?.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(submission.submittedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(submission.status)}
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/lector/homework/${homework.id}/review/${submission.id}`}>
                            Проверить
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">Нет сданных работ</p>
                  <p className="text-gray-400">Студенты еще не сдали это задание</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Информация о задании</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Предмет:</span>
                <span className="font-medium">{homework.subject?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Группа:</span>
                <span className="font-medium">{homework.group?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Дедлайн:</span>
                <span className="font-medium">{formatDate(homework.deadline)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Сдано:</span>
                <span className="font-medium">
                  {homework.submissions?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Всего работ:</span>
                <span className="font-medium">{homework.submissions?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Проверено:</span>
                <span className="font-medium">
                  {homework.submissions?.filter((s: any) => s.status === 'REVIEWED').length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ожидает проверки:</span>
                <span className="font-medium">
                  {homework.submissions?.filter((s: any) => s.status === 'SUBMITTED').length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

