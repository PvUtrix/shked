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
import { FileUploader } from '@/components/ui/file-uploader'
import { useToast } from '@/components/ui/use-toast'

const documentFormSchema = z.object({
  type: z.enum(['RPD', 'ANNOTATION', 'SYLLABUS', 'MATERIALS', 'OTHER'], {
    required_error: 'Выберите тип документа',
  }),
  description: z.string().optional(),
})

type DocumentFormValues = z.infer<typeof documentFormSchema>

interface DocumentUploadFormProps {
  subjectId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function DocumentUploadForm({
  subjectId,
  onSuccess,
  onCancel,
}: DocumentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      type: 'MATERIALS',
      description: '',
    },
  })

  const onSubmit = async (data: DocumentFormValues) => {
    if (!file) {
      toast({
        title: 'Ошибка',
        description: 'Выберите файл для загрузки',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', data.type)
      if (data.description) {
        formData.append('description', data.description)
      }

      const response = await fetch(`/api/subjects/${subjectId}/documents`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Ошибка при загрузке документа')
      }

      toast({
        title: 'Успешно',
        description: 'Документ загружен',
      })

      form.reset()
      setFile(null)
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось загрузить документ',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип документа *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="RPD">РПД (Рабочая программа дисциплины)</SelectItem>
                  <SelectItem value="ANNOTATION">Аннотация</SelectItem>
                  <SelectItem value="SYLLABUS">Учебный план</SelectItem>
                  <SelectItem value="MATERIALS">Учебные материалы</SelectItem>
                  <SelectItem value="OTHER">Другое</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Выберите тип загружаемого документа
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
                  placeholder="Краткое описание документа"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Добавьте описание для удобной идентификации
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Файл документа *</FormLabel>
          <div className="mt-2">
            <FileUploader
              onUpload={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              maxSize={10 * 1024 * 1024}
              disabled={uploading}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={uploading}
            >
              Отмена
            </Button>
          )}
          <Button type="submit" disabled={uploading || !file}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Загрузить документ
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}


