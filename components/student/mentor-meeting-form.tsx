'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Calendar } from 'lucide-react'
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

const meetingFormSchema = z.object({
  mentorId: z.string().min(1, 'Выберите ментора'),
  scheduledAt: z.date({
    required_error: 'Укажите дату и время',
  }),
  duration: z.coerce.number().min(15).max(180).default(60),
  agenda: z.string().min(5, 'Опишите повестку встречи'),
  meetingType: z.enum(['VKR', 'ACADEMIC', 'PERSONAL', 'OTHER'], {
    required_error: 'Выберите тип встречи',
  }),
  location: z.string().optional(),
})

type MeetingFormValues = z.infer<typeof meetingFormSchema>

interface MentorMeetingFormProps {
  mentors?: Array<{ id: string; name: string; firstName?: string; lastName?: string }>
  studentId: string
  defaultMentorId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function MentorMeetingForm({
  mentors = [],
  studentId,
  defaultMentorId,
  onSuccess,
  onCancel,
}: MentorMeetingFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      mentorId: defaultMentorId || '',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Завтра
      duration: 60,
      agenda: '',
      meetingType: 'VKR',
      location: '',
    },
  })

  const onSubmit = async (data: MeetingFormValues) => {
    setLoading(true)

    try {
      const response = await fetch('/api/mentor-meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          studentId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка при создании встречи')
      }

      toast({
        title: 'Успешно',
        description: 'Встреча запланирована',
      })

      form.reset()
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать встречу',
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
          name="mentorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ментор / Научный руководитель</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите ментора" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mentors.map((mentor) => (
                    <SelectItem key={mentor.id} value={mentor.id}>
                      {mentor.name || `${mentor.firstName} ${mentor.lastName}`}
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
          name="meetingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип встречи</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="VKR">ВКР (Выпускная квалификационная работа)</SelectItem>
                  <SelectItem value="ACADEMIC">Академическая (учебные вопросы)</SelectItem>
                  <SelectItem value="PERSONAL">Личная (карьера, развитие)</SelectItem>
                  <SelectItem value="OTHER">Другое</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="scheduledAt"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Дата и время</FormLabel>
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                />
                <FormDescription>
                  Предложите удобное время
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Длительность (минуты)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="15"
                    max="180"
                    step="15"
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormDescription>
                  От 15 до 180 минут
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Место встречи (опционально)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Офис ментора / Zoom"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormDescription>
                Укажите место или ссылку на Zoom
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agenda"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Повестка встречи</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Что хотите обсудить на встрече..."
                  rows={4}
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormDescription>
                Опишите вопросы и темы для обсуждения
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
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Отправка запроса...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Запланировать встречу
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}


