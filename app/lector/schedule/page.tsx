'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users,
  BookOpen,
  Filter,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  getDay,
  parseISO,
  startOfWeek,
  endOfWeek
} from 'date-fns'
import { ru } from 'date-fns/locale'

// Типы для расписания
type Schedule = {
  id: string
  date: string | Date // API возвращает string (ISO), но может быть Date после обработки
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
  subgroup?: {
    id: string
    name: string
    number: number
  }
}

type Subject = {
  id: string
  name: string
}

type ViewMode = 'list' | 'calendar'

export default function LectorSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSubject, setFilterSubject] = useState<string>('')
  const [filterTarget, setFilterTarget] = useState<string>('all') // 'all' | 'groupId' | 'groupId:subgroupId'
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [currentDate, setCurrentDate] = useState(new Date())

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

  // Получаем уникальные цели (Группа или Группа+Подгруппа) из расписания
  const targets = useMemo(() => {
    const uniqueTargets = new Map<string, string>()
    schedules.forEach(s => {
      if (s.group) {
        if (s.subgroup) {
          const key = `${s.group.id}:${s.subgroup.id}`
          const label = `${s.group.name} (${s.subgroup.name})`
          uniqueTargets.set(key, label)
        } else {
          // Если есть занятие только для группы (без подгруппы), добавляем опцию "Только вся группа"
          // Но чаще всего мы хотим просто фильтр по группе.
          // В данном контексте, давайте сделаем список всех возможных комбинаций, которые встречаются
          
          // Добавим просто группу как опцию, если она еще не добавлена
          // Это позволит выбрать "Группа А (Все)"
           if (!uniqueTargets.has(s.group.id)) {
             uniqueTargets.set(s.group.id, s.group.name)
           }
        }
        // Также всегда полезно иметь возможность отфильтровать чисто по группе, даже если занятия разбиты по подгруппам.
        // Но пока сделаем плоско: Группа, Группа+Подгруппа
      }
    })
    
    // Дополнительный проход чтобы убедиться что у нас есть опции для "Вся Группа X" если есть "Группа X (Подгруппа Y)"
    schedules.forEach(s => {
        if (s.group && !uniqueTargets.has(s.group.id)) {
            uniqueTargets.set(s.group.id, s.group.name)
        }
    })

    return Array.from(uniqueTargets.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [schedules])

  const filteredSchedules = useMemo(() => {
    return schedules.filter(schedule => {
      const matchesSubject = !filterSubject || schedule.subject.id === filterSubject
      
      let matchesTarget = true
      if (filterTarget !== 'all') {
        if (filterTarget.includes(':')) {
           // Фильтр по конкретной подгруппе: groupId:subgroupId
           const [gId, sId] = filterTarget.split(':')
           matchesTarget = schedule.group?.id === gId && schedule.subgroup?.id === sId
        } else {
           // Фильтр по группе (показываем всё для этой группы: и общие, и подгруппы)
           matchesTarget = schedule.group?.id === filterTarget
        }
      }

      return matchesSubject && matchesTarget
    })
  }, [schedules, filterSubject, filterTarget])

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

  // Группируем расписание по дням
  const groupedSchedules = filteredSchedules.reduce((acc, schedule) => {
    const date = new Date(schedule.date).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(schedule)
    return acc
  }, {} as Record<string, Schedule[]>)

  // Календарь
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const today = () => setCurrentDate(new Date())

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Неделя с понедельника
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    return eachDayOfInterval({
        start: startDate,
        end: endDate
    })
  }, [currentDate])

  const getDayEvents = (day: Date) => {
      return filteredSchedules.filter(s => isSameDay(new Date(s.date), day))
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Мое расписание
          </h1>
          <p className="text-gray-600 mt-2">
            Расписание ваших занятий и мероприятий
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
                onClick={() => setViewMode('list')}
                className={cn(
                    "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all",
                    viewMode === 'list' ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-900"
                )}
            >
                <List className="w-4 h-4 mr-2" />
                Список
            </button>
            <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                    "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all",
                    viewMode === 'calendar' ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-900"
                )}
            >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Календарь
            </button>
        </div>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white"
              >
                <option value="">Все предметы</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <select
                value={filterTarget}
                onChange={(e) => setFilterTarget(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white"
              >
                <option value="all">Все группы</option>
                {targets.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Контент (Список или Календарь) */}
      {viewMode === 'list' ? (
          // View: СПИСОК (Старый код с небольшими правками)
          Object.keys(groupedSchedules).length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">Расписание не найдено</p>
                  <p className="text-gray-400">
                    Занятия по вашим критериям не найдены
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
                        <CalendarIcon className="h-5 w-5 text-purple-600" />
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
                              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                                  <div className="flex items-center space-x-1 min-w-[120px]">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm font-medium">
                                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <BookOpen className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600 font-medium">
                                      {schedule.subject.name}
                                    </span>
                                  </div>
                                  {schedule.group && (
                                    <div className="flex items-center space-x-1">
                                      <Users className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm text-gray-600">
                                        {schedule.group.name}
                                        {schedule.subgroup && (
                                            <span className="text-gray-400 ml-1">({schedule.subgroup.name})</span>
                                        )}
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
                                <Badge variant="outline" className="ml-2">
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
          )
      ) : (
          // View: КАЛЕНДАРЬ
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
                                    "bg-white min-h-[120px] p-2 flex flex-col gap-1 transition-colors hover:bg-gray-50",
                                    !isCurrentMonth && "bg-gray-50/50 text-gray-400"
                                )}
                              >
                                  <div className="flex justify-between items-start">
                                      <span className={cn(
                                          "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                                          isToday && "bg-purple-600 text-white",
                                          !isToday && !isCurrentMonth && "text-gray-400",
                                          !isToday && isCurrentMonth && "text-gray-700"
                                      )}>
                                          {format(day, 'd')}
                                      </span>
                                  </div>
                                  
                                  <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                      {events.map(event => (
                                          <div 
                                            key={event.id}
                                            className="text-xs bg-purple-50 border-l-2 border-purple-500 p-1 rounded-r truncate cursor-pointer hover:bg-purple-100"
                                            title={`${formatTime(event.startTime)} - ${event.subject.name} (${event.group?.name})`}
                                          >
                                              <div className="font-semibold text-purple-900">
                                                  {formatTime(event.startTime)}
                                              </div>
                                              <div className="truncate text-purple-800">
                                                  {event.subject.name}
                                              </div>
                                              {event.group && (
                                                  <div className="text-purple-600 truncate text-[10px]">
                                                      {event.group.name} 
                                                      {event.subgroup ? ` (${event.subgroup.number})` : ''}
                                                  </div>
                                              )}
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
    </div>
  )
}
