'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ExamForm } from '@/components/admin/exam-form'

export default function NewExamPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSuccess = () => {
    router.push('/lector/exams')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/lector/exams">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Создать экзамен
            </h1>
            <p className="text-gray-600 mt-2">
              Заполните информацию о новом экзамене
            </p>
          </div>
        </div>
      </div>

      {/* Exam Form */}
      <Card>
        <CardHeader>
          <CardTitle>Информация об экзамене</CardTitle>
          <CardDescription>
            Укажите предмет, группу, тип экзамена и другие детали
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExamForm
            onSuccess={handleSuccess}
            onCancel={() => router.push('/lector/exams')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
