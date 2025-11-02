'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Link as LinkIcon, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

interface Document {
  id: string
  fileName: string
  fileUrl: string
  fileSize?: number | null
  uploadedAt: Date
  type: string
  subject: {
    name: string
  }
  uploader: {
    name: string
  }
}

interface DocumentsListProps {
  documents: Document[]
}

export function DocumentsList({ documents }: DocumentsListProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [docToDelete, setDocToDelete] = useState<Document | null>(null)

  // Группируем по типам
  const rpd = documents.filter(d => d.type === 'RPD')
  const annotations = documents.filter(d => d.type === 'ANNOTATION')
  const materials = documents.filter(d => d.type === 'MATERIALS')
  const other = documents.filter(d => d.type === 'OTHER')

  const handleDeleteClick = (doc: Document) => {
    setDocToDelete(doc)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!docToDelete) return

    try {
      const response = await fetch(`/api/documents/${docToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Документ удален')
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при удалении документа')
      }
    } catch (error) {
      console.error('Ошибка при удалении документа:', error)
      toast.error('Произошла ошибка при удалении')
    } finally {
      setDeleteDialogOpen(false)
      setDocToDelete(null)
    }
  }

  return (
    <>
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
                    Нет документов типа &quot;{title}&quot;
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
                          <h3 className="font-semibold text-lg">{doc.fileName}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {doc.subject.name}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>Загрузил: {doc.uploader.name}</span>
                          <span>
                            {new Date(doc.uploadedAt).toLocaleDateString('ru-RU')}
                          </span>
                          {doc.fileSize && (
                            <span>Размер: {Math.round(doc.fileSize / 1024)} KB</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="h-4 w-4 mr-1" />
                            Открыть
                          </a>
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteClick(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Удалить документ"
        description={`Вы уверены, что хотите удалить документ "${docToDelete?.fileName}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </>
  )
}

