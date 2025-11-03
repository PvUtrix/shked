'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { useToast } from '@/components/ui/use-toast'

const examFormSchema = z.object({
  subjectId: z.string().min(1, 'Выберите предмет'),
  groupId: z.string().min(1, 'Выберите группу'),
  type: z.enum(['EXAM', 'CREDIT', 'DIFF_CREDIT'], {
    required_error: 'Выберите тип аттестации',
  }),
  format: z.enum(['ORAL', 'WRITTEN', 'MIXED'], {
    required_error: 'Выберите формат',
  }),
  date: z.date({
    required_error: 'Укажите дату и время',
  }),
  location: z.string().optional(),
  description: z.string().optional(),
})

type ExamFormValues = z.infer<typeof examFormSchema>

interface ExamFormProps {
  subjects?: Array<{ id: string; name: string }>
  groups?: Array<{ id: string; name: string }>
  initialData?: ExamFormValues & { id?: string }
  onSuccess?: () => void
  onCancel?: () => void
}

export function ExamForm({
  subjects = [],
  groups = [],
  initialData,
  onSuccess,
  onCancel,
}: ExamFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examFormSchema),
    mode: 'onChange', // Валидация при изменении полей
    reValidateMode: 'onChange', // Повторная валидация при изменении
    defaultValues: initialData || {
      subjectId: '',
      groupId: '',
      type: 'EXAM',
      format: 'ORAL',
      date: new Date(),
      location: '',
      description: '',
    },
  })

  // Обновляем форму при изменении initialData (для редактирования)
  useEffect(() => {
    if (initialData) {
      form.reset(initialData)
    } else {
      form.reset({
        subjectId: '',
        groupId: '',
        type: 'EXAM',
        format: 'ORAL',
        date: new Date(),
        location: '',
        description: '',
      })
    }
  }, [initialData, form])

  const onSubmit = async (data: ExamFormValues) => {
    // Принудительно валидируем все поля перед отправкой
    const isValid = await form.trigger()
    if (!isValid) {
      // Получаем первое поле с ошибкой и переводим на него фокус
      const errorFields = Object.keys(form.formState.errors)
      if (errorFields.length > 0) {
        const firstError = errorFields[0]
        let fieldElement = document.querySelector(`[name="${firstError}"]`) as HTMLElement
        if (!fieldElement) {
          fieldElement = document.querySelector(`[aria-invalid="true"]`) as HTMLElement
        }
        if (fieldElement) {
          fieldElement.focus()
          setTimeout(() => {
            fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }
      }
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, заполните все обязательные поля',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    let isMounted = true

    try {
      const url = initialData?.id
        ? `/api/exams/${initialData.id}`
        : '/api/exams'

      const response = await fetch(url, {
        method: initialData?.id ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!isMounted) {
        return
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка при сохранении экзамена')
      }

      toast({
        title: 'Успешно',
        description: initialData?.id ? 'Экзамен обновлен' : 'Экзамен создан',
      })

      form.reset()
      router.refresh()
      onSuccess?.()
    } catch (error) {
      if (isMounted) {
        toast({
          title: 'Ошибка',
          description: error instanceof Error ? error.message : 'Не удалось сохранить экзамен',
          variant: 'destructive',
        })
      }
    } finally {
      if (isMounted) {
        setLoading(false)
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="subjectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Предмет *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <FormLabel>Группа *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите группу" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип аттестации *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="EXAM">Экзамен</SelectItem>
                    <SelectItem value="CREDIT">Зачет</SelectItem>
                    <SelectItem value="DIFF_CREDIT">Дифференцированный зачет</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="format"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Формат *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите формат" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ORAL">Устный</SelectItem>
                    <SelectItem value="WRITTEN">Письменный</SelectItem>
                    <SelectItem value="MIXED">Смешанный</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Дата и время *</FormLabel>
              <DateTimePicker
                value={field.value}
                onChange={field.onChange}
              />
              <FormDescription>
                Укажите дату и время проведения
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Место проведения (опционально)</FormLabel>
              <FormControl>
                <Input placeholder="Аудитория 401" {...field} />
              </FormControl>
              <FormDescription>
                Укажите аудиторию или место проведения
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание (опционально)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Дополнительная информация об экзамене"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Темы, материалы для подготовки и т.д.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Отмена
            </Button>
          )}
          <Button type="submit" disabled={loading || !form.formState.isValid}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {initialData?.id ? 'Обновить' : 'Создать'} экзамен
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}


