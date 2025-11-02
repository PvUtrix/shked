import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DocumentUploadForm } from '@/components/admin/document-upload-form'
import { DocumentsList } from '@/components/admin/documents-list'
import Link from 'next/link'

export default async function AdminDocumentsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    redirect('/login')
  }

  // Получаем все предметы для выбора
  const subjects = await prisma.subject.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Получаем все загруженные документы
  const documents = await prisma.subjectDocument.findMany({
    include: {
      subject: {
        select: {
          name: true,
        },
      },
      uploader: {
        select: {
          name: true,
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
          <h1 className="text-3xl font-bold">Управление документами</h1>
          <p className="text-muted-foreground mt-2">
            Загрузка и управление РПД, аннотациями и учебными материалами
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/subjects">
            К предметам
          </Link>
        </Button>
      </div>

      {/* Форма загрузки */}
      <Card>
        <CardHeader>
          <CardTitle>Загрузить новый документ</CardTitle>
          <CardDescription>
            Загрузите РПД, аннотацию или учебный материал. Выберите предмет из списка.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subjects.length > 0 && (
            <DocumentUploadForm subjectId={subjects[0].id} />
          )}
        </CardContent>
      </Card>

      {/* Список документов */}
      <DocumentsList documents={documents} />
    </div>
  )
}


