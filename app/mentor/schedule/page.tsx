'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  BookOpen,
  Filter
} from 'lucide-react'

// Типы для расписания
type Schedule = {
  id: string
  date: Date
  dayOfWeek: number
  startTime: string
  endTime: string
  location?: string
  eventType?: string
  description?: string
  subject: {
    id: string
    name: string
  }
  group?: {
    id: string
    name: string
  }
}

type Group = {
  id: string
  name: string
}

export default function MentorSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [filterGroup, setFilterGroup] = useState<string>('')
  const [filterWeek, setFilterWeek] = useState<string>('current')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Получаем расписание для групп ментора
      const schedulesResponse = await fetch('/api/schedules?mentor=true')
      if (schedulesResponse.ok) {
        const schedulesData = await schedulesResponse.json()
        setSchedules(schedulesData.schedules || [])
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

  const formatTime = (time: string) => {
    return time.slice(0, 5) // Показываем только часы и минуты
  }

  const getDayName = (dayOfWeek: number) => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    return days[dayOfWeek] || 'Неизвестно'
  }

  const filteredSchedules = schedules.filter(schedule => {
    const matchesGroup = !filterGroup || schedule.group?.id === filterGroup
    return matchesGroup
  })

  // Группируем расписание по дням
  const groupedSchedules = filteredSchedules.reduce((acc, schedule) => {
    const date = new Date(schedule.date).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(schedule)
    return acc
  }, {} as Record<string, Schedule[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем расписание...</p>
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
            Расписание групп
          </h1>
          <p className="text-gray-600 mt-2">
            Расписание занятий ваших групп
          </p>
        </div>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
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

      {/* Расписание */}
      {Object.keys(groupedSchedules).length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Расписание не найдено</p>
              <p className="text-gray-400">
                Занятия для ваших групп пока не запланированы
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSchedules)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, daySchedules]) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <span>{formatDate(date)}</span>
                    <Badge variant="secondary">
                      {getDayName(new Date(date).getDay())}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {daySchedules
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((schedule) => (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium">
                                  {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <BookOpen className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {schedule.subject.name}
                                </span>
                              </div>
                              {schedule.group && (
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    {schedule.group.name}
                                  </span>
                                </div>
                              )}
                            </div>
                            {schedule.location && (
                              <div className="flex items-center space-x-1 mt-1">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {schedule.location}
                                </span>
                              </div>
                            )}
                            {schedule.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {schedule.description}
                              </p>
                            )}
                          </div>
                          {schedule.eventType && (
                            <Badge variant="outline">
                              {schedule.eventType}
                            </Badge>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
