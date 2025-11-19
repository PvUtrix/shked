'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  BookOpen,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  MessageSquare,
  Calendar,
  FileText
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
      name: string
    } | null
  }
}

export default function MentorThesisPage() {
  const router = useRouter()
  const [theses, setTheses] = useState<Thesis[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedThesis, setSelectedThesis] = useState<Thesis | null>(null)
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

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

  const handleOpenNotes = (thesis: Thesis) => {
    setSelectedThesis(thesis)
    setNotes(thesis.notes || '')
    setShowNotesDialog(true)
  }

  const handleSaveNotes = async () => {
    if (!selectedThesis) return

    setSaving(true)
    try {
      const response = await fetch('/api/thesis', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedThesis.id,
          notes,
        }),
      })

      if (response.ok) {
        toast.success('Заметки сохранены')
        setShowNotesDialog(false)
        fetchTheses()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Не удалось сохранить заметки')
      }
    } catch (error) {
      console.error('Ошибка при сохранении заметок:', error)
      toast.error('Произошла ошибка при сохранении')
    } finally {
      setSaving(false)
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

  const filteredTheses = theses.filter((thesis) => {
    const studentName = getFullName(thesis.student) || thesis.student.email
    const title = thesis.title || ''
    const searchLower = searchTerm.toLowerCase()
    return (
      studentName.toLowerCase().includes(searchLower) ||
      title.toLowerCase().includes(searchLower)
    )
  })

  const inProgressTheses = filteredTheses.filter(t => t.status === 'IN_PROGRESS')
  const submittedTheses = filteredTheses.filter(t => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(t.status))
  const defendedTheses = filteredTheses.filter(t => t.status === 'DEFENDED')

  const stats = [
    {
      title: 'Всего ВКР',
      value: theses.length,
      description: 'Под вашим руководством',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'В работе',
      value: inProgressTheses.length,
      description: 'Требуют внимания',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Защищено',
      value: defendedTheses.length,
      description: 'Завершено успешно',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ]

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
        <h1 className="text-3xl font-bold text-gray-900">Выпускные квалификационные работы</h1>
        <p className="text-gray-600 mt-2">Управление ВКР студентов под вашим руководством</p>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-3">
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

      {/* Поиск */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Поиск по студенту или названию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Табы */}
      <Tabs defaultValue="in_progress" className="space-y-4">
        <TabsList>
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
            inProgressTheses.map((thesis) => (
              <Card key={thesis.id} className="card-hover">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{thesis.title}</CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{getFullName(thesis.student) || thesis.student.email}</span>
                          {thesis.student.group && (
                            <Badge variant="outline">{thesis.student.group.name}</Badge>
                          )}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(thesis.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Прогресс */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Прогресс выполнения</span>
                      <span className="text-sm font-semibold">{getCompletionPercentage(thesis)}%</span>
                    </div>
                    <Progress value={getCompletionPercentage(thesis)} />
                  </div>

                  {/* Статистика */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-900">
                        {thesis.milestones?.length || 0}
                      </div>
                      <div className="text-gray-500">Этапов</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-900">
                        {thesis.artifacts?.length || 0}
                      </div>
                      <div className="text-gray-500">Артефактов</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-900">
                        {thesis.milestones?.filter(m => m.status === 'completed').length || 0}
                      </div>
                      <div className="text-gray-500">Завершено</div>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/mentor/thesis/${thesis.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Подробнее
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenNotes(thesis)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Заметки
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4">
          {submittedTheses.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Нет ВКР на проверке</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            submittedTheses.map((thesis) => (
              <Card key={thesis.id} className="card-hover">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{thesis.title}</CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{getFullName(thesis.student) || thesis.student.email}</span>
                          {thesis.student.group && (
                            <Badge variant="outline">{thesis.student.group.name}</Badge>
                          )}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(thesis.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {thesis.abstract && (
                    <p className="text-sm text-gray-600 line-clamp-2">{thesis.abstract}</p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/mentor/thesis/${thesis.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Подробнее
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenNotes(thesis)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Заметки
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

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
            defendedTheses.map((thesis) => (
              <Card key={thesis.id} className="card-hover">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{thesis.title}</CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{getFullName(thesis.student) || thesis.student.email}</span>
                          {thesis.student.group && (
                            <Badge variant="outline">{thesis.student.group.name}</Badge>
                          )}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(thesis.status)}
                      {thesis.grade && (
                        <Badge variant="outline" className="bg-green-50">
                          Оценка: {thesis.grade}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {thesis.defenseDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Защита: {new Date(thesis.defenseDate).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/mentor/thesis/${thesis.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Подробнее
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Диалог заметок */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Заметки научного руководителя</DialogTitle>
            <DialogDescription>
              {selectedThesis && `${getFullName(selectedThesis.student)} - ${selectedThesis.title}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Введите заметки для студента..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveNotes} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Сохранить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
