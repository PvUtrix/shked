import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExamGradeBadge, AverageGrade } from '@/components/ui/exam-grade-badge'
import { BookOpen, Calendar, Award, TrendingUp } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function StudentExamsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'student') {
    redirect('/login')
  }

  const studentId = session.user.id

  // Получаем результаты экзаменов студента
  const examResults = await prisma.examResult.findMany({
    where: {
      studentId,
    },
    include: {
      exam: {
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
        },
      },
    },
    orderBy: {
      takenAt: 'desc',
    },
  })

  // Статистика
  const totalExams = examResults.length
  const passedExams = examResults.filter(r => r.status === 'PASSED').length
  const failedExams = examResults.filter(r => r.status === 'FAILED').length
  const pendingExams = examResults.filter(r => r.status === 'NOT_TAKEN').length
  const grades = examResults.map(r => r.grade).filter(Boolean) as string[]

  // Группируем по статусам
  const passed = examResults.filter(r => r.status === 'PASSED')
  const failed = examResults.filter(r => r.status === 'FAILED')
  const pending = examResults.filter(r => r.status === 'NOT_TAKEN')

  const stats = [
    {
      title: 'Всего экзаменов',
      value: totalExams,
      description: 'За весь период',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Сдано',
      value: passedExams,
      description: 'Успешно пройдено',
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Не сдано',
      value: failedExams,
      description: 'Требуется пересдача',
      icon: Calendar,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Ожидают',
      value: pendingExams,
      description: 'Предстоят',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Мои экзамены</h1>
        <p className="text-muted-foreground mt-2">
          Результаты и статистика по экзаменам
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

      {/* Средняя оценка */}
      {grades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Средняя оценка</CardTitle>
            <CardDescription>
              На основе {grades.length} оценок
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AverageGrade grades={grades} />
          </CardContent>
        </Card>
      )}

      {/* Список экзаменов */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Все ({totalExams})
          </TabsTrigger>
          <TabsTrigger value="passed">
            Сдано ({passedExams})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Не сдано ({failedExams})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Ожидают ({pendingExams})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {examResults.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Нет данных об экзаменах
                </p>
              </CardContent>
            </Card>
          ) : (
            examResults.map((result) => (
              <Card key={result.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {result.exam.subject.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {result.exam.group.name} • {result.exam.type}
                      </p>
                      {result.takenAt && (
                        <p className="text-sm text-muted-foreground">
                          Сдано: {new Date(result.takenAt).toLocaleDateString('ru-RU')}
                        </p>
                      )}
                    </div>
                    <ExamGradeBadge
                      grade={result.grade}
                      status={result.status as any}
                    />
                  </div>
                  {result.comments && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm">{result.comments}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="passed" className="space-y-4">
          {passed.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Нет сданных экзаменов
                </p>
              </CardContent>
            </Card>
          ) : (
            passed.map((result) => (
              <Card key={result.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {result.exam.subject.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {result.exam.group.name} • {result.exam.type}
                      </p>
                      {result.takenAt && (
                        <p className="text-sm text-muted-foreground">
                          Сдано: {new Date(result.takenAt).toLocaleDateString('ru-RU')}
                        </p>
                      )}
                    </div>
                    <ExamGradeBadge
                      grade={result.grade}
                      status={result.status as any}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          {failed.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Нет несданных экзаменов
                </p>
              </CardContent>
            </Card>
          ) : (
            failed.map((result) => (
              <Card key={result.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {result.exam.subject.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {result.exam.group.name} • {result.exam.type}
                      </p>
                      {result.takenAt && (
                        <p className="text-sm text-muted-foreground">
                          Попытка: {new Date(result.takenAt).toLocaleDateString('ru-RU')}
                        </p>
                      )}
                    </div>
                    <ExamGradeBadge
                      grade={result.grade}
                      status={result.status as any}
                    />
                  </div>
                  {result.comments && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm">{result.comments}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Нет ожидающих экзаменов
                </p>
              </CardContent>
            </Card>
          ) : (
            pending.map((result) => (
              <Card key={result.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {result.exam.subject.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {result.exam.group.name} • {result.exam.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Дата: {new Date(result.exam.scheduledAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <ExamGradeBadge
                      grade={result.grade}
                      status={result.status as any}
                    />
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


