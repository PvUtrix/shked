'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  User, 
  Mail, 
  Users,
  Search,
  Filter,
  MessageCircle,
  Eye
} from 'lucide-react'
import Link from 'next/link'

// Типы для студентов
type Student = {
  id: string
  name?: string
  email: string
  firstName?: string
  lastName?: string
  groupId?: string
  group?: {
    id: string
    name: string
  }
  canHelp?: string
  lookingFor?: string
  createdAt: Date
}

type Group = {
  id: string
  name: string
}

export default function MentorStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filterGroup, setFilterGroup] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Получаем студентов из групп ментора
      const studentsResponse = await fetch('/api/users?mentor=true&role=student')
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        setStudents(studentsData.users || [])
      }

      // Получаем группы ментора
      const groupsResponse = await fetch('/api/groups?mentor=true')
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

  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesGroup = !filterGroup || student.groupId === filterGroup
    
    return matchesSearch && matchesGroup
  })

  const formatDate = (date: string | Date) => {
    try {
      return new Date(date).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return 'Дата не указана'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем студентов...</p>
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
            Мои студенты
          </h1>
          <p className="text-gray-600 mt-2">
            Список студентов в ваших группах
          </p>
        </div>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Поиск по имени или email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="">Все группы</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список студентов */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Студенты не найдены</p>
              <p className="text-gray-400">
                В ваших группах пока нет студентов
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <User className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Без имени'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{student.email}</span>
                        </div>
                        {student.group && (
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{student.group.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Написать
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/mentor/students/${student.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Профиль
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Дополнительная информация */}
                {(student.canHelp || student.lookingFor) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {student.canHelp && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Может помочь:</p>
                          <p className="text-sm text-gray-600">{student.canHelp}</p>
                        </div>
                      )}
                      {student.lookingFor && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Ищет помощь в:</p>
                          <p className="text-sm text-gray-600">{student.lookingFor}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Зарегистрирован: {formatDate(student.createdAt)}</span>
                    <Badge variant="outline">Студент</Badge>
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
