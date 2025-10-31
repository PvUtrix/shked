import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, FileText, TrendingUp } from 'lucide-react'

export default async function MentorDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'mentor') {
    redirect('/login')
  }

  // Получаем статистику для ментора
  const mentorId = session.user.id

  const [
    totalStudents,
    scheduledMeetings,
    completedMeetings,
    totalMeetings,
  ] = await Promise.all([
    // Подсчитываем студентов, у которых есть встречи с этим ментором
    prisma.user.count({
      where: {
        studentMeetings: {
          some: {
            mentorId: mentorId,
          },
        },
        role: 'student',
      },
    }),
    // Запланированные встречи
    prisma.mentorMeeting.count({
      where: {
        mentorId,
        status: 'SCHEDULED',
      },
    }),
    // Проведенные встречи
    prisma.mentorMeeting.count({
      where: {
        mentorId,
        status: 'COMPLETED',
      },
    }),
    // Все встречи
    prisma.mentorMeeting.count({
      where: {
        mentorId,
      },
    }),
  ])

  const stats = [
    {
      title: 'Студенты',
      value: totalStudents,
      description: 'Всего под вашим менторством',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Запланировано встреч',
      value: scheduledMeetings,
      description: 'Предстоящие встречи',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Проведено встреч',
      value: completedMeetings,
      description: 'Завершенные встречи',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Всего встреч',
      value: totalMeetings,
      description: 'За всё время',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Дашборд ментора</h1>
        <p className="text-muted-foreground mt-2">
          Добро пожаловать, {session.user.name}!
        </p>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Быстрые действия */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
          <CardDescription>
            Основные функции для работы с студентами
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-4 md:grid-cols-2">
            <a
              href="/mentor/meetings"
              className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Calendar className="h-5 w-5 mr-3 text-blue-600" />
              <div>
                <p className="font-medium">Управление встречами</p>
                <p className="text-sm text-muted-foreground">
                  Просмотр и редактирование встреч
                </p>
              </div>
            </a>
            <a
              href="/mentor/students"
              className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Users className="h-5 w-5 mr-3 text-green-600" />
              <div>
                <p className="font-medium">Профили студентов</p>
                <p className="text-sm text-muted-foreground">
                  Статистика и история встреч
                </p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Информационная карточка */}
      <Card>
        <CardHeader>
          <CardTitle>О роли ментора</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Как ментор, вы отвечаете за академическое и личное развитие ваших студентов.
            Используйте эту систему для планирования встреч, отслеживания прогресса студентов
            и ведения записей о проведенных встречах.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
