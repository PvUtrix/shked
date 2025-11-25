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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format, parse } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { ScheduleFormData } from '@/lib/types'
import { toast } from 'sonner'

const scheduleSchema = z.object({
  subjectId: z.string().refine((val) => val && val.trim().length > 0, {
    message: 'Предмет обязателен',
  }),
  groupId: z.string().optional(),
  subgroupId: z.string().optional(),
  date: z.string().refine((val) => val && val.trim().length > 0, {
    message: 'Дата обязательна',
  }),
  startTime: z.string().refine((val) => val && val.trim().length > 0, {
    message: 'Время начала обязательно',
  }),
  endTime: z.string().refine((val) => val && val.trim().length > 0, {
    message: 'Время окончания обязательно',
  }),
  location: z.string().optional(),
  eventType: z.enum(['Лекция', 'Семинар', 'Практика', 'Лабораторная', 'Консультация', 'Экзамен']).optional().or(z.literal('')),
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
    mode: 'onChange', // Валидация при изменении полей
    reValidateMode: 'onChange', // Повторная валидация при изменении
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
    let isMounted = true
    
    const fetchData = async () => {
      try {
        const [subjectsResponse, groupsResponse] = await Promise.all([
          fetch('/api/subjects'),
          fetch('/api/groups')
        ])

        if (subjectsResponse.ok) {
          const subjectsData = await subjectsResponse.json()
          if (isMounted) {
            setSubjects(subjectsData.subjects || [])
          }
        }

        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json()
          if (isMounted) {
            setGroups(groupsData.groups || [])
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Ошибка при загрузке данных:', error)
        }
      }
    }

    if (open) {
      fetchData()
    }
    
    return () => {
      isMounted = false
    }
  }, [open])

  // Заполняем форму при редактировании
  useEffect(() => {
    if (open) {
      if (schedule) {
        try {
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
          }, {
            keepErrors: false,
            keepDirty: false,
            keepDefaultValues: false,
          })
        } catch (error) {
          console.error('Ошибка при форматировании даты:', error)
          form.reset({
            subjectId: schedule.subjectId || '',
            groupId: schedule.groupId || '',
            subgroupId: schedule.subgroupId || '',
            date: '',
            startTime: schedule.startTime || '',
            endTime: schedule.endTime || '',
            location: schedule.location || '',
            eventType: schedule.eventType || '',
            description: schedule.description || '',
          }, {
            keepErrors: false,
            keepDirty: false,
            keepDefaultValues: false,
          })
        }
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
        }, {
          keepErrors: false,
          keepDirty: false,
          keepDefaultValues: false,
        })
      }
      
      // Не валидируем при загрузке данных - валидация будет при изменении полей
      // Это предотвращает ошибки ZodError при загрузке существующих данных
    }
  }, [schedule, open, form])

  const onSubmit = async (data: ScheduleFormData) => {
    // Принудительно валидируем все поля перед отправкой
    const isValid = await form.trigger()
    if (!isValid) {
      // Получаем первое поле с ошибкой и переводим на него фокус
      const errorFields = Object.keys(form.formState.errors)
      if (errorFields.length > 0) {
        const firstError = errorFields[0]
        // Для Select полей нужно искать по другому селектору
        let fieldElement = document.querySelector(`[name="${firstError}"]`) as HTMLElement
        if (!fieldElement) {
          // Для Select полей ищем по data-атрибуту или через aria-invalid
          fieldElement = document.querySelector(`[data-field="${firstError}"]`) as HTMLElement
        }
        if (!fieldElement) {
          // Пробуем найти через aria-invalid
          fieldElement = document.querySelector(`[aria-invalid="true"]`) as HTMLElement
        }
        if (fieldElement) {
          fieldElement.focus()
          // Прокручиваем к полю с ошибкой
          setTimeout(() => {
            fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        } else {
          // Если не нашли напрямую, ищем SelectTrigger для Select полей
          const selectTrigger = document.querySelector(`button[data-field="${firstError}"]`) as HTMLElement
          if (selectTrigger) {
            selectTrigger.focus()
            setTimeout(() => {
              selectTrigger.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 100)
          }
        }
      }
      toast.error('Пожалуйста, заполните все обязательные поля')
      return
    }

    setLoading(true)
    let isMounted = true
    
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

      if (!isMounted) {
        return
      }

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
      if (isMounted) {
        console.error('Ошибка при сохранении расписания:', error)
        toast.error('Произошла ошибка при сохранении')
      }
    } finally {
      if (isMounted) {
        setLoading(false)
      }
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
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger data-field="subjectId">
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
                  <Select 
                    onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} 
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите группу" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Без группы</SelectItem>
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Дата *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(parse(field.value, 'yyyy-MM-dd', new Date()), 'dd.MM.yyyy', { locale: ru })
                            ) : (
                              <span>Выберите дату</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? parse(field.value, 'yyyy-MM-dd', new Date()) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                          initialFocus
                          locale={ru}
                        />
                      </PopoverContent>
                    </Popover>
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
                    <Select 
                      onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} 
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Вся группа" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Вся группа</SelectItem>
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
                        value={field.value || ''}
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
                        value={field.value || ''}
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
                    <Select 
                      onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} 
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип занятия" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Не указан</SelectItem>
                        <SelectItem value="Лекция">Лекция</SelectItem>
                        <SelectItem value="Семинар">Семинар</SelectItem>
                        <SelectItem value="Практика">Практика</SelectItem>
                        <SelectItem value="Лабораторная">Лабораторная</SelectItem>
                        <SelectItem value="Консультация">Консультация</SelectItem>
                        <SelectItem value="Экзамен">Экзамен</SelectItem>
                      </SelectContent>
                    </Select>
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
              <Button type="submit" disabled={loading || !form.formState.isValid}>
                {loading ? 'Сохранение...' : (isEditing ? 'Обновить' : 'Создать')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
