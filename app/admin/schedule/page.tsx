'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, BookOpen, Users, Plus, Edit, Trash2, Search, Filter } from 'lucide-react'
import { ScheduleForm } from '@/components/admin/schedule-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

interface Schedule {
  id: string
  subjectId: string
  groupId?: string
  subgroupId?: string
  date: string
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

interface Subject {
  id: string
  name: string
}

interface Group {
  id: string
  name: string
}

export default function SchedulePage() {
  const searchParams = useSearchParams()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [groupFilter, setGroupFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null)

  useEffect(() => {
    // Читаем параметр subject из URL и устанавливаем фильтр
    const subjectParam = searchParams.get('subject')
    if (subjectParam) {
      setSubjectFilter(subjectParam)
    }
    fetchData()
  }, [searchParams])

  const fetchData = async () => {
    try {
      const [schedulesResponse, subjectsResponse, groupsResponse] = await Promise.all([
        fetch('/api/schedules'),
        fetch('/api/subjects'),
        fetch('/api/groups')
      ])

      if (schedulesResponse.ok) {
        const schedulesData = await schedulesResponse.json()
        setSchedules(schedulesData.schedules || [])
      }

      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json()
        setSubjects(subjectsData.subjects || [])
      }

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json()
        setGroups(groupsData.groups || [])
      }
    } catch (error) {
      console.error('Ошибка при получении данных:', error)
      toast.error('Ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSchedule = () => {
    setEditingSchedule(null)
    setScheduleFormOpen(true)
  }

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setScheduleFormOpen(true)
  }

  const handleDeleteSchedule = (schedule: Schedule) => {
    setScheduleToDelete(schedule)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return

    try {
      const response = await fetch(`/api/schedules?id=${scheduleToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Расписание удалено')
        await fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при удалении расписания')
      }
    } catch (error) {
      console.error('Ошибка при удалении расписания:', error)
      toast.error('Произошла ошибка при удалении')
    } finally {
      setDeleteDialogOpen(false)
      setScheduleToDelete(null)
    }
  }

  const handleFormSuccess = () => {
    fetchData()
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        weekday: 'long'
      })
    } catch {
      return 'Дата не указана'
    }
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // HH:MM
  }

  const getDayOfWeekName = (dayOfWeek: number) => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    return days[dayOfWeek] || 'Неизвестно'
  }

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = 
      schedule.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.group?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.eventType?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSubject = subjectFilter === 'all' || schedule.subjectId === subjectFilter
    const matchesGroup = groupFilter === 'all' || schedule.groupId === groupFilter
    const matchesDate = !dateFilter || schedule.date.startsWith(dateFilter)
    
    return matchesSearch && matchesSubject && matchesGroup && matchesDate
  })

  // Сортируем по дате и времени
  const sortedSchedules = filteredSchedules.sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime()
    if (dateCompare !== 0) return dateCompare
    return a.startTime.localeCompare(b.startTime)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка расписания...</p>
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
            Управление расписанием
          </h1>
          <p className="text-gray-600 mt-2">
            Создавайте и управляйте расписанием занятий
          </p>
        </div>
        <Button onClick={handleCreateSchedule}>
          <Plus className="h-4 w-4 mr-2" />
          Создать занятие
        </Button>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Поиск по предмету, группе, месту..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Все предметы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все предметы</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Все группы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все группы</SelectItem>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Фильтр по дате"
            />
          </div>
        </CardContent>
      </Card>

      {/* Список расписания */}
      <div className="space-y-4">
        {sortedSchedules.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">Занятия не найдены</p>
                <p className="text-gray-400 mb-6">Создайте первое занятие для начала работы</p>
                <Button onClick={handleCreateSchedule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать первое занятие
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          sortedSchedules.map((schedule) => (
            <Card key={schedule.id} className="card-hover">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {schedule.subject.name}
                    </CardTitle>
                    <CardDescription>
                      {schedule.group?.name && (
                        <span className="inline-flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {schedule.group.name}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditSchedule(schedule)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSchedule(schedule)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {formatDate(schedule.date)} ({getDayOfWeekName(schedule.dayOfWeek)})
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </span>
                  </div>
                  
                  {schedule.location && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{schedule.location}</span>
                    </div>
                  )}
                  
                  {schedule.eventType && (
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <Badge variant="secondary">{schedule.eventType}</Badge>
                    </div>
                  )}
                  
                  {schedule.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {schedule.description}
                    </p>
                  )}
                  
                  {schedule.subgroupId && (
                    <div className="text-sm text-gray-500">
                      Подгруппа: {schedule.subgroupId}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Форма расписания */}
      <ScheduleForm
        open={scheduleFormOpen}
        onOpenChange={setScheduleFormOpen}
        schedule={editingSchedule}
        onSuccess={handleFormSuccess}
      />

      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Удалить занятие"
        description={`Вы уверены, что хотите удалить занятие "${scheduleToDelete?.subject.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={confirmDeleteSchedule}
        variant="destructive"
      />
    </div>
  )
}
