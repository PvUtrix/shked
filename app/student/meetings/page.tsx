import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Plus, Clock, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function StudentMeetingsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'student') {
    redirect('/login')
  }

  const studentId = session.user.id

  // Получаем встречи студента
  const meetings = await prisma.mentorMeeting.findMany({
    where: {
      studentId,
    },
    include: {
      mentor: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      scheduledAt: 'desc',
    },
  })

  // Группируем по статусу
  const scheduled = meetings.filter(m => m.status === 'SCHEDULED')
  const completed = meetings.filter(m => m.status === 'COMPLETED')
  const cancelled = meetings.filter(m => m.status === 'CANCELLED')

  // Статистика
  const totalMeetings = meetings.length
  const scheduledCount = scheduled.length
  const completedCount = completed.length

  const stats = [
    {
      title: 'Всего встреч',
      value: totalMeetings,
      description: 'За весь период',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Запланировано',
      value: scheduledCount,
      description: 'Предстоящие',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Проведено',
      value: completedCount,
      description: 'Завершенные',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ]

  const statusConfig = {
    SCHEDULED: {
      label: 'Запланирована',
      color: 'bg-blue-500',
    },
    COMPLETED: {
      label: 'Проведена',
      color: 'bg-green-500',
    },
    CANCELLED: {
      label: 'Отменена',
      color: 'bg-red-500',
    },
  }

  const typeConfig = {
    VKR: 'ВКР',
    ACADEMIC: 'Академическая',
    PERSONAL: 'Личная',
    OTHER: 'Другое',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Встречи с ментором</h1>
          <p className="text-muted-foreground mt-2">
            Планируйте и просматривайте встречи
          </p>
        </div>
        <Button asChild>
          <Link href="/student/meetings/new">
            <Plus className="h-4 w-4 mr-2" />
            Запланировать встречу
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

      {/* Список встреч */}
      <Tabs defaultValue="scheduled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scheduled">
            Запланированные ({scheduledCount})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Проведенные ({completedCount})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Отмененные ({cancelled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          {scheduled.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <p className="text-muted-foreground">
                  Нет запланированных встреч
                </p>
                <Button asChild>
                  <Link href="/student/meetings/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Запланировать встречу
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            scheduled.map((meeting) => (
              <Card key={meeting.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Встреча с {meeting.mentor.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {meeting.mentor.email}
                      </CardDescription>
                    </div>
                    <Badge className={`${statusConfig[meeting.status].color} text-white`}>
                      {statusConfig[meeting.status].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Дата и время:</p>
                      <p className="font-medium">
                        {new Date(meeting.scheduledAt).toLocaleDateString('ru-RU')} в{' '}
                        {new Date(meeting.scheduledAt).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Длительность:</p>
                      <p className="font-medium">{meeting.duration} минут</p>
                    </div>
                  </div>
                  {meeting.location && (
                    <div>
                      <p className="text-sm text-muted-foreground">Место:</p>
                      <p className="text-sm font-medium">{meeting.location}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Тип:</p>
                    <Badge variant="outline">{typeConfig[meeting.meetingType]}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Повестка:</p>
                    <p className="text-sm">{meeting.agenda}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completed.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Нет проведенных встреч
                </p>
              </CardContent>
            </Card>
          ) : (
            completed.map((meeting) => (
              <Card key={meeting.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Встреча с {meeting.mentor.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {new Date(meeting.scheduledAt).toLocaleDateString('ru-RU')}
                      </CardDescription>
                    </div>
                    <Badge className={`${statusConfig[meeting.status].color} text-white`}>
                      {statusConfig[meeting.status].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Тип:</p>
                    <Badge variant="outline">{typeConfig[meeting.meetingType]}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Повестка:</p>
                    <p className="text-sm">{meeting.agenda}</p>
                  </div>
                  {meeting.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Заметки ментора:</p>
                      <div className="mt-2 p-3 bg-muted rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{meeting.notes}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelled.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Нет отмененных встреч
                </p>
              </CardContent>
            </Card>
          ) : (
            cancelled.map((meeting) => (
              <Card key={meeting.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Встреча с {meeting.mentor.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Должна была состояться:{' '}
                        {new Date(meeting.scheduledAt).toLocaleDateString('ru-RU')}
                      </CardDescription>
                    </div>
                    <Badge className={`${statusConfig[meeting.status].color} text-white`}>
                      {statusConfig[meeting.status].label}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


