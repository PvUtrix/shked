import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DocumentUploadForm } from '@/components/admin/document-upload-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Link as LinkIcon, Trash2 } from 'lucide-react'
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
      uploadedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      uploadedAt: 'desc',
    },
  })

  // Группируем по типам
  const rpd = documents.filter(d => d.type === 'RPD')
  const annotations = documents.filter(d => d.type === 'ANNOTATION')
  const materials = documents.filter(d => d.type === 'MATERIALS')
  const other = documents.filter(d => d.type === 'OTHER')

  const handleDelete = async (docId: string) => {
    'use server'
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') return

    await prisma.subjectDocument.delete({
      where: { id: docId },
    })
  }

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
            Загрузите РПД, аннотацию или учебный материал
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUploadForm subjects={subjects} />
        </CardContent>
      </Card>

      {/* Список документов */}
      <Tabs defaultValue="rpd" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rpd">
            РПД ({rpd.length})
          </TabsTrigger>
          <TabsTrigger value="annotations">
            Аннотации ({annotations.length})
          </TabsTrigger>
          <TabsTrigger value="materials">
            Материалы ({materials.length})
          </TabsTrigger>
          <TabsTrigger value="other">
            Другое ({other.length})
          </TabsTrigger>
        </TabsList>

        {[
          { value: 'rpd', docs: rpd, title: 'РПД' },
          { value: 'annotations', docs: annotations, title: 'Аннотации' },
          { value: 'materials', docs: materials, title: 'Материалы' },
          { value: 'other', docs: other, title: 'Другое' },
        ].map(({ value, docs, title }) => (
          <TabsContent key={value} value={value} className="space-y-4">
            {docs.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Нет документов типа "{title}"
                  </p>
                </CardContent>
              </Card>
            ) : (
              docs.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-lg">{doc.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {doc.subject.name}
                        </p>
                        {doc.description && (
                          <p className="text-sm mt-2">{doc.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>Загрузил: {doc.uploadedBy.name}</span>
                          <span>
                            {new Date(doc.uploadedAt).toLocaleDateString('ru-RU')}
                          </span>
                          {doc.version && <span>Версия: {doc.version}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="h-4 w-4 mr-1" />
                            Открыть
                          </a>
                        </Button>
                        <form action={handleDelete.bind(null, doc.id)}>
                          <Button variant="destructive" size="sm" type="submit">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}


