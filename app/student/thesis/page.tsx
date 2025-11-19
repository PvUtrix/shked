'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  GraduationCap,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Link as LinkIcon,
  Trash2,
  Edit,
  Save,
  X,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { getFullName } from '@/lib/utils'

interface Milestone {
  id: string
  name: string
  deadline: string
  status: 'not_started' | 'in_progress' | 'completed'
  completedAt?: string | null
  description?: string
}

interface Artifact {
  id: string
  type: string
  url: string
  uploadedAt: string
  description?: string
  fileName: string
}

interface Thesis {
  id: string
  title: string
  abstract?: string
  status: string
  milestones: Milestone[]
  artifacts: Artifact[]
  defenseDate?: string
  grade?: string
  notes?: string
  supervisor: {
    id: string
    firstName: string | null
    lastName: string | null
    middleName: string | null
    email: string
  }
  createdAt: string
  updatedAt: string
}

export default function StudentThesisPage() {
  const [thesis, setThesis] = useState<Thesis | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Состояние для редактирования
  const [editedTitle, setEditedTitle] = useState('')
  const [editedAbstract, setEditedAbstract] = useState('')

  // Диалоги
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false)
  const [artifactDialogOpen, setArtifactDialogOpen] = useState(false)

  // Новый этап
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    deadline: '',
    description: '',
  })

  // Новый артефакт
  const [newArtifact, setNewArtifact] = useState({
    type: 'document',
    url: '',
    fileName: '',
    description: '',
  })

  useEffect(() => {
    fetchThesis()
  }, [])

  const fetchThesis = async () => {
    try {
      const response = await fetch('/api/thesis')
      if (response.ok) {
        const data = await response.json()
        if (data.theses && data.theses.length > 0) {
          const thesisData = data.theses[0]
          setThesis(thesisData)
          setEditedTitle(thesisData.title)
          setEditedAbstract(thesisData.abstract || '')
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке ВКР:', error)
      toast.error('Не удалось загрузить данные ВКР')
    } finally {
      setLoading(false)
    }
  }

  const saveThesis = async () => {
    if (!thesis) return

    setSaving(true)
    try {
      const response = await fetch(`/api/thesis?id=${thesis.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editedTitle,
          abstract: editedAbstract,
        }),
      })

      if (response.ok) {
        toast.success('Изменения сохранены')
        setEditing(false)
        await fetchThesis()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Не удалось сохранить изменения')
      }
    } catch (error) {
      console.error('Ошибка при сохранении:', error)
      toast.error('Произошла ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const addMilestone = async () => {
    if (!thesis || !newMilestone.name || !newMilestone.deadline) {
      toast.error('Заполните название и срок этапа')
      return
    }

    const milestone: Milestone = {
      id: `milestone_${Date.now()}`,
      name: newMilestone.name,
      deadline: newMilestone.deadline,
      status: 'not_started',
      description: newMilestone.description,
    }

    const updatedMilestones = [...(thesis.milestones || []), milestone]

    try {
      const response = await fetch(`/api/thesis?id=${thesis.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          milestones: updatedMilestones,
        }),
      })

      if (response.ok) {
        toast.success('Этап добавлен')
        setMilestoneDialogOpen(false)
        setNewMilestone({ name: '', deadline: '', description: '' })
        await fetchThesis()
      } else {
        toast.error('Не удалось добавить этап')
      }
    } catch (error) {
      console.error('Ошибка при добавлении этапа:', error)
      toast.error('Произошла ошибка')
    }
  }

  const updateMilestoneStatus = async (milestoneId: string, newStatus: Milestone['status']) => {
    if (!thesis) return

    const updatedMilestones = thesis.milestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            status: newStatus,
            completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
          }
        : m
    )

    try {
      const response = await fetch(`/api/thesis?id=${thesis.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          milestones: updatedMilestones,
        }),
      })

      if (response.ok) {
        toast.success('Статус этапа обновлён')
        await fetchThesis()
      }
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error)
    }
  }

  const addArtifact = async () => {
    if (!thesis || !newArtifact.url || !newArtifact.fileName) {
      toast.error('Заполните ссылку и название файла')
      return
    }

    const artifact: Artifact = {
      id: `artifact_${Date.now()}`,
      type: newArtifact.type,
      url: newArtifact.url,
      fileName: newArtifact.fileName,
      uploadedAt: new Date().toISOString(),
      description: newArtifact.description,
    }

    const updatedArtifacts = [...(thesis.artifacts || []), artifact]

    try {
      const response = await fetch(`/api/thesis?id=${thesis.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artifacts: updatedArtifacts,
        }),
      })

      if (response.ok) {
        toast.success('Артефакт добавлен')
        setArtifactDialogOpen(false)
        setNewArtifact({ type: 'document', url: '', fileName: '', description: '' })
        await fetchThesis()
      } else {
        toast.error('Не удалось добавить артефакт')
      }
    } catch (error) {
      console.error('Ошибка при добавлении артефакта:', error)
      toast.error('Произошла ошибка')
    }
  }

  const getCompletionPercentage = () => {
    if (!thesis?.milestones || thesis.milestones.length === 0) return 0
    const completed = thesis.milestones.filter((m) => m.status === 'completed').length
    return Math.round((completed / thesis.milestones.length) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!thesis) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Выпускная квалификационная работа</h1>
          <p className="text-gray-600 mt-2">Управление вашей ВКР</p>
        </div>

        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">ВКР еще не создана</p>
              <p className="text-gray-400 mb-6">
                Обратитесь к куратору или администратору для создания вашей ВКР
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Моя ВКР</h1>
          <p className="text-gray-600 mt-2">
            Научный руководитель: {getFullName(thesis.supervisor) || thesis.supervisor.email}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={thesis.status === 'DEFENDED' ? 'default' : 'secondary'} className="text-sm">
            {getStatusLabel(thesis.status)}
          </Badge>
        </div>
      </div>

      {/* Основная информация */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Основная информация</CardTitle>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setEditing(false)
                  setEditedTitle(thesis.title)
                  setEditedAbstract(thesis.abstract || '')
                }}>
                  <X className="h-4 w-4 mr-2" />
                  Отмена
                </Button>
                <Button size="sm" onClick={saveThesis} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Сохранить
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Название</label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Введите название ВКР"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Аннотация</label>
                <Textarea
                  value={editedAbstract}
                  onChange={(e) => setEditedAbstract(e.target.value)}
                  placeholder="Краткое описание работы"
                  rows={4}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{thesis.title}</h3>
              </div>
              {thesis.abstract && (
                <div>
                  <p className="text-gray-600">{thesis.abstract}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Прогресс */}
      <Card>
        <CardHeader>
          <CardTitle>Прогресс выполнения</CardTitle>
          <CardDescription>
            Завершено {thesis.milestones?.filter((m) => m.status === 'completed').length || 0} из{' '}
            {thesis.milestones?.length || 0} этапов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={getCompletionPercentage()} className="h-3" />
          <p className="text-sm text-gray-600 mt-2 text-center">{getCompletionPercentage()}%</p>
        </CardContent>
      </Card>

      {/* Этапы работы */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Этапы работы</CardTitle>
            <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить этап
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новый этап</DialogTitle>
                  <DialogDescription>Добавьте этап выполнения ВКР</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Название этапа</label>
                    <Input
                      value={newMilestone.name}
                      onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                      placeholder="Например: Обзор литературы"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Срок выполнения</label>
                    <Input
                      type="date"
                      value={newMilestone.deadline}
                      onChange={(e) => setNewMilestone({ ...newMilestone, deadline: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Описание (необязательно)</label>
                    <Textarea
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                      placeholder="Детальное описание этапа"
                      rows={3}
                    />
                  </div>
                  <Button onClick={addMilestone} className="w-full">
                    Добавить этап
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {thesis.milestones && thesis.milestones.length > 0 ? (
            <div className="space-y-3">
              {thesis.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="mt-1">
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : milestone.status === 'in_progress' ? (
                      <Clock className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{milestone.name}</h4>
                      <div className="flex items-center space-x-2">
                        <select
                          value={milestone.status}
                          onChange={(e) => updateMilestoneStatus(milestone.id, e.target.value as Milestone['status'])}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="not_started">Не начат</option>
                          <option value="in_progress">В процессе</option>
                          <option value="completed">Завершён</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Срок: {new Date(milestone.deadline).toLocaleDateString('ru-RU')}
                    </p>
                    {milestone.description && (
                      <p className="text-sm text-gray-600 mt-2">{milestone.description}</p>
                    )}
                    {milestone.completedAt && (
                      <p className="text-sm text-green-600 mt-1">
                        Завершён: {new Date(milestone.completedAt).toLocaleDateString('ru-RU')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Этапы работы еще не добавлены</p>
          )}
        </CardContent>
      </Card>

      {/* Артефакты */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Материалы работы</CardTitle>
            <Dialog open={artifactDialogOpen} onOpenChange={setArtifactDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить материал
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новый материал</DialogTitle>
                  <DialogDescription>Добавьте ссылку на документ или презентацию</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Тип</label>
                    <select
                      value={newArtifact.type}
                      onChange={(e) => setNewArtifact({ ...newArtifact, type: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="document">Документ</option>
                      <option value="presentation">Презентация</option>
                      <option value="code">Код</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Название файла</label>
                    <Input
                      value={newArtifact.fileName}
                      onChange={(e) => setNewArtifact({ ...newArtifact, fileName: e.target.value })}
                      placeholder="thesis_draft.pdf"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ссылка</label>
                    <Input
                      value={newArtifact.url}
                      onChange={(e) => setNewArtifact({ ...newArtifact, url: e.target.value })}
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Описание (необязательно)</label>
                    <Textarea
                      value={newArtifact.description}
                      onChange={(e) => setNewArtifact({ ...newArtifact, description: e.target.value })}
                      placeholder="Краткое описание материала"
                      rows={2}
                    />
                  </div>
                  <Button onClick={addArtifact} className="w-full">
                    Добавить материал
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {thesis.artifacts && thesis.artifacts.length > 0 ? (
            <div className="space-y-2">
              {thesis.artifacts.map((artifact) => (
                <a
                  key={artifact.id}
                  href={artifact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{artifact.fileName}</p>
                      {artifact.description && (
                        <p className="text-sm text-gray-600">{artifact.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Загружено: {new Date(artifact.uploadedAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  <LinkIcon className="h-4 w-4 text-gray-400" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Материалы еще не добавлены</p>
          )}
        </CardContent>
      </Card>

      {/* Заметки научного руководителя */}
      {thesis.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Заметки научного руководителя</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{thesis.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    IN_PROGRESS: 'В процессе',
    SUBMITTED: 'Сдана',
    UNDER_REVIEW: 'На проверке',
    APPROVED: 'Одобрена',
    REJECTED: 'Отклонена',
    DEFENDED: 'Защищена',
  }
  return statusMap[status] || status
}
