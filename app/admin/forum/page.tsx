import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Lock, Eye } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

export default async function AdminForumPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    redirect('/login')
  }

  // Получаем все топики
  const topics = await prisma.forumTopic.findMany({
    include: {
      author: {
        select: {
          name: true,
          role: true,
        },
      },
      subject: {
        select: {
          name: true,
        },
      },
      posts: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Статистика
  const totalTopics = topics.length
  const closedTopics = topics.filter(t => t.isClosed).length
  const pinnedTopics = topics.filter(t => t.isPinned).length

  const stats = [
    {
      title: 'Всего топиков',
      value: totalTopics,
      description: 'В форуме',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Закреплено',
      value: pinnedTopics,
      description: 'Важные темы',
      icon: Eye,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Закрыто',
      value: closedTopics,
      description: 'Архивных тем',
      icon: Lock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ]

  const pinned = topics.filter(t => t.isPinned)
  const open = topics.filter(t => !t.isPinned && !t.isClosed)
  const closed = topics.filter(t => t.isClosed)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление форумом</h1>
          <p className="text-muted-foreground mt-2">
            Модерация обсуждений и управление темами
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Список топиков */}
      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">
            Открытые ({open.length})
          </TabsTrigger>
          <TabsTrigger value="pinned">
            Закрепленные ({pinned.length})
          </TabsTrigger>
          <TabsTrigger value="closed">
            Закрытые ({closed.length})
          </TabsTrigger>
        </TabsList>

        {[
          { value: 'open', items: open, title: 'Открытые темы' },
          { value: 'pinned', items: pinned, title: 'Закрепленные темы' },
          { value: 'closed', items: closed, title: 'Закрытые темы' },
        ].map(({ value, items, title }) => (
          <TabsContent key={value} value={value} className="space-y-4">
            {items.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Нет тем в категории &quot;{title}&quot;
                  </p>
                </CardContent>
              </Card>
            ) : (
              items.map((topic) => (
                <Card key={topic.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {topic.isPinned && (
                            <Badge variant="secondary">Закреплено</Badge>
                          )}
                          {topic.isClosed && (
                            <Badge variant="destructive">Закрыто</Badge>
                          )}
                          {topic.subject && (
                            <Badge variant="outline">{topic.subject.name}</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{topic.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {topic.content.substring(0, 150)}
                          {topic.content.length > 150 && '...'}
                        </CardDescription>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span>Автор: {topic.author.name}</span>
                          <span>
                            {new Date(topic.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {topic.posts.length} ответов
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/forum/${topic.id}`}>
                          Управление
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

