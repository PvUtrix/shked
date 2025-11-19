'use client'

import { useState, useEffect } from 'react'
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

const subgroupFormSchema = z.object({
  name: z.string().min(1, 'Введите название подгруппы'),
  number: z.coerce.number().min(1, 'Номер должен быть больше 0'),
  subjectId: z.string().optional(),
  description: z.string().optional(),
})

type SubgroupFormValues = z.infer<typeof subgroupFormSchema>

interface SubgroupFormProps {
  groupId: string
  subjects?: Array<{ id: string; name: string }>
  initialData?: SubgroupFormValues & { id?: string }
  onSuccess?: () => void
  onCancel?: () => void
}

export function SubgroupForm({
  groupId,
  subjects = [],
  initialData,
  onSuccess,
  onCancel,
}: SubgroupFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<SubgroupFormValues>({
    resolver: zodResolver(subgroupFormSchema),
    mode: 'onChange', // Валидация при изменении полей
    reValidateMode: 'onChange', // Повторная валидация при изменении
    defaultValues: initialData || {
      name: '',
      number: 1,
      subjectId: undefined,
      description: '',
    },
  })

  // Обновляем форму при изменении initialData (для редактирования)
  useEffect(() => {
    if (initialData) {
      form.reset(initialData)
    } else {
      form.reset({
        name: '',
        number: 1,
        subjectId: undefined,
        description: '',
      })
    }
  }, [initialData, form])

  const onSubmit = async (data: SubgroupFormValues) => {
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
        ? `/api/groups/${groupId}/subgroups/${initialData.id}`
        : `/api/groups/${groupId}/subgroups`

      const response = await fetch(url, {
        method: initialData?.id ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          subjectId: data.subjectId || null,
        }),
      })

      if (!isMounted) {
        return
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка при сохранении подгруппы')
      }

      toast({
        title: 'Успешно',
        description: initialData?.id ? 'Подгруппа обновлена' : 'Подгруппа создана',
      })

      form.reset()
      router.refresh()
      onSuccess?.()
    } catch (error) {
      if (isMounted) {
        toast({
          title: 'Ошибка',
          description: error instanceof Error ? error.message : 'Не удалось сохранить подгруппу',
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название подгруппы *</FormLabel>
              <FormControl>
                <Input placeholder="Подгруппа 1 (Коммерция)" {...field} />
              </FormControl>
              <FormDescription>
                Понятное название для идентификации
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Номер подгруппы *</FormLabel>
              <FormControl>
                <Input type="number" min="1" placeholder="1" {...field} />
              </FormControl>
              <FormDescription>
                Числовой номер (1, 2, 3...)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subjectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Предмет (опционально)</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Общая подгруппа (для всех предметов)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">Общая подгруппа</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Привяжите к предмету или оставьте общей
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
                  placeholder="Дополнительная информация о подгруппе"
                  {...field}
                />
              </FormControl>
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
                {initialData?.id ? 'Обновить' : 'Создать'} подгруппу
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}


