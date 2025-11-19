'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Calendar as CalendarIcon, AlertTriangle, MapPin, User, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Schedule {
  id: string
  startTime: string
  endTime: string
  location: string | null
  eventType: string | null
  subject: {
    name: string
    lectors: Array<{
      user: {
        name: string | null
      }
    }>
  }
  group: {
    name: string
  } | null
}

interface Conflict {
  type: string
  scheduleIds: string[]
  details: string
}

export default function SchedulePage() {
  const [date, setDate] = useState<Date>(new Date())
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/education-office/schedule?date=${date.toISOString()}`)
        if (response.ok) {
          const data = await response.json()
          setSchedules(data.schedules)
          setConflicts(data.conflicts)
        }
      } catch (error) {
        console.error('Failed to fetch schedule', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchedule()
  }, [date])

  const getConflict = (scheduleId: string) => {
    return conflicts.find(c => c.scheduleIds.includes(scheduleId))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Общее расписание</h1>
          <p className="text-muted-foreground mt-2">
            Просмотр занятий и выявление конфликтов
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: ru }) : <span>Выберите дату</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {conflicts.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Обнаружены конфликты ({conflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-red-800 space-y-1">
              {conflicts.map((conflict, i) => (
                <li key={i}>{conflict.details}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Загрузка расписания...</div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/5">
            На выбранную дату занятий не найдено
          </div>
        ) : (
          schedules.map((schedule) => {
            const conflict = getConflict(schedule.id)
            return (
              <Card key={schedule.id} className={cn(conflict && "border-red-200 bg-red-50/20")}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-32 flex-shrink-0 text-center border-r pr-4">
                    <div className="text-lg font-bold text-primary">
                      {schedule.startTime}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {schedule.endTime}
                    </div>
                  </div>
                  
                  <div className="flex-grow grid gap-1">
                    <div className="font-semibold text-lg flex items-center gap-2">
                      {schedule.subject.name}
                      {schedule.eventType && (
                        <Badge variant="secondary" className="text-xs">
                          {schedule.eventType}
                        </Badge>
                      )}
                      {conflict && (
                        <Badge variant="destructive" className="text-xs">
                          Конфликт
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {schedule.group?.name || 'Без группы'}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {schedule.location || 'Аудитория не назначена'}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {schedule.subject.lectors[0]?.user.name || 'Преподаватель не назначен'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
