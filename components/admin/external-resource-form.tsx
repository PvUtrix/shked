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
import { useToast } from '@/components/ui/use-toast'

const resourceFormSchema = z.object({
  type: z.enum(['EOR', 'ZOOM', 'CHAT', 'MIRO', 'GOOGLE_DOCS', 'OTHER'], {
    required_error: 'Выберите тип ресурса',
  }),
  title: z.string().min(1, 'Введите название ресурса'),
  url: z.string().url('Введите корректный URL'),
  description: z.string().optional(),
})

type ResourceFormValues = z.infer<typeof resourceFormSchema>

interface ExternalResourceFormProps {
  subjectId?: string
  scheduleId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ExternalResourceForm({
  subjectId,
  scheduleId,
  onSuccess,
  onCancel,
}: ExternalResourceFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    mode: 'onChange', // Валидация при изменении полей
    reValidateMode: 'onChange', // Повторная валидация при изменении
    defaultValues: {
      type: 'EOR',
      title: '',
      url: '',
      description: '',
    },
  })

  const onSubmit = async (data: ResourceFormValues) => {
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

    try {
      let endpoint = ''
      if (subjectId) {
        endpoint = `/api/subjects/${subjectId}/resources`
      } else if (scheduleId) {
        endpoint = `/api/schedules/${scheduleId}/resources`
      } else {
        throw new Error('Необходимо указать subjectId или scheduleId')
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Ошибка при создании ресурса')
      }

      toast({
        title: 'Успешно',
        description: 'Ресурс добавлен',
      })

      form.reset()
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось добавить ресурс',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип ресурса *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="EOR">ЭОР (Электронный образовательный ресурс)</SelectItem>
                  <SelectItem value="ZOOM">Zoom встреча</SelectItem>
                  <SelectItem value="CHAT">Чат (Telegram/Discord)</SelectItem>
                  <SelectItem value="MIRO">Miro доска</SelectItem>
                  <SelectItem value="GOOGLE_DOCS">Google документы</SelectItem>
                  <SelectItem value="OTHER">Другое</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Выберите тип внешнего ресурса
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название *</FormLabel>
              <FormControl>
                <Input placeholder="Zoom встреча - Лекция №5" {...field} />
              </FormControl>
              <FormDescription>
                Понятное название для идентификации ресурса
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL ссылка *</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://zoom.us/j/123456789"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Полная ссылка на ресурс
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
                  placeholder="Дополнительная информация о ресурсе"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Краткое описание или инструкция по использованию
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
                Добавить ресурс
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}


