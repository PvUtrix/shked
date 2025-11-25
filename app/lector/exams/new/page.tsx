import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ExamForm } from '@/components/admin/exam-form'

export default async function NewExamPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  // Проверка роли - только преподаватели могут создавать экзамены
  const allowedRoles = ['admin', 'lector', 'co_lecturer', 'assistant', 'education_office_head', 'department_admin']
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/')
  }

  // Получаем предметы преподавателя через SubjectLector
  const subjects = await prisma.subject.findMany({
    where: {
      lectors: {
        some: {
          userId: session.user.id
        }
      }
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  // Получаем группы
  const groups = await prisma.group.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

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
            subjects={subjects}
            groups={groups}
            onSuccess={() => redirect('/lector/exams')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
