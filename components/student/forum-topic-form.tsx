'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, MessageSquare, Pin, Lock } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { useToast } from '@/components/ui/use-toast'

const forumTopicFormSchema = z.object({
  title: z.string().min(5, 'Заголовок должен содержать минимум 5 символов'),
  content: z.string().min(10, 'Содержание должно содержать минимум 10 символов'),
  topicType: z.enum(['ANNOUNCEMENT', 'DISCUSSION', 'QUESTION', 'HOMEWORK_HELP'], {
    required_error: 'Выберите тип темы',
  }),
  visibility: z.enum(['PUBLIC', 'GROUP', 'SUBJECT'], {
    required_error: 'Выберите видимость',
  }),
  groupId: z.string().optional(),
  subjectId: z.string().optional(),
})

type ForumTopicFormValues = z.infer<typeof forumTopicFormSchema>

interface ForumTopicFormProps {
  groups?: Array<{ id: string; name: string }>
  subjects?: Array<{ id: string; name: string }>
  defaultGroupId?: string
  defaultSubjectId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ForumTopicForm({
  groups = [],
  subjects = [],
  defaultGroupId,
  defaultSubjectId,
  onSuccess,
  onCancel,
}: ForumTopicFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<ForumTopicFormValues>({
    resolver: zodResolver(forumTopicFormSchema),
    defaultValues: {
      title: '',
      content: '',
      topicType: 'QUESTION',
      visibility: defaultSubjectId ? 'SUBJECT' : 'PUBLIC',
      groupId: defaultGroupId,
      subjectId: defaultSubjectId,
    },
  })

  const visibility = form.watch('visibility')

  const onSubmit = async (data: ForumTopicFormValues) => {
    setLoading(true)

    try {
      const response = await fetch('/api/forum/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка при создании темы')
      }

      toast({
        title: 'Успешно',
        description: 'Тема создана',
      })

      form.reset()
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать тему',
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Заголовок темы</FormLabel>
              <FormControl>
                <Input
                  placeholder="Вопрос по лекции №5"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormDescription>
                Краткое и понятное описание темы обсуждения
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="topicType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип темы</FormLabel>
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
                  <SelectItem value="QUESTION">
                    <div className="flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Вопрос
                    </div>
                  </SelectItem>
                  <SelectItem value="DISCUSSION">
                    <div className="flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Обсуждение
                    </div>
                  </SelectItem>
                  <SelectItem value="HOMEWORK_HELP">
                    <div className="flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Помощь с ДЗ
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Выберите тип для лучшей организации
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Видимость</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Кто увидит тему" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PUBLIC">Все пользователи</SelectItem>
                  <SelectItem value="GROUP">Только моя группа</SelectItem>
                  <SelectItem value="SUBJECT">Только студенты предмета</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Определяет, кто сможет видеть и отвечать
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {visibility === 'GROUP' && groups.length > 0 && (
          <FormField
            control={form.control}
            name="groupId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Группа</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={loading}
                >
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
        )}

        {visibility === 'SUBJECT' && subjects.length > 0 && (
          <FormField
            control={form.control}
            name="subjectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Предмет</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={loading}
                >
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
        )}

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Содержание</FormLabel>
              <FormControl>
                <MarkdownEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Опишите ваш вопрос или тему для обсуждения..."
                  disabled={loading}
                />
              </FormControl>
              <FormDescription>
                Используйте Markdown для форматирования текста
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
                Создание...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Создать тему
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}


