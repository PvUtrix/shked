import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Download, ExternalLink, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default async function AssistantMaterialsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'assistant') {
    redirect('/login')
  }

  const userId = session.user.id

  // Get assignments
  const assignments = await prisma.subjectAssistant.findMany({
    where: {
      userId,
      isActive: true,
    },
  })

  const subjectIds = assignments.map((a) => a.subjectId)

  // Get documents
  const documents = await prisma.subjectDocument.findMany({
    where: {
      subjectId: {
        in: subjectIds,
      },
      isActive: true,
    },
    include: {
      subject: true,
      uploader: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      uploadedAt: 'desc',
    },
  })

  // Get external resources
  const resources = await prisma.externalResource.findMany({
    where: {
      subjectId: {
        in: subjectIds,
      },
      isActive: true,
    },
    include: {
      subject: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  const docTypeLabels: Record<string, string> = {
    RPD: 'Рабочая программа',
    ANNOTATION: 'Аннотация',
    MATERIALS: 'Учебные материалы',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Материалы</h1>
        <p className="text-muted-foreground mt-2">
          Доступ к учебным материалам и ресурсам
        </p>
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">
            Документы ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="resources">
            Ресурсы ({resources.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Нет доступных документов
                </p>
              </CardContent>
            </Card>
          ) : (
            documents.map((doc) => (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {doc.fileName}
                      </CardTitle>
                      <CardDescription>
                        {doc.subject.name}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {docTypeLabels[doc.type] || doc.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Загружено: {doc.uploader.name || doc.uploader.email}
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(doc.uploadedAt), 'd MMMM yyyy, HH:mm', {
                          locale: ru,
                        })}
                      </p>
                      {doc.fileSize && (
                        <p>Размер: {formatFileSize(doc.fileSize)}</p>
                      )}
                    </div>
                    <Button asChild>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Скачать
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          {resources.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Нет доступных ресурсов
                </p>
              </CardContent>
            </Card>
          ) : (
            resources.map((resource) => (
              <Card key={resource.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">
                        {resource.title}
                      </CardTitle>
                      <CardDescription>
                        {resource.subject?.name || 'Общий ресурс'}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{resource.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {resource.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {resource.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(resource.createdAt), 'd MMMM yyyy', {
                        locale: ru,
                      })}
                    </p>
                    <Button asChild variant="outline">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Открыть
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
