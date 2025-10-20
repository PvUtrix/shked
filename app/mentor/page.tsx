'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Calendar, 
  User,
  BookOpen,
  Eye
} from 'lucide-react'
import Link from 'next/link'

// Типы для групп
type Group = {
  id: string
  name: string
  description?: string
  semester?: string
  year?: string
  createdAt: Date
  _count?: {
    users: number
    schedules: number
  }
}

export default function MentorPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups?mentor=true')
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Ошибка при получении групп:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем ваши группы...</p>
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
            Мои группы
          </h1>
          <p className="text-gray-600 mt-2">
            Управление группами студентов и их успеваемостью
          </p>
        </div>
        <Button asChild>
          <Link href="/mentor/schedule">
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
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
                <p className="text-gray-600">Групп</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {groups.reduce((sum, group) => sum + (group._count?.users || 0), 0)}
                </p>
                <p className="text-gray-600">Студентов</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {groups.reduce((sum, group) => sum + (group._count?.schedules || 0), 0)}
                </p>
                <p className="text-gray-600">Занятий</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список групп */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Группы не назначены</p>
              <p className="text-gray-400 mb-6">
                Обратитесь к администратору для назначения групп
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {groups.map((group) => (
            <Card key={group.id} className="card-hover">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {group.name}
                    </CardTitle>
                    {group.description && (
                      <CardDescription className="mt-1">
                        {group.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/mentor/students?group=${group.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Информация о группе */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {group._count?.users || 0} студентов
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {group._count?.schedules || 0} занятий
                        </span>
                      </div>
                    </div>
                    {(group.semester || group.year) && (
                      <Badge variant="outline">
                        {group.semester} {group.year}
                      </Badge>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/mentor/schedule?group=${group.id}`}>
                          <Calendar className="h-4 w-4 mr-1" />
                          Расписание
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/mentor/students?group=${group.id}`}>
                          <User className="h-4 w-4 mr-1" />
                          Студенты
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/mentor/homework?group=${group.id}`}>
                          <BookOpen className="h-4 w-4 mr-1" />
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
