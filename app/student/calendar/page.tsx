'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { ExportButton } from '@/components/export/export-button'
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
  endOfWeek
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
        setSchedules(data?.schedules || [])
      }
    } catch (error) {
      console.error('Ошибка при получении расписания:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time: string) => {
    return time ? time.slice(0, 5) : '00:00'
  }

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
          <p className="text-gray-600">Загружаем календарь...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Календарь расписания
          </h1>
          <p className="text-gray-600 mt-2">
            Ваше расписание в календарном виде
          </p>
        </div>
        <ExportButton
          endpoint="/api/schedules/export"
          label="Экспорт в календарь"
          variant="default"
        />
      </div>

      {/* Calendar */}
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
            {/* Week header */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                    <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500">
                        {day}
                    </div>
                ))}
                
                {/* Calendar grid */}
                {calendarDays.map((day, index) => {
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

      {/* Today's Schedule (Optional, kept for consistency with old view or remove? The user didn't ask for it specifically but it's useful. Let's keep it simplier or just removed since the calendar is now interactive? The old view had it. I'll keep it as a simple list below the calendar) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Расписание на сегодня
          </CardTitle>
          <CardDescription>
            {format(new Date(), 'd MMMM yyyy, EEEE', { locale: ru })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const todaySchedules = getDayEvents(new Date()) // reuse helper
            
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
                        <div className="flex items-center text-xs text-gray-500 mt-1 justify-end">
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
