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
import { GroupFormData } from '@/lib/types'
import { toast } from 'sonner'

const groupSchema = z.object({
  name: z.string().min(1, 'Название группы обязательно'),
  description: z.string().optional(),
  semester: z.string().optional(),
  year: z.string().optional(),
})

interface GroupFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: any // Существующая группа для редактирования
  onSuccess: () => void
}

export function GroupForm({ open, onOpenChange, group, onSuccess }: GroupFormProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!group

  const form = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
      description: '',
      semester: '',
      year: '',
    },
  })

  // Заполняем форму при редактировании
  useEffect(() => {
    if (group) {
      form.reset({
        name: group.name || '',
        description: group.description || '',
        semester: group.semester || '',
        year: group.year || '',
      })
    } else {
      form.reset({
        name: '',
        description: '',
        semester: '',
        year: '',
      })
    }
  }, [group, form])

  const onSubmit = async (data: GroupFormData) => {
    setLoading(true)
    try {
      const url = '/api/groups'
      const method = isEditing ? 'PUT' : 'POST'
      const body = isEditing ? { ...data, id: group.id } : data

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(
          isEditing ? 'Группа обновлена' : 'Группа создана'
        )
        onSuccess()
        onOpenChange(false)
        form.reset()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Произошла ошибка')
      }
    } catch (error) {
      console.error('Ошибка при сохранении группы:', error)
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
            {isEditing ? 'Редактировать группу' : 'Создать группу'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Внесите изменения в информацию о группе'
              : 'Заполните информацию о новой группе'
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
                  <FormLabel>Название группы *</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: МФТИ-2024" {...field} />
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
                      placeholder="Описание группы (необязательно)"
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
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Семестр</FormLabel>
                    <FormControl>
                      <Input placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Год</FormLabel>
                    <FormControl>
                      <Input placeholder="2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
