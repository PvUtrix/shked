
'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'

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

export default function StudentCalendarPage() {
  const { data: session } = useSession() || {}
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

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

  const formatTime = (time: string) => {
    return time || '00:00'
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Добавляем пустые дни в начале
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Добавляем дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getSchedulesForDate = (date: Date | null) => {
    if (!date) return []
    
    const dateString = date.toISOString().split('T')[0]
    return schedules?.filter(schedule => {
      try {
        const scheduleDate = new Date(schedule?.date || '')
        const scheduleDateString = scheduleDate.toISOString().split('T')[0]
        return scheduleDateString === dateString
      } catch {
        return false
      }
    }) || []
  }

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]

  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

  const days = getDaysInMonth(currentDate)

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1)
    } else {
      newDate.setMonth(currentDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем календарь...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Календарь расписания
        </h1>
        <p className="text-gray-600 mt-2">
          Ваше расписание в календарном виде
        </p>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-green-600" />
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Сегодня
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const daySchedules = getSchedulesForDate(day)
              const isToday = day && 
                day.toDateString() === new Date().toDateString()
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border border-gray-200 rounded-md ${
                    !day ? 'bg-gray-50' : isToday ? 'bg-green-50' : 'bg-white'
                  }`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-green-700' : 'text-gray-900'
                      }`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {daySchedules?.slice(0, 2).map((schedule, scheduleIndex) => (
                          <div
                            key={schedule?.id || scheduleIndex}
                            className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                            title={`${schedule?.subject?.name || 'Предмет не указан'} (${formatTime(schedule?.startTime)} - ${formatTime(schedule?.endTime)})`}
                          >
                            {schedule?.subject?.name || 'Предмет не указан'}
                          </div>
                        )) || []}
                        {daySchedules && daySchedules.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{daySchedules.length - 2} еще
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Расписание на сегодня
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString('ru-RU', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const todaySchedules = getSchedulesForDate(new Date())
            
            if (todaySchedules?.length === 0) {
              return (
                <p className="text-gray-500 text-center py-4">
                  На сегодня занятий нет
                </p>
              )
            }
            
            return (
              <div className="space-y-3">
                {todaySchedules?.map((schedule, index) => (
                  <div
                    key={schedule?.id || index}
                    className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
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
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatTime(schedule?.startTime)} - {formatTime(schedule?.endTime)}
                      </div>
                      {schedule?.location && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {schedule.location}
                        </div>
                      )}
                    </div>
                  </div>
                )) || []}
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}
