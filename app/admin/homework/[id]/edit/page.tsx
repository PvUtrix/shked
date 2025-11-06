'use client'
import React from 'react'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { Homework, Subject, Group } from '@/lib/types'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Material {
  name: string
  url: string
}

export default function EditHomeworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [homework, setHomework] = useState<Homework | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskUrl: '',
    deadline: '',
    subjectId: '',
    groupId: '',
    materials: [] as Material[]
  })

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      // Загружаем домашнее задание
      const homeworkResponse = await fetch(`/api/homework/${id}`)
      if (homeworkResponse.ok) {
        const homeworkData = await homeworkResponse.json()
        setHomework(homeworkData)
        setFormData({
          title: homeworkData.title || '',
          description: homeworkData.description || '',
          taskUrl: homeworkData.taskUrl || '',
          deadline: homeworkData.deadline ? new Date(homeworkData.deadline).toISOString().slice(0, 16) : '',
          subjectId: homeworkData.subjectId || '',
          groupId: homeworkData.groupId || '',
          materials: homeworkData.materials || []
        })
      }

      // Загружаем предметы
      const subjectsResponse = await fetch('/api/subjects')
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json()
        setSubjects(subjectsData.subjects || [])
      }

      // Загружаем группы
      const groupsResponse = await fetch('/api/groups')
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json()
        setGroups(groupsData.groups || [])
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error)
      toast.error('Ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/homework/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Домашнее задание обновлено')
        router.push(`/admin/homework/${id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при обновлении задания')
      }
    } catch (error) {
      console.error('Ошибка при обновлении задания:', error)
      toast.error('Ошибка при обновлении задания')
    } finally {
      setSaving(false)
    }
  }

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { name: '', url: '' }]
    }))
  }

  const handleRemoveMaterial = (index: number) => {
    setMaterialToDelete(index)
    setDeleteDialogOpen(true)
  }

  const confirmRemoveMaterial = () => {
    if (materialToDelete === null) return
    
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== materialToDelete)
    }))
    
    setDeleteDialogOpen(false)
    setMaterialToDelete(null)
  }

  const updateMaterial = (index: number, field: keyof Material, value: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!homework) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Домашнее задание не найдено</h2>
        <Button asChild>
          <Link href="/admin/homework">
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
            <Link href={`/admin/homework/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Редактировать задание</h1>
            <p className="text-gray-600">{homework.title}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основная форма */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Название задания</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Введите название задания"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Опишите задание"
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="taskUrl">Ссылка на задание (опционально)</Label>
                  <Input
                    id="taskUrl"
                    type="url"
                    value={formData.taskUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, taskUrl: e.target.value }))}
                    placeholder="https://example.com/task"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Дополнительные материалы */}
            <Card>
              <CardHeader>
                <CardTitle>Дополнительные материалы</CardTitle>
                <CardDescription>
                  Добавьте файлы, ссылки или другие ресурсы для студентов
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.materials.map((material, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Название материала"
                        value={material.name}
                        onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="URL"
                        value={material.url}
                        onChange={(e) => updateMaterial(index, 'url', e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMaterial(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addMaterial}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить материал
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Настройки задания</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subject">Предмет</Label>
                  <Select
                    value={formData.subjectId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите предмет" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="group">Группа</Label>
                  <Select
                    value={formData.groupId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, groupId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите группу" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deadline">Дедлайн</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex space-x-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Сохранить
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Диалог подтверждения удаления материала */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Удалить материал"
        description={`Вы уверены, что хотите удалить материал "${formData.materials[materialToDelete || 0]?.name || 'без названия'}"?`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={confirmRemoveMaterial}
        variant="destructive"
      />
    </div>
  )
}
