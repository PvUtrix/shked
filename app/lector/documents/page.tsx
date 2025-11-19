import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DocumentUploadForm } from '@/components/admin/document-upload-form'
import { DocumentsList } from '@/components/admin/documents-list'
import { FileText, Upload } from 'lucide-react'

export default async function LectorDocumentsPage() {
  const session = await getServerSession(authOptions)

  if (!session || !['lector', 'admin'].includes(session.user.role)) {
    redirect('/login')
  }

  const lectorId = session.user.id

  // Получаем предметы преподавателя
  const subjects = await prisma.subject.findMany({
    where: {
      lectors: {
        some: {
          userId: lectorId,
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Получаем документы для предметов преподавателя
  const documents = await prisma.subjectDocument.findMany({
    where: {
      subject: {
        lectors: {
          some: {
            userId: lectorId,
          },
        },
      },
      isActive: true,
    },
    include: {
      subject: {
        select: {
          name: true,
        },
      },
      uploader: {
        select: {
          name: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      uploadedAt: 'desc',
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Документы</h1>
          <p className="text-muted-foreground mt-2">
            Управление РПД, аннотациями и учебными материалами
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Всего документов
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              Для ваших предметов
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              РПД
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.type === 'RPD').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Рабочих программ
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Материалы
            </CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.type === 'MATERIALS').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Учебных материалов
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Форма загрузки */}
      {subjects.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Загрузить новый документ
            </CardTitle>
            <CardDescription>
              Загрузите РПД, аннотацию или учебный материал для одного из ваших предметов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUploadForm subjectId={subjects[0].id} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>У вас нет назначенных предметов</p>
              <p className="text-sm">Обратитесь к администратору для назначения предметов</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Список документов */}
      {documents.length > 0 ? (
        <DocumentsList documents={documents} />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Документы не найдены</p>
              <p className="text-sm">Загрузите первый документ для ваших предметов</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
