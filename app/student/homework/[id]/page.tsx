'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MarkdownViewer } from '@/components/ui/markdown-viewer'
import { InlineCommentViewer } from '@/components/ui/inline-comment-viewer'
import { HomeworkSubmissionForm } from '@/components/student/homework-submission-form'
import { 
  BookOpen, 
  Clock,
  ExternalLink,
  ArrowLeft,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Homework, HomeworkSubmission } from '@/lib/types'
import Link from 'next/link'

export default function StudentHomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [homework, setHomework] = useState<Homework | null>(null)
  const [submission, setSubmission] = useState<HomeworkSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHomework = useCallback(async () => {
    try {
      const response = await fetch(`/api/homework/${id}`)
      if (response.ok) {
        const data = await response.json()
        setHomework(data)

        // Находим работу текущего пользователя
        if (Array.isArray(data.submissions) && data.submissions.length > 0) {
          setSubmission(data.submissions[0])
        }
      } else {
        setError(`Ошибка загрузки: ${response.status} ${response.statusText}`)
      }
    } catch (error: any) {
      console.error('Ошибка при получении домашнего задания:', error)
      setError('Произошла ошибка при загрузке задания')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchHomework()
  }, [fetchHomework])


  const formatDate = (date: string | Date) => {
    try {
      return new Date(date).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Дата не указана'
    }
  }

  const isOverdue = (deadline: string | Date) => {
    return new Date(deadline) < new Date()
  }

  const getStatusInfo = () => {
    if (!submission) {
      return { status: 'not_submitted', text: 'Не сдано', color: 'secondary' as const, icon: XCircle }
    }
    
    switch (submission.status) {
      case 'SUBMITTED':
        return { status: 'submitted', text: 'Сдано', color: 'default' as const, icon: Clock }
      case 'REVIEWED':
        return { status: 'reviewed', text: 'Проверено', color: 'default' as const, icon: CheckCircle }
      default:
        return { status: 'not_submitted', text: 'Не сдано', color: 'secondary' as const, icon: XCircle }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем домашнее задание...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Произошла ошибка: {error}</p>
        <p>ID: {id}</p>
        <Button asChild className="mt-4">
          <Link href="/student/homework">Вернуться к списку</Link>
        </Button>
      </div>
    )
  }

  if (!homework) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Домашнее задание не найдено</p>
        <Button asChild className="mt-4">
          <Link href="/student/homework">Вернуться к списку</Link>
        </Button>
      </div>
    )
  }

  const statusInfo = getStatusInfo()
  const overdue = isOverdue(homework.deadline)
  const StatusIcon = statusInfo.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/student/homework">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {homework.title}
            </h1>
            <p className="text-gray-600 mt-2">
              {homework.subject?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <StatusIcon className="h-5 w-5" />
          <Badge variant={statusInfo.color}>
            {statusInfo.text}
          </Badge>
        </div>
      </div>

      {/* Homework Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
            Информация о задании
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Описание */}
          {homework.description && (
            <div>
              <Label className="text-sm font-medium">Описание:</Label>
              <p className="text-gray-700 mt-1">{homework.description}</p>
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

          {/* Дедлайн */}
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Дедлайн: {formatDate(homework.deadline)}
            </span>
            {overdue && (
              <Badge variant="destructive" className="text-xs">
                Просрочено
              </Badge>
            )}
          </div>

          {/* Ссылка на задание */}
          {homework.taskUrl && (
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-4 w-4 text-gray-400" />
              <a 
                href={homework.taskUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Открыть задание
              </a>
            </div>
          )}

          {/* Дополнительные материалы */}
          {homework.materials && Array.isArray(homework.materials) && homework.materials.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Дополнительные материалы:</Label>
              <div className="mt-2 space-y-2">
                {homework.materials.map((material: any, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {material.name}
                    </a>
                    <Badge variant="outline" className="text-xs">
                      {material.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Form */}
      {statusInfo.status !== 'reviewed' && (
        <Card>
          <CardHeader>
            <CardTitle>Сдача домашнего задания</CardTitle>
            <CardDescription>
              {statusInfo.status === 'not_submitted' 
                ? 'Напишите содержание работы или укажите ссылку на выполненное задание'
                : 'Обновите содержание работы или ссылку на выполненное задание'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HomeworkSubmissionForm
              homeworkId={id}
              existingSubmission={submission}
              onSuccess={() => {
                fetchHomework()
              }}
              isOverdue={overdue}
            />
          </CardContent>
        </Card>
      )}

      {/* Review Results */}
      {submission && submission.status === 'REVIEWED' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Результаты проверки
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {submission.grade && (
              <div>
                <Label className="text-sm font-medium">Оценка:</Label>
                <p className="text-2xl font-bold text-green-600 mt-1">{submission.grade}</p>
              </div>
            )}
            
            {submission.comment && (
              <div>
                <Label className="text-sm font-medium">Комментарий преподавателя:</Label>
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <MarkdownViewer content={submission.comment} />
                </div>
              </div>
            )}

            {submission.feedback && (
              <div>
                <Label className="text-sm font-medium">Развернутая обратная связь:</Label>
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <MarkdownViewer content={submission.feedback} />
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500">
              Проверено: {submission.reviewedAt ? formatDate(submission.reviewedAt) : 'Не указано'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Моя работа с комментариями лектора */}
      {submission && submission.content && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Моя работа с комментариями преподавателя
          </h3>
          <InlineCommentViewer
            content={submission.content}
            submissionId={submission.id}
            homeworkId={id}
            canComment={false}
          />
        </div>
      )}
    </div>
  )
}
