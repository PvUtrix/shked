
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, Edit, Trash2 } from 'lucide-react'

interface Group {
  id: string
  name: string
  description?: string
  semester?: string
  year?: string
  _count?: {
    users: number
  }
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      // В реальном приложении здесь был бы API запрос
      // Пока используем статические данные
      setGroups([
        {
          id: '1',
          name: 'ТехПред МФТИ 2025-27',
          description: 'Магистратура Технологическое предпринимательство МФТИ 2025-27',
          semester: '1 семестр',
          year: '2025-27',
          _count: { users: 47 }
        }
      ])
    } catch (error) {
      console.error('Ошибка при получении групп:', error)
      setGroups([])
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
            Управление группами
          </h1>
          <p className="text-gray-600 mt-2">
            Создавайте и управляйте учебными группами студентов
          </p>
        </div>
        <Button onClick={() => alert('Функция создания группы будет реализована в следующей версии')}>
          <UserPlus className="h-4 w-4 mr-2" />
          Создать группу
        </Button>
      </div>

      {/* Groups List */}
      <div className="grid gap-6">
        {groups?.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">Групп не найдено</p>
                <p className="text-gray-400 mb-6">Создайте первую группу для начала работы</p>
                <Button onClick={() => alert('Функция создания группы будет реализована в следующей версии')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Создать первую группу
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups?.map((group, index) => (
              <Card key={group?.id || index} className="card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {group?.name || 'Группа без названия'}
                    </CardTitle>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => alert('Функция редактирования группы будет реализована в следующей версии')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => alert('Функция удаления группы будет реализована в следующей версии')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {group?.description || 'Описание не указано'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Студентов:</span>
                      <span className="font-medium">{group?._count?.users || 0}</span>
                    </div>
                    {group?.semester && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Семестр:</span>
                        <span className="font-medium">{group.semester}</span>
                      </div>
                    )}
                    {group?.year && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Год:</span>
                        <span className="font-medium">{group.year}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <Button variant="outline" className="w-full" onClick={() => alert('Функция управления студентами будет реализована в следующей версии')}>
                        <Users className="h-4 w-4 mr-2" />
                        Управлять студентами
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
