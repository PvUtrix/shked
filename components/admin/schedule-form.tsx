'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { ScheduleFormData } from '@/lib/types'
import { toast } from 'sonner'

const scheduleSchema = z.object({
  subjectId: z.string().min(1, 'Предмет обязателен'),
  groupId: z.string().optional(),
  subgroupId: z.string().optional(),
  date: z.string().min(1, 'Дата обязательна'),
  startTime: z.string().min(1, 'Время начала обязательно'),
  endTime: z.string().min(1, 'Время окончания обязательно'),
  location: z.string().optional(),
  eventType: z.string().optional(),
  description: z.string().optional(),
})

interface ScheduleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule?: any // Существующее расписание для редактирования
  onSuccess: () => void
}

export function ScheduleForm({ open, onOpenChange, schedule, onSuccess }: ScheduleFormProps) {
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const isEditing = !!schedule

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      subjectId: '',
      groupId: '',
      subgroupId: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      eventType: '',
      description: '',
    },
  })

  // Загружаем списки предметов и групп
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsResponse, groupsResponse] = await Promise.all([
          fetch('/api/subjects'),
          fetch('/api/groups')
        ])

        if (subjectsResponse.ok) {
          const subjectsData = await subjectsResponse.json()
          setSubjects(subjectsData.subjects || [])
        }

        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json()
          setGroups(groupsData.groups || [])
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error)
      }
    }

    if (open) {
      fetchData()
    }
  }, [open])

  // Заполняем форму при редактировании
  useEffect(() => {
    if (schedule) {
      const date = new Date(schedule.date)
      form.reset({
        subjectId: schedule.subjectId || '',
        groupId: schedule.groupId || '',
        subgroupId: schedule.subgroupId || '',
        date: date.toISOString().split('T')[0],
        startTime: schedule.startTime || '',
        endTime: schedule.endTime || '',
        location: schedule.location || '',
        eventType: schedule.eventType || '',
        description: schedule.description || '',
      })
    } else {
      form.reset({
        subjectId: '',
        groupId: '',
        subgroupId: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        eventType: '',
        description: '',
      })
    }
  }, [schedule, form])

  const onSubmit = async (data: ScheduleFormData) => {
    setLoading(true)
    try {
      const url = '/api/schedules'
      const method = isEditing ? 'PUT' : 'POST'
      const body = isEditing ? { ...data, id: schedule.id } : data

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(
          isEditing ? 'Расписание обновлено' : 'Расписание создано'
        )
        onSuccess()
        onOpenChange(false)
        form.reset()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Произошла ошибка')
      }
    } catch (error) {
      console.error('Ошибка при сохранении расписания:', error)
      toast.error('Произошла ошибка при сохранении')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Редактировать расписание' : 'Создать расписание'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Внесите изменения в расписание'
              : 'Заполните информацию о новом занятии'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Предмет *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите предмет" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Группа</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите группу" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Без группы</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="subgroupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Подгруппа</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Вся группа" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Вся группа</SelectItem>
                        <SelectItem value="1">Подгруппа 1</SelectItem>
                        <SelectItem value="2">Подгруппа 2</SelectItem>
                        <SelectItem value="3">Подгруппа 3</SelectItem>
                        <SelectItem value="4">Подгруппа 4</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Время начала *</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Время окончания *</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Место проведения</FormLabel>
                    <FormControl>
                      <Input placeholder="Аудитория" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип занятия</FormLabel>
                    <FormControl>
                      <Input placeholder="Лекция, семинар, практика" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Дополнительная информация о занятии"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Сохранение...' : (isEditing ? 'Обновить' : 'Создать')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
