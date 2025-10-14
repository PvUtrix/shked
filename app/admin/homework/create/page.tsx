'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Calendar, 
  Link as LinkIcon, 
  Plus, 
  Trash2,
  Save,
  ArrowLeft
} from 'lucide-react'
import { HomeworkFormData, HOMEWORK_MATERIAL_TYPES } from '@/lib/types'
import Link from 'next/link'

export default function CreateHomeworkPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [formData, setFormData] = useState<HomeworkFormData>({
    title: '',
    description: '',
    taskUrl: '',
    deadline: '',
    materials: [],
    subjectId: '',
    groupId: ''
  })

  useEffect(() => {
    fetchSubjectsAndGroups()
  }, [])

  const fetchSubjectsAndGroups = async () => {
    try {
      // Получаем предметы
      const subjectsResponse = await fetch('/api/subjects')
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
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/homework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/admin/homework')
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Ошибка при создании домашнего задания:', error)
      alert('Ошибка при создании домашнего задания')
    } finally {
      setLoading(false)
    }
  }

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [
        ...(prev.materials || []),
        { name: '', url: '', type: 'document' }
      ]
    }))
  }

  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials?.filter((_, i) => i !== index) || []
    }))
  }

  const updateMaterial = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials?.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      ) || []
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/homework">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Создать домашнее задание
            </h1>
            <p className="text-gray-600 mt-2">
              Заполните форму для создания нового домашнего задания
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              Основная информация
            </CardTitle>
            <CardDescription>
              Заполните основную информацию о домашнем задании
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Название */}
            <div className="space-y-2">
              <Label htmlFor="title">Название задания *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Введите название домашнего задания"
                required
              />
            </div>

            {/* Описание */}
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Детальное описание задания"
                rows={3}
              />
            </div>

            {/* Ссылка на задание */}
            <div className="space-y-2">
              <Label htmlFor="taskUrl">Ссылка на задание</Label>
              <div className="flex items-center space-x-2">
                <LinkIcon className="h-4 w-4 text-gray-400" />
                <Input
                  id="taskUrl"
                  type="url"
                  value={formData.taskUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, taskUrl: e.target.value }))}
                  placeholder="https://example.com/task"
                />
              </div>
            </div>

            {/* Предмет */}
            <div className="space-y-2">
              <Label htmlFor="subjectId">Предмет *</Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
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

            {/* Группа */}
            <div className="space-y-2">
              <Label htmlFor="groupId">Группа</Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, groupId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите группу (опционально)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все группы</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Дедлайн */}
            <div className="space-y-2">
              <Label htmlFor="deadline">Дедлайн *</Label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Дополнительные материалы */}
        <Card>
          <CardHeader>
            <CardTitle>Дополнительные материалы</CardTitle>
            <CardDescription>
              Добавьте ссылки на дополнительные материалы для студентов
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.materials?.map((material, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-3 gap-2">
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
                    onValueChange={(value) => updateMaterial(index, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(HOMEWORK_MATERIAL_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
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

            <Button
              type="button"
              variant="outline"
              onClick={addMaterial}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить материал
            </Button>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" asChild>
            <Link href="/admin/homework">Отмена</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
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
    </div>
  )
}
