'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { HomeworkSubmissionFormData } from '@/lib/types'
import { Save, Send } from 'lucide-react'
import { toast } from 'sonner'

const submissionSchema = z.object({
  content: z.string().optional(),
  submissionUrl: z.string().url('Некорректная ссылка').optional().or(z.literal('')),
}).refine(
  (data) => data.content || data.submissionUrl,
  {
    message: 'Необходимо указать контент задания или ссылку на выполненное задание',
    path: ['content'],
  }
)

interface HomeworkSubmissionFormProps {
  homeworkId: string
  existingSubmission?: any
  onSuccess: () => void
  isOverdue?: boolean
}

export function HomeworkSubmissionForm({ 
  homeworkId, 
  existingSubmission, 
  onSuccess, 
  isOverdue = false 
}: HomeworkSubmissionFormProps) {
  const [loading, setLoading] = useState(false)
  const [isDraft, setIsDraft] = useState(false)

  const form = useForm<HomeworkSubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      content: existingSubmission?.content || '',
      submissionUrl: existingSubmission?.submissionUrl || '',
    },
  })

  const onSubmit = async (data: HomeworkSubmissionFormData) => {
    setLoading(true)
    try {
      const url = `/api/homework/${homeworkId}/submit`
      const method = existingSubmission ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success(
          existingSubmission ? 'Работа обновлена' : 'Задание сдано'
        )
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Произошла ошибка')
      }
    } catch (error) {
      console.error('Ошибка при сдаче домашнего задания:', error)
      toast.error('Произошла ошибка при сдаче')
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = async () => {
    const data = form.getValues()
    if (!data.content && !data.submissionUrl) {
      toast.error('Нет данных для сохранения')
      return
    }

    setLoading(true)
    try {
      const url = `/api/homework/${homeworkId}/submit`
      const method = existingSubmission ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, status: 'DRAFT' }),
      })

      if (response.ok) {
        toast.success('Черновик сохранен')
        setIsDraft(true)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при сохранении черновика')
      }
    } catch (error) {
      console.error('Ошибка при сохранении черновика:', error)
      toast.error('Ошибка при сохранении черновика')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Содержание работы (MDX)</FormLabel>
              <FormControl>
                <MarkdownEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Напишите содержание вашей работы в формате Markdown..."
                  height="400px"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="submissionUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ссылка на выполненное задание</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://github.com/username/repository"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">
                Укажите ссылку на GitHub, Google Docs или другой ресурс с вашей работой
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={saveDraft}
            disabled={loading || isOverdue}
          >
            <Save className="h-4 w-4 mr-2" />
            Сохранить черновик
          </Button>
          <Button 
            type="submit" 
            disabled={loading || isOverdue}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {existingSubmission ? 'Обновление...' : 'Сдача...'}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {existingSubmission ? 'Обновить работу' : 'Сдать задание'}
              </>
            )}
          </Button>
        </div>

        {isOverdue && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            ⚠️ Дедлайн истек. Вы не можете сдать это задание.
          </div>
        )}

        {isDraft && (
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
            💾 Черновик сохранен. Не забудьте сдать задание до дедлайна.
          </div>
        )}
      </form>
    </Form>
  )
}
