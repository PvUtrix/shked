
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Plus, Edit, Trash2, User, UserCheck } from 'lucide-react'
import { SubjectForm } from '@/components/admin/subject-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { getFullName } from '@/lib/utils'

interface Subject {
  id: string
  name: string
  description?: string
  instructor?: string
  lectorId?: string
  lector?: {
    id: string
    name?: string
    firstName?: string
    lastName?: string
    middleName?: string
    email: string
  }
  _count?: {
    schedules: number
    homework: number
  }
}

interface Lector {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  email: string
}

export default function SubjectsPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [lectors, setLectors] = useState<Lector[]>([])
  const [loading, setLoading] = useState(true)
  const [subjectFormOpen, setSubjectFormOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Получаем предметы
      const subjectsResponse = await fetch('/api/subjects')
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json()
        setSubjects(subjectsData.subjects || [])
      }

      // Получаем преподавателей
      const lectorsResponse = await fetch('/api/users?role=lector')
      if (lectorsResponse.ok) {
        const lectorsData = await lectorsResponse.json()
        setLectors(lectorsData.users || [])
      }
    } catch (error) {
      console.error('Ошибка при получении данных:', error)
    } finally {
      setLoading(false)
    }
  }

  const assignLector = async (subjectId: string, lectorId: string) => {
    try {
      const response = await fetch('/api/subjects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: subjectId,
          lectorId: lectorId === 'none' ? null : lectorId
        }),
      })

      if (response.ok) {
        await fetchData() // Обновляем данные
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.message || 'Не удалось назначить преподавателя'}`)
      }
    } catch (error) {
      console.error('Ошибка при назначении преподавателя:', error)
      alert('Произошла ошибка при назначении преподавателя')
    }
  }

  const handleCreateSubject = () => {
    setEditingSubject(null)
    setSubjectFormOpen(true)
  }

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject)
    setSubjectFormOpen(true)
  }

  const handleDeleteSubject = (subject: Subject) => {
    setSubjectToDelete(subject)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteSubject = async () => {
    if (!subjectToDelete) return

    try {
      const response = await fetch(`/api/subjects?id=${subjectToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Предмет удален')
        await fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при удалении предмета')
      }
    } catch (error) {
      console.error('Ошибка при удалении предмета:', error)
      toast.error('Произошла ошибка при удалении')
    } finally {
      setDeleteDialogOpen(false)
      setSubjectToDelete(null)
    }
  }

  const handleFormSuccess = () => {
    setEditingSubject(null) // Сбрасываем editingSubject после успешного сохранения
    fetchData() // Обновляем список предметов
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка предметов...</p>
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
            База предметов
          </h1>
          <p className="text-gray-600 mt-2">
            Управляйте предметами и их преподавателями
          </p>
        </div>
        <Button onClick={handleCreateSubject}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить предмет
        </Button>
      </div>

      {/* Subjects List */}
      <div className="grid gap-6">
        {subjects?.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">Предметы не найдены</p>
                <p className="text-gray-400 mb-6">Добавьте первый предмет для начала работы</p>
                <Button onClick={handleCreateSubject}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить первый предмет
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects?.map((subject, index) => (
              <Card key={subject?.id || index} className="card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg line-clamp-2">
                      {subject?.name || 'Предмет без названия'}
                    </CardTitle>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditSubject(subject)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteSubject(subject)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {subject?.description && (
                    <CardDescription className="line-clamp-2">
                      {subject.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {subject?.instructor && (
                      <div className="flex items-center space-x-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{subject.instructor}</span>
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Занятий:</span>
                        <span className="font-medium">{subject?._count?.schedules || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Заданий:</span>
                        <span className="font-medium">{subject?._count?.homework || 0}</span>
                      </div>
                    </div>

                    {/* Назначение преподавателя */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Преподаватель:</span>
                      </div>
                      <Select
                        value={subject?.lectorId || 'none'}
                        onValueChange={(value) => assignLector(subject.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Выберите преподавателя" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Без преподавателя</SelectItem>
                          {lectors.map(lector => (
                            <SelectItem key={lector.id} value={lector.id}>
                              {getFullName(lector) || lector.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {subject?.lector && (
                        <p className="text-xs text-gray-500">
                          Назначен: {subject.lector ? (getFullName(subject.lector) || subject.lector.email) : 'Не назначен'}
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => router.push(`/admin/schedule?subject=${subject.id}`)}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Посмотреть расписание
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) || []}
          </div>
        )}
      </div>

      {/* Форма предмета */}
      <SubjectForm
        open={subjectFormOpen}
        onOpenChange={(open) => {
          setSubjectFormOpen(open)
          if (!open) {
            // Сбрасываем editingSubject при закрытии формы
            setEditingSubject(null)
          }
        }}
        subject={editingSubject}
        onSuccess={handleFormSuccess}
      />

      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Удалить предмет"
        description={`Вы уверены, что хотите удалить предмет "${subjectToDelete?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={confirmDeleteSubject}
        variant="destructive"
      />
    </div>
  )
}
