'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

type Subject = {
  id: string
  name: string
}

export default function LectorSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSubject, setFilterSubject] = useState<string>('')
  const [filterWeek, setFilterWeek] = useState<string>('current')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Получаем расписание
      const schedulesResponse = await fetch('/api/schedules?lector=true')
      if (schedulesResponse.ok) {
        const schedulesData = await schedulesResponse.json()
        setSchedules(schedulesData.schedules || [])
      }

      // Получаем предметы преподавателя
      const subjectsResponse = await fetch('/api/subjects?lector=true')
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json()
        setSubjects(subjectsData.subjects || [])
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
    const matchesSubject = !filterSubject || schedule.subject.id === filterSubject
    return matchesSubject
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
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
            Мое расписание
          </h1>
          <p className="text-gray-600 mt-2">
            Расписание ваших занятий и мероприятий
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
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="">Все предметы</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
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
                Занятия по вашим предметам пока не запланированы
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
                    <Calendar className="h-5 w-5 text-purple-600" />
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
