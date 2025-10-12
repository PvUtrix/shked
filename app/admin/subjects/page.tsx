
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Plus, Edit, Trash2, User } from 'lucide-react'

interface Subject {
  id: string
  name: string
  description?: string
  instructor?: string
  _count?: {
    schedules: number
  }
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      // В реальном приложении здесь был бы API запрос
      // Пока используем статические данные
      setSubjects([
        {
          id: '1',
          name: 'Проектирование венчурного предприятия (Тьюториал)',
          description: 'Тьюториал по проектированию венчурного предприятия',
          instructor: 'Чикин В.Н., Бахчиев А.В.',
          _count: { schedules: 5 }
        },
        {
          id: '2',
          name: 'Системное мышление',
          description: 'Развитие системного мышления',
          instructor: 'Бухарин М.А., Бодров В.К.',
          _count: { schedules: 8 }
        },
        {
          id: '3',
          name: 'Коммерциализация R&D',
          description: 'Коммерциализация исследований и разработок',
          instructor: 'Антонец В.А., Буренин А.Г.',
          _count: { schedules: 6 }
        }
      ])
    } catch (error) {
      console.error('Ошибка при получении предметов:', error)
      setSubjects([])
    } finally {
      setLoading(false)
    }
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
        <Button onClick={() => alert('Функция добавления предмета будет реализована в следующей версии')}>
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
                <Button onClick={() => alert('Функция добавления предмета будет реализована в следующей версии')}>
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
                      <Button variant="ghost" size="sm" onClick={() => alert('Функция редактирования предмета будет реализована в следующей версии')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => alert('Функция удаления предмета будет реализована в следующей версии')}>
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
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Занятий:</span>
                      <span className="font-medium">{subject?._count?.schedules || 0}</span>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" className="w-full" onClick={() => alert('Функция просмотра расписания по предмету будет реализована в следующей версии')}>
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
    </div>
  )
}
