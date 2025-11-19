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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { UserFormData } from '@/lib/types'
import { toast } from 'sonner'

const userSchema = z.object({
  email: z.string().min(1, 'Email обязателен').email('Некорректный email'),
  password: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().min(6, 'Пароль должен содержать минимум 6 символов').optional()
  ),
  // name больше не используется - используем только firstName, lastName, middleName
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  middleName: z.string().optional(),
  birthday: z.string().optional(),
  snils: z.string().optional().refine((val) => !val || /^\d+$/.test(val), {
    message: 'СНИЛС должен содержать только цифры'
  }),
  sex: z.enum(['male', 'female']).optional(),
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

  // Создаем схему с условной валидацией пароля и даты рождения
  const dynamicSchema = userSchema.superRefine((data, ctx) => {
    // Пароль обязателен только при создании нового пользователя
    if (!isEditing && (!data.password || data.password.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Пароль обязателен для нового пользователя',
        path: ['password'],
      })
    }
    
    // Валидация даты рождения
    // Проверяем только если поле заполнено (не пустая строка)
    if (data.birthday && data.birthday.trim() !== '') {
      try {
        // Проверяем, что дата валидна
        const date = new Date(data.birthday)
        if (isNaN(date.getTime())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Некорректная дата',
            path: ['birthday'],
          })
          return
        }
        
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const dateCopy = new Date(date)
        dateCopy.setHours(0, 0, 0, 0)
        
        // Проверяем, что дата не в будущем
        if (dateCopy > today) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Дата рождения не может быть в будущем',
            path: ['birthday'],
          })
          return
        }
        
        // Проверяем, что возраст не меньше 10 лет
        const minDate = new Date(today)
        minDate.setFullYear(today.getFullYear() - 10)
        
        if (dateCopy > minDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Возраст не может быть меньше 10 лет',
            path: ['birthday'],
          })
          return
        }
        
        // Проверяем, что возраст не больше 150 лет
        const maxDate = new Date(today)
        maxDate.setFullYear(today.getFullYear() - 150)
        
        if (dateCopy < maxDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Возраст не может быть больше 150 лет',
            path: ['birthday'],
          })
          return
        }
      } catch (error) {
        // Игнорируем ошибки парсинга - они будут обработаны выше
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Некорректная дата',
          path: ['birthday'],
        })
      }
    }
  })

  const form = useForm<UserFormData>({
    resolver: zodResolver(dynamicSchema),
    mode: 'onChange', // Валидация при изменении полей
    reValidateMode: 'onChange', // Повторная валидация при изменении
    shouldUnregister: false, // Не удалять поля при размонтировании
    defaultValues: {
      email: '',
      password: '',
      // name больше не используется
      firstName: '',
      lastName: '',
      middleName: '',
      birthday: '',
      snils: '',
      sex: '',
      role: 'student',
      groupId: '',
      mustChangePassword: false,
    },
  })

  // Загружаем список групп
  useEffect(() => {
    let isMounted = true
    
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups')
        if (response.ok) {
          const data = await response.json()
          // Проверяем, что компонент все еще смонтирован перед обновлением состояния
          if (isMounted) {
            setGroups(data.groups || [])
          }
        }
      } catch (error) {
        // Игнорируем ошибки, если компонент размонтирован
        if (isMounted) {
          console.error('Ошибка при загрузке групп:', error)
        }
      }
    }

    if (open) {
      fetchGroups()
    }
    
    // Cleanup функция для отмены операций при размонтировании
    return () => {
      isMounted = false
    }
  }, [open])

  // Заполняем форму при редактировании
  useEffect(() => {
    if (user && open) {
      // Форматируем дату рождения для input type="date"
      let birthdayFormatted = ''
      if (user.birthday) {
        try {
          // Если birthday - строка, парсим её
          const birthdayDate = typeof user.birthday === 'string' 
            ? new Date(user.birthday) 
            : user.birthday
          if (birthdayDate && !isNaN(birthdayDate.getTime())) {
            birthdayFormatted = birthdayDate.toISOString().split('T')[0]
          }
        } catch (error) {
          console.error('Ошибка при форматировании даты рождения:', error)
        }
      }
      
      form.reset({
        email: user.email || '',
        password: '', // Не показываем пароль при редактировании
        // Поле name больше не используется - используем только firstName, lastName, middleName
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        middleName: user.middleName || '',
        birthday: birthdayFormatted,
        snils: user.snils || '',
        sex: user.sex || '',
        role: user.role || 'student',
        groupId: user.groupId || '',
        mustChangePassword: user.mustChangePassword || false,
      }, {
        keepErrors: false,
        keepDirty: false,
        keepDefaultValues: false,
      })
      
      // Не валидируем при загрузке данных - валидация будет при изменении полей
      // Это предотвращает ошибки ZodError при загрузке существующих данных
    } else if (!user && open) {
      // Сбрасываем форму для создания нового пользователя
      form.reset({
        email: '',
        password: '',
        // Поле name больше не используется
        firstName: '',
        lastName: '',
        middleName: '',
        birthday: '',
        snils: '',
        sex: '',
        role: 'student',
        groupId: '',
        mustChangePassword: false,
      }, {
        keepErrors: false,
        keepDirty: false,
        keepDefaultValues: false,
      })
      
      // Не валидируем при инициализации - валидация будет при изменении полей
    }
  }, [user, open, form])

  const onSubmit = async (data: UserFormData) => {
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
      const url = '/api/users'
      const method = isEditing ? 'PUT' : 'POST'
      
      // При редактировании формируем body только с нужными полями
      // Не включаем isActive и другие системные поля, которые не должны изменяться через форму
      // Поле name больше не используется - используем только firstName, lastName, middleName
      const body = isEditing 
        ? { 
            id: user.id,
            email: data.email,
            password: data.password && data.password.trim() !== '' ? data.password : undefined,
            // name больше не используется
            firstName: data.firstName && data.firstName.trim() !== '' ? data.firstName : null,
            lastName: data.lastName && data.lastName.trim() !== '' ? data.lastName : null,
            middleName: data.middleName && data.middleName.trim() !== '' ? data.middleName : null,
            birthday: data.birthday && data.birthday.trim() !== '' ? data.birthday : null,
            snils: data.snils && data.snils.trim() !== '' ? data.snils : null,
            sex: data.sex && data.sex.trim() !== '' ? data.sex : null,
            role: data.role,
            groupId: data.groupId && data.groupId.trim() !== '' ? data.groupId : null,
            mustChangePassword: data.mustChangePassword || false
          }
        : data

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      // Проверяем, что компонент все еще смонтирован перед обработкой ответа
      if (!isMounted) {
        return
      }

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
      // Игнорируем ошибки, если компонент размонтирован
      if (isMounted) {
        console.error('Ошибка при сохранении пользователя:', error)
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
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
        
        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Первая колонка: Личные данные (имена и личная информация) */}
                <div className="space-y-4">
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
                  
                  <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Отчество</FormLabel>
                        <FormControl>
                          <Input placeholder="Отчество" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="birthday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата рождения</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            max={(() => {
                              // Максимальная дата: сегодня минус 10 лет
                              const today = new Date()
                              const maxDate = new Date(today)
                              maxDate.setFullYear(today.getFullYear() - 10)
                              return maxDate.toISOString().split('T')[0]
                            })()}
                            min={(() => {
                              // Минимальная дата: сегодня минус 150 лет
                              const today = new Date()
                              const minDate = new Date(today)
                              minDate.setFullYear(today.getFullYear() - 150)
                              return minDate.toISOString().split('T')[0]
                            })()}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              // Валидируем поле сразу после изменения
                              setTimeout(() => {
                                form.trigger('birthday')
                              }, 100)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Пол</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value || ''}
                            className="flex flex-row space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="male" id="sex-male" />
                              <Label htmlFor="sex-male" className="cursor-pointer">
                                Мужской
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="female" id="sex-female" />
                              <Label htmlFor="sex-female" className="cursor-pointer">
                                Женский
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="snils"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>СНИЛС</FormLabel>
                        <FormControl>
                          <Input placeholder="СНИЛС (только цифры)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Вторая колонка: Учетные данные и системная информация */}
                <div className="space-y-4">
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
                </div>
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
