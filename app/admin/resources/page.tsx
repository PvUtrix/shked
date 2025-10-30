import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalResourceForm } from '@/components/admin/external-resource-form'
import { ResourceList } from '@/components/ui/resource-link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'

export default async function AdminResourcesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    redirect('/login')
  }

  // Получаем все предметы
  const subjects = await prisma.subject.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Получаем все внешние ресурсы
  const resources = await prisma.externalResource.findMany({
    include: {
      subject: {
        select: {
          name: true,
        },
      },
      schedule: {
        select: {
          id: true,
          startTime: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Группируем по типам
  const eor = resources.filter(r => r.type === 'EOR')
  const zoom = resources.filter(r => r.type === 'ZOOM')
  const chats = resources.filter(r => r.type === 'CHAT')
  const other = resources.filter(r => r.type === 'OTHER')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление ресурсами</h1>
          <p className="text-muted-foreground mt-2">
            Внешние образовательные ресурсы, Zoom, чаты и другое
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/subjects">
            К предметам
          </Link>
        </Button>
      </div>

      {/* Форма создания */}
      <Card>
        <CardHeader>
          <CardTitle>Добавить новый ресурс</CardTitle>
          <CardDescription>
            Создайте ссылку на ЭОР, Zoom, чат или другой ресурс
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExternalResourceForm subjects={subjects} />
        </CardContent>
      </Card>

      {/* Список ресурсов */}
      <Tabs defaultValue="eor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="eor">
            ЭОР ({eor.length})
          </TabsTrigger>
          <TabsTrigger value="zoom">
            Zoom ({zoom.length})
          </TabsTrigger>
          <TabsTrigger value="chats">
            Чаты ({chats.length})
          </TabsTrigger>
          <TabsTrigger value="other">
            Другое ({other.length})
          </TabsTrigger>
        </TabsList>

        {[
          { value: 'eor', items: eor, title: 'Электронные образовательные ресурсы' },
          { value: 'zoom', items: zoom, title: 'Zoom конференции' },
          { value: 'chats', items: chats, title: 'Чаты' },
          { value: 'other', items: other, title: 'Другие ресурсы' },
        ].map(({ value, items, title }) => (
          <TabsContent key={value} value={value} className="space-y-4">
            {items.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Нет ресурсов типа &quot;{title}&quot;
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>
                    Всего: {items.length}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResourceList resources={items} />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}


