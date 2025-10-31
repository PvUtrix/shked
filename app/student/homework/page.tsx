'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Clock, 
  Calendar,
  ExternalLink,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { Homework } from '@/lib/types'
import Link from 'next/link'

export default function StudentHomeworkPage() {
  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSubject, setFilterSubject] = useState<string>('')

  useEffect(() => {
    fetchHomework()
  }, [])

  const fetchHomework = async () => {
    try {
      const response = await fetch('/api/homework')
      if (response.ok) {
        const data = await response.json()
        setHomework(data.homework || [])
      }
    } catch (error) {
      console.error('Ошибка при получении домашних заданий:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const getSubmissionStatus = (submissions: any[]) => {
    if (!Array.isArray(submissions) || submissions.length === 0) {
      return { status: 'not_submitted', text: 'Не сдано', color: 'secondary' as const }
    }
    
    const submission = submissions[0]
    switch (submission.status) {
      case 'SUBMITTED':
        return { status: 'submitted', text: 'Сдано', color: 'default' as const }
      case 'REVIEWED':
        return { status: 'reviewed', text: 'Проверено', color: 'default' as const }
      default:
        return { status: 'not_submitted', text: 'Не сдано', color: 'secondary' as const }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reviewed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'submitted':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'not_submitted':
        return <XCircle className="h-4 w-4 text-gray-400" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const filteredHomework = Array.isArray(homework) ? homework.filter(hw => {
    const submissionStatus = getSubmissionStatus(hw.submissions || [])
    const matchesStatus = filterStatus === 'all' || submissionStatus.status === filterStatus
    const matchesSubject = !filterSubject || hw.subjectId === filterSubject
    
    return matchesStatus && matchesSubject
  }) : []

  // Сортируем по дедлайну (ближайшие первыми)
  const sortedHomework = filteredHomework.sort((a, b) => {
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем домашние задания...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Мои домашние задания
        </h1>
        <p className="text-gray-600 mt-2">
          Просматривайте и сдавайте домашние задания
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">Все задания</option>
                <option value="not_submitted">Не сдано</option>
                <option value="submitted">Сдано</option>
                <option value="reviewed">Проверено</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Homework List */}
      {sortedHomework.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Домашние задания не найдены</p>
              <p className="text-gray-400">На данный момент у вас нет домашних заданий</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {sortedHomework.map((hw) => {
            const submissionStatus = getSubmissionStatus(hw.submissions || [])
            const overdue = isOverdue(hw.deadline)
            
            return (
              <Card key={hw.id} className={`card-hover ${overdue && submissionStatus.status === 'not_submitted' ? 'border-red-200 bg-red-50' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {hw.title}
                      </CardTitle>
                      {hw.description && (
                        <CardDescription className="line-clamp-2 mt-1">
                          {hw.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(submissionStatus.status)}
                      <Badge variant={submissionStatus.color}>
                        {submissionStatus.text}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Предмет */}
                    <div className="flex items-center space-x-2 text-sm">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{hw.subject?.name}</span>
                    </div>

                    {/* Дедлайн */}
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Дедлайн: {formatDate(hw.deadline)}
                      </span>
                      {overdue && (
                        <Badge variant="destructive" className="text-xs">
                          Просрочено
                        </Badge>
                      )}
                    </div>

                    {/* Ссылка на задание */}
                    {hw.taskUrl && (
                      <div className="flex items-center space-x-2 text-sm">
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                        <a 
                          href={hw.taskUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Открыть задание
                        </a>
                      </div>
                    )}

                    {/* Дополнительные материалы */}
                    {Array.isArray(hw.materials) && hw.materials.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">Дополнительные материалы:</p>
                        <div className="flex flex-wrap gap-2">
                          {hw.materials.map((material: any, index: number) => (
                            <a
                              key={index}
                              href={material.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              {material.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Информация о сдаче */}
                    {Array.isArray(hw.submissions) && hw.submissions.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="text-sm text-gray-600">
                          {hw.submissions[0].grade && (
                            <p>Оценка: <span className="font-medium">{hw.submissions[0].grade}</span></p>
                          )}
                          {hw.submissions[0].comment && (
                            <p className="mt-1">Комментарий: {hw.submissions[0].comment}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Кнопка действия */}
                    <div className="flex justify-end pt-2">
                      <Button asChild>
                        <Link href={`/student/homework/${hw.id}`}>
                          {submissionStatus.status === 'not_submitted' ? 'Сдать задание' : 'Просмотреть'}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
