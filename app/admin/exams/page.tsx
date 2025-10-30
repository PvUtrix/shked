import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExamForm } from '@/components/admin/exam-form'
import { Award, Users, TrendingUp } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

export default async function AdminExamsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    redirect('/login')
  }

  // Получаем предметы и группы
  const [subjects, groups] = await Promise.all([
    prisma.subject.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.group.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  // Получаем экзамены
  const exams = await prisma.exam.findMany({
    include: {
      subject: { select: { name: true } },
      group: { select: { name: true } },
      results: {
        include: {
          student: { select: { name: true } },
        },
      },
    },
    orderBy: { scheduledAt: 'desc' },
  })

  // Статистика
  const totalExams = exams.length
  const upcomingExams = exams.filter(e => new Date(e.scheduledAt) > new Date()).length
  const totalResults = exams.reduce((sum, e) => sum + e.results.length, 0)
  const passedResults = exams.reduce(
    (sum, e) => sum + e.results.filter(r => r.status === 'PASSED').length,
    0
  )
  const passRate = totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0

  const stats = [
    {
      title: 'Всего экзаменов',
      value: totalExams,
      description: 'В системе',
      icon: Award,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Предстоят',
      value: upcomingExams,
      description: 'Запланировано',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Процент сдачи',
      value: `${passRate}%`,
      description: 'Успешных результатов',
      icon: TrendingUp,
      color: passRate >= 70 ? 'text-green-600' : 'text-red-600',
      bgColor: passRate >= 70 ? 'bg-green-50' : 'bg-red-50',
    },
  ]

  const upcoming = exams.filter(e => new Date(e.scheduledAt) > new Date())
  const past = exams.filter(e => new Date(e.scheduledAt) <= new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление экзаменами</h1>
          <p className="text-muted-foreground mt-2">
            Создание экзаменов и управление результатами
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/subjects">
            К предметам
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

      {/* Форма создания */}
      <Card>
        <CardHeader>
          <CardTitle>Создать новый экзамен</CardTitle>
          <CardDescription>
            Укажите предмет, группу, дату и тип экзамена
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExamForm subjects={subjects} groups={groups} />
        </CardContent>
      </Card>

      {/* Список экзаменов */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Предстоящие ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Прошедшие ({past.length})
          </TabsTrigger>
        </TabsList>

        {[
          { value: 'upcoming', items: upcoming },
          { value: 'past', items: past },
        ].map(({ value, items }) => (
          <TabsContent key={value} value={value} className="space-y-4">
            {items.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Нет экзаменов
                  </p>
                </CardContent>
              </Card>
            ) : (
              items.map((exam) => {
                const total = exam.results.length
                const passed = exam.results.filter(r => r.status === 'PASSED').length
                const failed = exam.results.filter(r => r.status === 'FAILED').length

                return (
                  <Card key={exam.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {exam.subject.name}
                          </CardTitle>
                          <CardDescription>
                            {exam.group.name} • {exam.type} •{' '}
                            {new Date(exam.scheduledAt).toLocaleDateString('ru-RU')}
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/exams/${exam.id}`}>
                            Управление
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    {total > 0 && (
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            Студентов: {total}
                          </span>
                          <span className="text-green-600">
                            Сдали: {passed}
                          </span>
                          <span className="text-red-600">
                            Не сдали: {failed}
                          </span>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
