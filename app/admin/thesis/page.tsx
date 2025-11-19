'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BookOpen,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Search,
  Filter,
  GraduationCap,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'
import { getFullName } from '@/lib/utils'

interface Thesis {
  id: string
  studentId: string
  supervisorId: string
  title: string
  abstract: string | null
  status: string
  milestones: Array<{
    id: string
    title: string
    description: string
    deadline: string
    status: 'pending' | 'in_progress' | 'completed'
  }>
  artifacts: Array<{
    id: string
    title: string
    type: string
    url: string
    uploadedAt: string
  }>
  defenseDate: string | null
  grade: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  student: {
    id: string
    firstName: string | null
    lastName: string | null
    middleName: string | null
    email: string
    group: {
      id: string
      name: string
    } | null
  }
  supervisor: {
    id: string
    firstName: string | null
    lastName: string | null
    middleName: string | null
    email: string
  }
}

export default function AdminThesisPage() {
  const router = useRouter()
  const [theses, setTheses] = useState<Thesis[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [groupFilter, setGroupFilter] = useState<string>('all')

  useEffect(() => {
    fetchTheses()
  }, [])

  const fetchTheses = async () => {
    try {
      const response = await fetch('/api/thesis')
      if (response.ok) {
        const data = await response.json()
        setTheses(data.theses || [])
      } else {
        toast.error('Не удалось загрузить ВКР')
      }
    } catch (error) {
      console.error('Ошибка при загрузке ВКР:', error)
      toast.error('Произошла ошибка при загрузке')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      IN_PROGRESS: { label: 'В работе', variant: 'default' },
      SUBMITTED: { label: 'Подано', variant: 'secondary' },
      UNDER_REVIEW: { label: 'На проверке', variant: 'outline' },
      APPROVED: { label: 'Одобрено', variant: 'outline' },
      DEFENDED: { label: 'Защищено', variant: 'outline' },
    }
    const { label, variant } = statusMap[status] || { label: status, variant: 'outline' as const }
    return <Badge variant={variant}>{label}</Badge>
  }

  const getCompletionPercentage = (thesis: Thesis) => {
    if (!thesis.milestones || thesis.milestones.length === 0) return 0
    const completed = thesis.milestones.filter((m) => m.status === 'completed').length
    return Math.round((completed / thesis.milestones.length) * 100)
  }

  // Фильтрация
  const filteredTheses = theses.filter((thesis) => {
    const studentName = getFullName(thesis.student) || thesis.student.email
    const supervisorName = getFullName(thesis.supervisor) || thesis.supervisor.email
    const title = thesis.title || ''
    const searchLower = searchTerm.toLowerCase()

    const matchesSearch =
      studentName.toLowerCase().includes(searchLower) ||
      supervisorName.toLowerCase().includes(searchLower) ||
      title.toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === 'all' || thesis.status === statusFilter
    const matchesGroup = groupFilter === 'all' || thesis.student.group?.id === groupFilter

    return matchesSearch && matchesStatus && matchesGroup
  })

  // Группировка по статусу
  const inProgressTheses = filteredTheses.filter(t => t.status === 'IN_PROGRESS')
  const submittedTheses = filteredTheses.filter(t => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(t.status))
  const defendedTheses = filteredTheses.filter(t => t.status === 'DEFENDED')
  const allTheses = filteredTheses

  // Уникальные группы
  const uniqueGroups = Array.from(
    new Set(theses.map(t => t.student.group).filter(g => g !== null))
  ).filter((g): g is NonNullable<typeof g> => g !== null)

  // Статистика
  const stats = [
    {
      title: 'Всего ВКР',
      value: theses.length,
      description: 'В системе',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'В работе',
      value: theses.filter(t => t.status === 'IN_PROGRESS').length,
      description: 'Активных работ',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'На проверке',
      value: theses.filter(t => ['SUBMITTED', 'UNDER_REVIEW'].includes(t.status)).length,
      description: 'Требуют внимания',
      icon: AlertCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Защищено',
      value: defendedTheses.length,
      description: 'Завершено',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ]

  // Средний прогресс
  const avgProgress = theses.length > 0
    ? Math.round(theses.reduce((sum, t) => sum + getCompletionPercentage(t), 0) / theses.length)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Управление ВКР</h1>
        <p className="text-gray-600 mt-2">Обзор всех выпускных квалификационных работ</p>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Дополнительная статистика */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Общий прогресс
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Средний прогресс по всем ВКР</span>
              <span className="text-sm font-semibold">{avgProgress}%</span>
            </div>
            <Progress value={avgProgress} />
            <p className="text-xs text-gray-500 mt-2">
              {theses.filter(t => getCompletionPercentage(t) === 100).length} из {theses.length} работ
              завершены полностью
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Поиск по студенту, руководителю или названию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="IN_PROGRESS">В работе</SelectItem>
                <SelectItem value="SUBMITTED">Подано</SelectItem>
                <SelectItem value="UNDER_REVIEW">На проверке</SelectItem>
                <SelectItem value="APPROVED">Одобрено</SelectItem>
                <SelectItem value="DEFENDED">Защищено</SelectItem>
              </SelectContent>
            </Select>
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Группа" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все группы</SelectItem>
                {uniqueGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Табы */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Все ({allTheses.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            В работе ({inProgressTheses.length})
          </TabsTrigger>
          <TabsTrigger value="submitted">
            На проверке ({submittedTheses.length})
          </TabsTrigger>
          <TabsTrigger value="defended">
            Защищено ({defendedTheses.length})
          </TabsTrigger>
        </TabsList>

        {/* Все ВКР */}
        <TabsContent value="all" className="space-y-4">
          {allTheses.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== 'all' || groupFilter !== 'all'
                      ? 'Ничего не найдено'
                      : 'Нет зарегистрированных ВКР'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {allTheses.map((thesis) => (
                <Card key={thesis.id} className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{thesis.title}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{getFullName(thesis.student) || thesis.student.email}</span>
                              </div>
                              {thesis.student.group && (
                                <Badge variant="outline">{thesis.student.group.name}</Badge>
                              )}
                              <span>•</span>
                              <span className="text-gray-500">
                                Научрук: {getFullName(thesis.supervisor) || thesis.supervisor.email}
                              </span>
                            </div>
                          </div>
                          {getStatusBadge(thesis.status)}
                        </div>

                        {/* Прогресс */}
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Progress value={getCompletionPercentage(thesis)} className="h-2" />
                          </div>
                          <span className="text-sm font-medium text-gray-600 min-w-[3rem]">
                            {getCompletionPercentage(thesis)}%
                          </span>
                        </div>

                        {/* Метрики */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{thesis.milestones?.length || 0} этапов</span>
                          <span>•</span>
                          <span>{thesis.artifacts?.length || 0} артефактов</span>
                          <span>•</span>
                          <span>
                            Обновлено: {new Date(thesis.updatedAt).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/thesis/${thesis.id}`)}
                        className="ml-4"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Подробнее
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* В работе */}
        <TabsContent value="in_progress" className="space-y-4">
          {inProgressTheses.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Нет ВКР в работе</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {inProgressTheses.map((thesis) => (
                <Card key={thesis.id} className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-gray-900">{thesis.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>{getFullName(thesis.student) || thesis.student.email}</span>
                          {thesis.student.group && (
                            <Badge variant="outline">{thesis.student.group.name}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Progress value={getCompletionPercentage(thesis)} className="h-2" />
                          </div>
                          <span className="text-sm font-medium">{getCompletionPercentage(thesis)}%</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/thesis/${thesis.id}`)}
                        className="ml-4"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Подробнее
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* На проверке */}
        <TabsContent value="submitted" className="space-y-4">
          {submittedTheses.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Нет ВКР на проверке</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {submittedTheses.map((thesis) => (
                <Card key={thesis.id} className="card-hover border-purple-200 bg-purple-50/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{thesis.title}</h3>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                              <Users className="h-4 w-4" />
                              <span>{getFullName(thesis.student) || thesis.student.email}</span>
                              {thesis.student.group && (
                                <Badge variant="outline">{thesis.student.group.name}</Badge>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(thesis.status)}
                        </div>
                        {thesis.abstract && (
                          <p className="text-sm text-gray-600 line-clamp-2">{thesis.abstract}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/thesis/${thesis.id}`)}
                        className="ml-4"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Подробнее
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Защищено */}
        <TabsContent value="defended" className="space-y-4">
          {defendedTheses.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Нет защищённых ВКР</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {defendedTheses.map((thesis) => (
                <Card key={thesis.id} className="card-hover border-green-200 bg-green-50/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{thesis.title}</h3>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                              <Users className="h-4 w-4" />
                              <span>{getFullName(thesis.student) || thesis.student.email}</span>
                              {thesis.student.group && (
                                <Badge variant="outline">{thesis.student.group.name}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(thesis.status)}
                            {thesis.grade && (
                              <Badge variant="outline" className="bg-green-100">
                                {thesis.grade}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/thesis/${thesis.id}`)}
                        className="ml-4"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Подробнее
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
