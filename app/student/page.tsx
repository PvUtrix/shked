'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, Clock, MapPin, Filter, List, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO
} from 'date-fns'
import { ru } from 'date-fns/locale'

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
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchSchedules()
  }, [session])

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedules')
      if (response.ok) {
        const data = await response.json()
        const schedulesArray = Array.isArray(data.schedules) ? data.schedules : []
        setSchedules(schedulesArray)
      } else {
        setSchedules([])
      }
    } catch (error) {
      console.error('Ошибка при получении расписания:', error)
      setSchedules([])
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
    return time ? time.slice(0, 5) : '00:00'
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
      // Сбрасываем время у сегодня для корректного сравнения, если нужно, 
      // но для "предстоящих" обычно время тоже важно. 
      // Простая проверка на дату >= сегодня (включая прошедшие сегодня) или строго будущее.
      // Оставим как было:
      return scheduleDate >= today
    } catch {
      return false
    }
  }) || []

  // --- Calendar Logic ---
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const today = () => setCurrentDate(new Date())

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    return eachDayOfInterval({
        start: startDate,
        end: endDate
    })
  }, [currentDate])

  const getDayEvents = (day: Date) => {
    return schedules.filter(s => {
        try {
            return isSameDay(new Date(s.date), day)
        } catch { 
            return false 
        }
    }).sort((a, b) => a.startTime.localeCompare(b.startTime))
  }
  // ----------------------

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
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {viewMode === 'list' && (
                <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white"
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
            )}
            
            {/* Spacer if list filter is hidden */}
            {viewMode !== 'list' && <div />}

            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                    "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all",
                    viewMode === 'list' ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-900"
                )}
              >
                <List className="h-4 w-4 mr-2" />
                Список
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                    "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all",
                    viewMode === 'calendar' ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-900"
                )}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Календарь
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Display */}
      {viewMode === 'list' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
              Расписание занятий
            </CardTitle>
            <CardDescription>
              {filteredSchedules?.length || 0} занятий найдено
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSchedules?.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
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
                      <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
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
                        <div className="flex items-center text-xs text-gray-500 justify-end">
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
        // CALENDAR VIEW
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold w-40 text-center">
                        {format(currentDate, 'LLLL yyyy', { locale: ru })}
                    </h2>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <Button variant="outline" onClick={today}>
                    Сегодня
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                    {/* Деньки недели */}
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                        <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500">
                            {day}
                        </div>
                    ))}
                    
                    {/* Сетка дней */}
                    {calendarDays.map((day, dayIdx) => {
                        const events = getDayEvents(day)
                        const isToday = isSameDay(day, new Date())
                        const isCurrentMonth = isSameMonth(day, currentDate)

                        return (
                            <div 
                              key={day.toString()} 
                              className={cn(
                                  "bg-white min-h-[100px] p-2 flex flex-col gap-1 transition-colors hover:bg-gray-50",
                                  !isCurrentMonth && "bg-gray-50/50 text-gray-400"
                              )}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={cn(
                                        "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                                        isToday && "bg-green-600 text-white",
                                        !isToday && !isCurrentMonth && "text-gray-400",
                                        !isToday && isCurrentMonth && "text-gray-700"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                </div>
                                
                                <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                    {events.map((event, idx) => (
                                        <div 
                                          key={event.id || idx}
                                          className="text-xs bg-green-50 border-l-2 border-green-500 p-1 rounded-r truncate cursor-pointer hover:bg-green-100"
                                          title={`${formatTime(event.startTime)} - ${event.subject.name}`}
                                        >
                                            <div className="font-semibold text-green-900">
                                                {formatTime(event.startTime)}
                                            </div>
                                            <div className="truncate text-green-800">
                                                {event.subject.name}
                                            </div>
                                        </div>
                                    ))}
                                    {events.length > 3 && (
                                        <div className="text-xs text-center text-gray-400">
                                            Еще {events.length - 3} ...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
      )}

      {/* Upcoming Classes - only show in List mode for cleaner UI, or always? Let's keep it always for now but maybe at bottom */}
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
