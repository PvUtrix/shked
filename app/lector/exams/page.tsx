import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, Users, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExportButton } from '@/components/export/export-button'

export default async function LectorExamsPage({
  searchParams,
}: {
  searchParams: { subject?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || !['lector', 'admin'].includes(session.user.role)) {
    redirect('/login')
  }

  const lectorId = session.user.id
  const subjectId = searchParams.subject

  // Получаем экзамены преподавателя
  const exams = await prisma.exam.findMany({
    where: subjectId ? {
      subjectId,
    } : {
      subject: {
        lectors: {
          some: {
            userId: lectorId,
          },
        },
      },
    },
    include: {
      subject: {
        select: {
          name: true,
        },
      },
      group: {
        select: {
          name: true,
        },
      },
      results: {
        include: {
          student: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
  })

  // Статистика
  const totalExams = exams.length
  const upcomingExams = exams.filter(e => new Date(e.date) > new Date()).length
  const completedExams = exams.filter(e => 
    e.results.some(r => r.status === 'PASSED' || r.status === 'FAILED')
  ).length
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

  // Группируем по статусу
  const upcoming = exams.filter(e => new Date(e.date) > new Date())
  const past = exams.filter(e => new Date(e.date) <= new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Экзамены</h1>
          <p className="text-muted-foreground mt-2">
            Управление экзаменами и результатами
          </p>
        </div>
        <Button asChild>
          <Link href="/lector/exams/new">
            <Plus className="h-4 w-4 mr-2" />
            Создать экзамен
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

        <TabsContent value="upcoming" className="space-y-4">
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <p className="text-muted-foreground">
                  Нет предстоящих экзаменов
                </p>
                <Button asChild>
                  <Link href="/lector/exams/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Создать экзамен
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcoming.map((exam) => (
              <Card key={exam.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {exam.subject.name}
                      </CardTitle>
                      <CardDescription>
                        {exam.group.name} • {exam.type} •{' '}
                        {new Date(exam.date).toLocaleDateString('ru-RU')}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/lector/exams/${exam.id}`}>
                        Управление
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {exam.location && `Место: ${exam.location}`}
                  </p>
                  {exam.description && (
                    <p className="text-sm mt-2">{exam.description}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {past.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Нет прошедших экзаменов
                </p>
              </CardContent>
            </Card>
          ) : (
            past.map((exam) => {
              const totalStudents = exam.results.length
              const passedStudents = exam.results.filter(r => r.status === 'PASSED').length
              const failedStudents = exam.results.filter(r => r.status === 'FAILED').length
              const notTaken = exam.results.filter(r => r.status === 'NOT_TAKEN').length

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
                          {new Date(exam.date).toLocaleDateString('ru-RU')}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <ExportButton
                          endpoint="/api/exams/export"
                          params={{ examId: exam.id }}
                          label="Экспорт"
                          variant="outline"
                          size="sm"
                        />
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/lector/exams/${exam.id}`}>
                            Результаты
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Студентов: {totalStudents}
                        </span>
                        <span className="text-green-600">
                          Сдали: {passedStudents}
                        </span>
                        <span className="text-red-600">
                          Не сдали: {failedStudents}
                        </span>
                        {notTaken > 0 && (
                          <span className="text-orange-600">
                            Не явились: {notTaken}
                          </span>
                        )}
                      </div>
                      {exam.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {exam.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


