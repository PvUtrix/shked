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
import { SubjectFormData } from '@/lib/types'
import { toast } from 'sonner'

const subjectSchema = z.object({
  name: z.string().min(1, 'Название предмета обязательно'),
  description: z.string().optional(),
  instructor: z.string().optional(),
  lectorId: z.string().optional(),
})

interface SubjectFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject?: any // Существующий предмет для редактирования
  onSuccess: () => void
}

export function SubjectForm({ open, onOpenChange, subject, onSuccess }: SubjectFormProps) {
  const [loading, setLoading] = useState(false)
  const [lectors, setLectors] = useState<any[]>([])
  const isEditing = !!subject

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: '',
      description: '',
      instructor: '',
      lectorId: 'none',
    },
  })

  // Загружаем список преподавателей
  useEffect(() => {
    const fetchLectors = async () => {
      try {
        const response = await fetch('/api/users?role=lector')
        if (response.ok) {
          const data = await response.json()
          setLectors(data.users || [])
        }
      } catch (error) {
        console.error('Ошибка при загрузке преподавателей:', error)
      }
    }

    if (open) {
      fetchLectors()
    }
  }, [open])

  // Заполняем форму при редактировании
  useEffect(() => {
    if (subject) {
      form.reset({
        name: subject.name || '',
        description: subject.description || '',
        instructor: subject.instructor || '',
        lectorId: subject.lectorId || 'none',
      })
    } else {
      form.reset({
        name: '',
        description: '',
        instructor: '',
        lectorId: 'none',
      })
    }
  }, [subject, form])

  const onSubmit = async (data: SubjectFormData) => {
    setLoading(true)
    try {
      const url = '/api/subjects'
      const method = isEditing ? 'PUT' : 'POST'
      
      // Преобразуем "none" в null для lectorId
      const processedData = {
        ...data,
        lectorId: data.lectorId === 'none' ? null : data.lectorId
      }
      
      const body = isEditing ? { ...processedData, id: subject.id } : processedData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(
          isEditing ? 'Предмет обновлен' : 'Предмет создан'
        )
        onSuccess()
        onOpenChange(false)
        form.reset()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Произошла ошибка')
      }
    } catch (error) {
      console.error('Ошибка при сохранении предмета:', error)
      toast.error('Произошла ошибка при сохранении')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Редактировать предмет' : 'Создать предмет'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Внесите изменения в информацию о предмете'
              : 'Заполните информацию о новом предмете'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название предмета *</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: Математический анализ" {...field} />
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
                      placeholder="Описание предмета (необязательно)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="instructor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Преподаватель</FormLabel>
                  <FormControl>
                    <Input placeholder="ФИО преподавателя" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lectorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Назначить преподавателя</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите преподавателя" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Без назначения</SelectItem>
                      {lectors.map((lector) => (
                        <SelectItem key={lector.id} value={lector.id}>
                          {lector.name || `${lector.firstName || ''} ${lector.lastName || ''}`.trim() || lector.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
