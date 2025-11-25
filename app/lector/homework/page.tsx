'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  ExternalLink,
  Filter,
  Search,
  Eye,
  Copy,
  Check,
  Power,
  PowerOff,
  Archive
} from 'lucide-react'
import { Homework, HOMEWORK_STATUS_TYPES, HomeworkStatus } from '@/lib/types'
import Link from 'next/link'
import { toast } from 'sonner'

// Временные типы для совместимости
type Subject = {
  id: string
  name: string
  instructor?: string
}

type Group = {
  id: string
  name: string
  description?: string
}

export default function LectorHomeworkPage() {
  const [homework, setHomework] = useState<Homework[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSubject, setFilterSubject] = useState<string>('')
  const [filterGroup, setFilterGroup] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Получаем домашние задания (только для предметов преподавателя)
      const homeworkResponse = await fetch('/api/homework?lector=true')
      if (homeworkResponse.ok) {
        const homeworkData = await homeworkResponse.json()
        setHomework(homeworkData.homework || [])
      }

      // Получаем предметы преподавателя
      const subjectsResponse = await fetch('/api/subjects?lector=true')
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json()
        setSubjects(subjectsData.subjects || [])
      }

      // Получаем группы
      const groupsResponse = await fetch('/api/groups')
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json()
        setGroups(groupsData.groups || [])
      }
    } catch (error) {
      console.error('Ошибка при получении данных:', error)
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

  const getStatusColor = (deadline: string | Date, submissions: any[]) => {
    if (isOverdue(deadline)) {
      return 'destructive'
    }
    if (submissions.length === 0) {
      return 'secondary'
    }
    return 'default'
  }

  const getStatusText = (deadline: string | Date, submissions: any[]) => {
    if (isOverdue(deadline)) {
      return 'Просрочено'
    }
    if (submissions.length === 0) {
      return 'Не сдано'
    }
    return `Сдано: ${submissions.length}`
  }

  const getHomeworkStatusColor = (status: HomeworkStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'secondary'
      case 'ACTIVE':
        return 'default'
      case 'ARCHIVED':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const copyHomeworkLink = async (homeworkId: string) => {
    const url = `${window.location.origin}/student/homework/${homeworkId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(homeworkId)
      toast.success('Ссылка скопирована')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Не удалось скопировать ссылку')
    }
  }

  const updateHomeworkStatus = async (homeworkId: string, newStatus: HomeworkStatus) => {
    try {
      const response = await fetch(`/api/homework/${homeworkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setHomework(prev => prev.map(hw =>
          hw.id === homeworkId ? { ...hw, status: newStatus } : hw
        ))
        toast.success(`Статус изменен на "${HOMEWORK_STATUS_TYPES[newStatus]}"`)
      } else {
        toast.error('Не удалось изменить статус')
      }
    } catch {
      toast.error('Произошла ошибка')
    }
  }

  const filteredHomework = Array.isArray(homework) ? homework.filter(hw => {
    const matchesSubject = !filterSubject || hw.subjectId === filterSubject
    const matchesGroup = !filterGroup || hw.groupId === filterGroup
    const matchesStatus = !filterStatus || hw.status === filterStatus
    const matchesSearch = !searchTerm ||
      hw.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hw.description?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSubject && matchesGroup && matchesStatus && matchesSearch
  }) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем домашние задания...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Домашние задания
          </h1>
          <p className="text-gray-600 mt-2">
            Управление домашними заданиями по вашим предметам
          </p>
        </div>
        <Button asChild>
          <Link href="/lector/homework/create">
            <Plus className="h-4 w-4 mr-2" />
            Создать задание
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Поиск по названию или описанию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm w-64"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="">Все предметы</option>
                {Array.isArray(subjects) && subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="">Все группы</option>
                {Array.isArray(groups) && groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Power className="h-4 w-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="">Все статусы</option>
                <option value="DRAFT">Черновик</option>
                <option value="ACTIVE">Активное</option>
                <option value="ARCHIVED">В архиве</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Homework List */}
      {filteredHomework.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Домашние задания не найдены</p>
              <p className="text-gray-400 mb-6">Создайте первое домашнее задание</p>
              <Button asChild>
                <Link href="/lector/homework/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Создать первое задание
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredHomework.map((hw) => (
            <Card key={hw.id} className={`card-hover ${hw.status === 'ARCHIVED' ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg line-clamp-2">
                        {hw.title}
                      </CardTitle>
                      <Badge variant={getHomeworkStatusColor(hw.status || 'ACTIVE')}>
                        {HOMEWORK_STATUS_TYPES[hw.status || 'ACTIVE']}
                      </Badge>
                    </div>
                    {hw.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {hw.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {/* Кнопка копирования ссылки */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyHomeworkLink(hw.id)}
                      title="Копировать ссылку"
                    >
                      {copiedId === hw.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Кнопки смены статуса */}
                    {hw.status === 'DRAFT' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateHomeworkStatus(hw.id, 'ACTIVE')}
                        title="Активировать"
                        className="text-green-600 hover:text-green-700"
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    )}
                    {hw.status === 'ACTIVE' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateHomeworkStatus(hw.id, 'DRAFT')}
                          title="В черновик"
                          className="text-yellow-600 hover:text-yellow-700"
                        >
                          <PowerOff className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateHomeworkStatus(hw.id, 'ARCHIVED')}
                          title="В архив"
                          className="text-gray-500 hover:text-gray-600"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {hw.status === 'ARCHIVED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateHomeworkStatus(hw.id, 'ACTIVE')}
                        title="Восстановить"
                        className="text-green-600 hover:text-green-700"
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/lector/homework/${hw.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/lector/homework/${hw.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => alert('Функция удаления будет реализована')}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Предмет и группа */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{hw.subject?.name}</span>
                      </div>
                      {hw.group && (
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{hw.group.name}</span>
                        </div>
                      )}
                    </div>
                    <Badge variant={getStatusColor(hw.deadline, hw.submissions || [])}>
                      {getStatusText(hw.deadline, hw.submissions || [])}
                    </Badge>
                  </div>

                  {/* Дедлайн */}
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Дедлайн: {formatDate(hw.deadline)}
                    </span>
                    {isOverdue(hw.deadline) && (
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

                  {/* Статистика сдач */}
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-gray-500">
                      Сдано: {hw.submissions?.length || 0} из {hw.group?.name || 'N/A'}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/lector/homework/${hw.id}`}>
                        Проверить работы
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
