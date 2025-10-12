
'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Filter, List, CalendarDays } from 'lucide-react'

interface Schedule {
  id: string
  date: string
  startTime: string
  endTime: string
  location?: string
  description?: string
  subject: {
    name: string
    instructor?: string
  }
  group?: {
    name: string
  }
}

export default function StudentDashboard() {
  const { data: session } = useSession() || {}
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedDay, setSelectedDay] = useState<string>('all')

  useEffect(() => {
    fetchSchedules()
  }, [session])

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedules')
      if (response.ok) {
        const data = await response.json()
        setSchedules(data || [])
      }
    } catch (error) {
      console.error('Ошибка при получении расписания:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (time: string) => {
    return time || '00:00'
  }

  const getDayName = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', { weekday: 'long' })
    } catch {
      return 'Дата не указана'
    }
  }

  const filteredSchedules = schedules?.filter(schedule => {
    if (selectedDay === 'all') return true
    return getDayName(schedule?.date || '').toLowerCase().includes(selectedDay)
  }) || []

  const upcomingSchedules = filteredSchedules?.filter(schedule => {
    try {
      const scheduleDate = new Date(schedule?.date || '')
      const today = new Date()
      return scheduleDate >= today
    } catch {
      return false
    }
  }) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем расписание...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Мое расписание
        </h1>
        <p className="text-gray-600 mt-2">
          Добро пожаловать, {session?.user?.name || 'Студент'}! Вот ваше расписание занятий.
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">Все дни</option>
                <option value="понедельник">Понедельник</option>
                <option value="вторник">Вторник</option>
                <option value="среда">Среда</option>
                <option value="четверг">Четверг</option>
                <option value="пятница">Пятница</option>
                <option value="суббота">Суббота</option>
                <option value="воскресенье">Воскресенье</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-1" />
                Список
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                Календарь
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Display */}
      {viewMode === 'list' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-600" />
              Расписание занятий
            </CardTitle>
            <CardDescription>
              {filteredSchedules?.length || 0} занятий найдено
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSchedules?.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">Расписание не найдено</p>
                <p className="text-gray-400">На выбранные дни занятий пока нет</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSchedules?.map((schedule, index) => (
                  <div
                    key={schedule?.id || index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors card-hover"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {schedule?.subject?.name || 'Предмет не указан'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {schedule?.subject?.instructor || 'Преподаватель не указан'}
                        </p>
                        {schedule?.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {schedule.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatTime(schedule?.startTime)} - {formatTime(schedule?.endTime)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(schedule?.date || '')}
                      </p>
                      {schedule?.location && (
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          {schedule.location}
                        </div>
                      )}
                    </div>
                  </div>
                )) || []}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-green-600" />
              Календарный вид
            </CardTitle>
            <CardDescription>
              Расписание в календарном формате
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CalendarDays className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Календарный вид</p>
              <p className="text-gray-400">В разработке...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Ближайшие занятия
          </CardTitle>
          <CardDescription>
            Занятия на ближайшее время
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingSchedules?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Ближайших занятий не найдено
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingSchedules?.slice(0, 3).map((schedule, index) => (
                <div
                  key={schedule?.id || index}
                  className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {schedule?.subject?.name || 'Предмет не указан'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(schedule?.date || '')} • {formatTime(schedule?.startTime)} - {formatTime(schedule?.endTime)}
                    </p>
                  </div>
                </div>
              )) || []}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
