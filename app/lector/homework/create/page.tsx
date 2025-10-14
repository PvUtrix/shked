'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BookOpen, 
  Save, 
  ArrowLeft,
  Plus,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Типы для формы
type Subject = {
  id: string
  name: string
}

type Group = {
  id: string
  name: string
}

type Material = {
  name: string
  url: string
  type: 'document' | 'video' | 'link' | 'other'
}

export default function CreateHomeworkPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Форма
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskUrl: '',
    deadline: '',
    subjectId: '',
    groupId: ''
  })
  
  const [materials, setMaterials] = useState<Material[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/homework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          materials: materials.length > 0 ? materials : undefined
        }),
      })

      if (response.ok) {
        router.push('/lector/homework')
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.message || 'Не удалось создать задание'}`)
      }
    } catch (error) {
      console.error('Ошибка при создании задания:', error)
      alert('Произошла ошибка при создании задания')
    } finally {
      setSubmitting(false)
    }
  }

  const addMaterial = () => {
    setMaterials([...materials, { name: '', url: '', type: 'document' }])
  }

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index))
  }

  const updateMaterial = (index: number, field: keyof Material, value: string) => {
    const updated = [...materials]
    updated[index] = { ...updated[index], [field]: value }
    setMaterials(updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем данные...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" asChild>
          <Link href="/lector/homework">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Создать домашнее задание
          </h1>
          <p className="text-gray-600 mt-2">
            Создайте новое домашнее задание для ваших студентов
          </p>
        </div>
      </div>

      {/* Форма */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о задании</CardTitle>
          <CardDescription>
            Заполните все необходимые поля для создания домашнего задания
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Основная информация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Название задания *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Введите название задания"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectId">Предмет *</Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                  required
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Опишите задание подробно..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="taskUrl">Ссылка на задание</Label>
                <Input
                  id="taskUrl"
                  type="url"
                  value={formData.taskUrl}
                  onChange={(e) => setFormData({ ...formData, taskUrl: e.target.value })}
                  placeholder="https://example.com/task"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Дедлайн *</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupId">Группа</Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) => setFormData({ ...formData, groupId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите группу (необязательно)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все группы</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Дополнительные материалы */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Дополнительные материалы</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить материал
                </Button>
              </div>

              {materials.map((material, index) => (
                <div key={index} className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
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
                    <Select
                      value={material.type}
                      onValueChange={(value: Material['type']) => updateMaterial(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Документ</SelectItem>
                        <SelectItem value="video">Видео</SelectItem>
                        <SelectItem value="link">Ссылка</SelectItem>
                        <SelectItem value="other">Другое</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMaterial(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Кнопки */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" asChild>
                <Link href="/lector/homework">Отмена</Link>
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Создание...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Создать задание
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
