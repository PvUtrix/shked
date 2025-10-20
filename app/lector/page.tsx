'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Users, 
  Calendar,
  ClipboardList,
  Plus,
  Edit,
  Eye
} from 'lucide-react'
import Link from 'next/link'

// Типы для предметов
type Subject = {
  id: string
  name: string
  description?: string
  instructor?: string
  createdAt: Date
  updatedAt: Date
  _count?: {
    schedules: number
    homework: number
  }
}

export default function LectorPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects?lector=true')
      if (response.ok) {
        const data = await response.json()
        setSubjects(data.subjects || [])
      }
    } catch (error) {
      console.error('Ошибка при получении предметов:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем ваши предметы...</p>
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
            Мои предметы
          </h1>
          <p className="text-gray-600 mt-2">
            Управление вашими дисциплинами и расписанием
          </p>
        </div>
        <Button asChild>
          <Link href="/lector/schedule">
            <Calendar className="h-4 w-4 mr-2" />
            Посмотреть расписание
          </Link>
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
                <p className="text-gray-600">Предметов</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {subjects.reduce((sum, subject) => sum + (subject._count?.schedules || 0), 0)}
                </p>
                <p className="text-gray-600">Занятий</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <ClipboardList className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {subjects.reduce((sum, subject) => sum + (subject._count?.homework || 0), 0)}
                </p>
                <p className="text-gray-600">Домашних заданий</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список предметов */}
      {subjects.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Предметы не назначены</p>
              <p className="text-gray-400 mb-6">
                Обратитесь к администратору для назначения предметов
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {subjects.map((subject) => (
            <Card key={subject.id} className="card-hover">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {subject.name}
                    </CardTitle>
                    {subject.description && (
                      <CardDescription className="mt-1">
                        {subject.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/lector/schedule?subject=${subject.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Статистика предмета */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {subject._count?.schedules || 0} занятий
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ClipboardList className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {subject._count?.homework || 0} заданий
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/lector/schedule?subject=${subject.id}`}>
                          <Calendar className="h-4 w-4 mr-1" />
                          Расписание
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/lector/homework?subject=${subject.id}`}>
                          <ClipboardList className="h-4 w-4 mr-1" />
                          Задания
                        </Link>
                      </Button>
                    </div>
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
