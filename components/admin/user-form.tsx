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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { UserFormData } from '@/lib/types'
import { toast } from 'sonner'

const userSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().min(6, 'Пароль должен содержать минимум 6 символов').optional()
  ),
  name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['admin', 'student', 'lector', 'mentor', 'assistant', 'co_lecturer', 'education_office_head', 'department_admin']),
  groupId: z.string().optional(),
  mustChangePassword: z.boolean().optional(),
})

interface UserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: any // Существующий пользователь для редактирования
  onSuccess: () => void
}

export function UserForm({ open, onOpenChange, user, onSuccess }: UserFormProps) {
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<any[]>([])
  const isEditing = !!user

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      firstName: '',
      lastName: '',
      role: 'student',
      groupId: '',
      mustChangePassword: false,
    },
  })

  // Загружаем список групп
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups')
        if (response.ok) {
          const data = await response.json()
          setGroups(data.groups || [])
        }
      } catch (error) {
        console.error('Ошибка при загрузке групп:', error)
      }
    }

    if (open) {
      fetchGroups()
    }
  }, [open])

  // Заполняем форму при редактировании
  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email || '',
        password: '', // Не показываем пароль при редактировании
        name: user.name || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || 'student',
        groupId: user.groupId || '',
        mustChangePassword: user.mustChangePassword || false,
      })
    } else {
      form.reset({
        email: '',
        password: '',
        name: '',
        firstName: '',
        lastName: '',
        role: 'student',
        groupId: '',
        mustChangePassword: false,
      })
    }
  }, [user, form])

  const onSubmit = async (data: UserFormData) => {
    setLoading(true)
    try {
      const url = '/api/users'
      const method = isEditing ? 'PUT' : 'POST'
      
      // Валидация пароля при создании нового пользователя
      if (!isEditing && (!data.password || data.password.trim() === '')) {
        toast.error('Пароль обязателен для нового пользователя')
        setLoading(false)
        return
      }
      
      // При редактировании не отправляем пароль, если он пустой или undefined
      const body = isEditing 
        ? { ...data, id: user.id, password: data.password || undefined }
        : data

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(
          isEditing ? 'Пользователь обновлен' : 'Пользователь создан'
        )
        onSuccess()
        onOpenChange(false)
        form.reset()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Произошла ошибка')
      }
    } catch (error) {
      console.error('Ошибка при сохранении пользователя:', error)
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
            {isEditing ? 'Редактировать пользователя' : 'Создать пользователя'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Внесите изменения в информацию о пользователе'
              : 'Заполните информацию о новом пользователе'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="user@example.com" 
                      {...field} 
                      disabled={isEditing} // Email нельзя изменить
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Пароль {isEditing ? '(оставьте пустым, чтобы не менять)' : '*'}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Пароль"
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
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя</FormLabel>
                    <FormControl>
                      <Input placeholder="Имя" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Фамилия</FormLabel>
                    <FormControl>
                      <Input placeholder="Фамилия" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Полное имя</FormLabel>
                  <FormControl>
                    <Input placeholder="Полное имя (необязательно)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Роль *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите роль" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Администратор</SelectItem>
                      <SelectItem value="student">Студент</SelectItem>
                      <SelectItem value="lector">Преподаватель</SelectItem>
                      <SelectItem value="mentor">Ментор</SelectItem>
                      <SelectItem value="assistant">Ассистент</SelectItem>
                      <SelectItem value="co_lecturer">Со-преподаватель</SelectItem>
                      <SelectItem value="education_office_head">Учебный отдел</SelectItem>
                      <SelectItem value="department_admin">Админ кафедры</SelectItem>
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

            <FormField
              control={form.control}
              name="mustChangePassword"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Сменить пароль при следующем входе
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Пользователь будет обязан сменить пароль при следующем логине
                    </p>
                  </div>
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
