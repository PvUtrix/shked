'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { HomeworkFormData } from '@/lib/types'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const materialSchema = z.object({
  name: z.string().min(1, 'Название материала обязательно'),
  url: z.string().url('Некорректная ссылка'),
  type: z.enum(['document', 'video', 'link', 'other']),
})

const homeworkSchema = z.object({
  title: z.string().min(1, 'Название задания обязательно'),
  description: z.string().optional(),
  content: z.string().optional(),  // MDX контент
  taskUrl: z.string().url('Некорректная ссылка').optional().or(z.literal('')),
  deadline: z.string().min(1, 'Дедлайн обязателен'),
  materials: z.array(materialSchema).optional(),
  subjectId: z.string().min(1, 'Предмет обязателен'),
  groupId: z.string().min(1).optional().or(z.literal('')), // Allow empty string or valid groupId
})

interface HomeworkFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  homework?: any // Существующее задание для редактирования
  onSuccess: () => void
}

export function HomeworkForm({ open, onOpenChange, homework, onSuccess }: HomeworkFormProps) {
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const isEditing = !!homework

  const form = useForm<HomeworkFormData>({
    resolver: zodResolver(homeworkSchema),
    mode: 'onChange', // Валидация при изменении полей
    reValidateMode: 'onChange', // Повторная валидация при изменении
    defaultValues: {
      title: '',
      description: '',
      content: '',  // MDX контент
      taskUrl: '',
      deadline: '',
      materials: [],
      subjectId: '',
      groupId: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'materials',
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
    if (homework) {
      const deadline = new Date(homework.deadline)
      form.reset({
        title: homework.title || '',
        description: homework.description || '',
        content: homework.content || '',  // MDX контент
        taskUrl: homework.taskUrl || '',
        deadline: deadline.toISOString().split('T')[0] + 'T' + deadline.toTimeString().split(' ')[0].slice(0, 5),
        materials: homework.materials || [],
        subjectId: homework.subjectId || '',
        groupId: homework.groupId || '',
      })
    } else {
      form.reset({
        title: '',
        description: '',
        content: '',  // MDX контент
        taskUrl: '',
        deadline: '',
        materials: [],
        subjectId: '',
        groupId: '',
      })
    }
  }, [homework, form])

  const onSubmit = async (data: HomeworkFormData) => {
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
          // Пробуем найти через aria-invalid или через FormField
          fieldElement = document.querySelector(`[aria-invalid="true"]`) as HTMLElement
        }
        if (fieldElement) {
          fieldElement.focus()
          // Прокручиваем к полю с ошибкой
          setTimeout(() => {
            fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }
      }
      toast.error('Пожалуйста, заполните все обязательные поля')
      return
    }

    setLoading(true)
    let isMounted = true
    
    try {
      const url = '/api/homework'
      const method = isEditing ? 'PUT' : 'POST'

      // Convert empty strings to undefined for optional fields
      const cleanedData = {
        ...data,
        groupId: data.groupId || undefined,
        taskUrl: data.taskUrl || undefined,
        description: data.description || undefined,
        content: data.content || undefined,
      }

      const body = isEditing ? { ...cleanedData, id: homework.id } : cleanedData

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
          isEditing ? 'Задание обновлено' : 'Задание создано'
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
        console.error('Ошибка при сохранении задания:', error)
        toast.error('Произошла ошибка при сохранении')
      }
    } finally {
      if (isMounted) {
        setLoading(false)
      }
    }
  }

  const addMaterial = () => {
    append({ name: '', url: '', type: 'document' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle>
            {isEditing ? 'Редактировать задание' : 'Создать задание'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Внесите изменения в домашнее задание'
              : 'Заполните информацию о новом домашнем задании'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название задания *</FormLabel>
                  <FormControl>
                    <Input placeholder="Название домашнего задания" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Подробное описание задания"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Содержание задания (MDX)</FormLabel>
                  <FormControl>
                    <MarkdownEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Напишите содержание задания в формате Markdown..."
                      height="300px"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="taskUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ссылка на задание</FormLabel>
                  <FormControl>
                    <Input 
                      type="url" 
                      placeholder="https://example.com/task" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="none">Все группы</SelectItem>
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
            </div>
            
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дедлайн *</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Дополнительные материалы */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Дополнительные материалы</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMaterial}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить материал
                </Button>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <FormField
                      control={form.control}
                      name={`materials.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название</FormLabel>
                          <FormControl>
                            <Input placeholder="Название материала" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-4">
                    <FormField
                      control={form.control}
                      name={`materials.${index}.url`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ссылка</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name={`materials.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Тип</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="document">Документ</SelectItem>
                              <SelectItem value="video">Видео</SelectItem>
                              <SelectItem value="link">Ссылка</SelectItem>
                              <SelectItem value="other">Другое</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            </form>
          </Form>
        </div>
        
        <DialogFooter className="px-6 pb-6 pt-4 flex-shrink-0 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !form.formState.isValid} 
            onClick={form.handleSubmit(onSubmit)}
          >
            {loading ? 'Сохранение...' : (isEditing ? 'Обновить' : 'Создать')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
