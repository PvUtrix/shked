'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { HomeworkForm } from '@/components/lector/homework-form'
import Link from 'next/link'

export default function CreateHomeworkPage() {
  const router = useRouter()
  const [homeworkFormOpen, setHomeworkFormOpen] = useState(true)

  const handleFormSuccess = () => {
    router.push('/admin/homework')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/homework">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Создать домашнее задание
            </h1>
            <p className="text-gray-600 mt-2">
              Заполните форму для создания нового домашнего задания
            </p>
          </div>
        </div>
      </div>

      {/* Форма домашнего задания */}
      <HomeworkForm
        open={homeworkFormOpen}
        onOpenChange={setHomeworkFormOpen}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
