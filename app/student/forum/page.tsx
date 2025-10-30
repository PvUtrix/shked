import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Plus, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function StudentForumPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'student') {
    redirect('/login')
  }

  const studentId = session.user.id

  // Получаем топики форума
  const [allTopics, myTopics] = await Promise.all([
    // Все топики
    prisma.forumTopic.findMany({
      where: {
        OR: [
          { groupId: { not: null } }, // Групповые
          { subjectId: { not: null } }, // По предметам
          { visibility: 'PUBLIC' }, // Публичные
        ],
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        group: {
          select: {
            name: true,
          },
        },
        subject: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    }),
    // Мои топики
    prisma.forumTopic.findMany({
      where: {
        authorId: studentId,
      },
      include: {
        group: {
          select: {
            name: true,
          },
        },
        subject: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ])

  // Статистика
  const totalTopics = allTopics.length
  const myTopicsCount = myTopics.length
  const totalPosts = allTopics.reduce((sum, topic) => sum + topic._count.posts, 0)

  const stats = [
    {
      title: 'Всего тем',
      value: totalTopics,
      description: 'Доступно для просмотра',
      icon: MessageCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Мои темы',
      value: myTopicsCount,
      description: 'Создано мной',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Всего сообщений',
      value: totalPosts,
      description: 'В доступных темах',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Форум</h1>
          <p className="text-muted-foreground mt-2">
            Обсуждения и вопросы по учебе
          </p>
        </div>
        <Button asChild>
          <Link href="/student/forum/new">
            <Plus className="h-4 w-4 mr-2" />
            Создать тему
          </Link>
        </Button>
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

      {/* Список тем */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Все темы ({allTopics.length})
          </TabsTrigger>
          <TabsTrigger value="my">
            Мои темы ({myTopics.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {allTopics.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Нет тем для обсуждения
                </p>
              </CardContent>
            </Card>
          ) : (
            allTopics.map((topic) => (
              <Card key={topic.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/student/forum/${topic.id}`}
                        className="hover:underline"
                      >
                        <CardTitle className="text-lg">
                          {topic.title}
                        </CardTitle>
                      </Link>
                      <CardDescription className="mt-1">
                        {topic.description}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={topic.isPinned ? 'default' : 'outline'}
                      className={topic.isPinned ? 'bg-blue-500' : ''}
                    >
                      {topic.isPinned ? 'Закреплено' : topic.visibility}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>Автор: {topic.author.name}</span>
                      {topic.group && (
                        <span>Группа: {topic.group.name}</span>
                      )}
                      {topic.subject && (
                        <span>Предмет: {topic.subject.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>{topic._count.posts} ответов</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          {myTopics.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <p className="text-muted-foreground">
                  Вы еще не создали ни одной темы
                </p>
                <Button asChild>
                  <Link href="/student/forum/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Создать первую тему
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            myTopics.map((topic) => (
              <Card key={topic.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/student/forum/${topic.id}`}
                        className="hover:underline"
                      >
                        <CardTitle className="text-lg">
                          {topic.title}
                        </CardTitle>
                      </Link>
                      <CardDescription className="mt-1">
                        {topic.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {topic.visibility}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      {topic.group && (
                        <span>Группа: {topic.group.name}</span>
                      )}
                      {topic.subject && (
                        <span>Предмет: {topic.subject.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>{topic._count.posts} ответов</span>
                    </div>
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


