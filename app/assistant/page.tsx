import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, FileText, Users, BookOpen, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default async function AssistantDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'assistant') {
    redirect('/login')
  }

  const userId = session.user.id

  // Get assistant assignments
  const assignments = await prisma.subjectAssistant.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      subject: true,
    },
  })

  const subjectIds = assignments.map((a) => a.subjectId)

  // Get upcoming schedules
  const now = new Date()
  const upcomingSchedules = await prisma.schedule.findMany({
    where: {
      subjectId: {
        in: subjectIds,
      },
      date: {
        gte: now,
      },
      isActive: true,
    },
    include: {
      subject: true,
      group: true,
      attendance: true,
    },
    orderBy: {
      date: 'asc',
    },
    take: 5,
  })

  // Get schedules needing attendance
  const needsAttendance = await prisma.schedule.findMany({
    where: {
      subjectId: {
        in: subjectIds,
      },
      date: {
        lt: now,
        gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
      isActive: true,
    },
    include: {
      group: {
        include: {
          users: {
            select: { id: true },
          },
        },
      },
      attendance: {
        select: { id: true },
      },
    },
  })

  const pendingAttendance = needsAttendance.filter((schedule) => {
    const totalStudents = schedule.group?.users.length || 0
    const markedStudents = schedule.attendance.length
    return totalStudents > 0 && markedStudents < totalStudents
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Дашборд ассистента</h1>
        <p className="text-muted-foreground mt-2">
          Добро пожаловать, {session.user.name}!
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Назначенные предметы
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">
              Активных назначений
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ближайшие занятия
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingSchedules.length}</div>
            <p className="text-xs text-muted-foreground">
              В ближайшее время
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Требует внимания
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAttendance.length}</div>
            <p className="text-xs text-muted-foreground">
              Посещаемость не отмечена
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
          <CardDescription>
            Основные функции ассистента
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/assistant/schedule">
                <Calendar className="h-6 w-6 mb-2" />
                <span className="font-semibold">Расписание</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Просмотр занятий
                </span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/assistant/attendance">
                <Users className="h-6 w-6 mb-2" />
                <span className="font-semibold">Посещаемость</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Отметка студентов
                </span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/assistant/materials">
                <FileText className="h-6 w-6 mb-2" />
                <span className="font-semibold">Материалы</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Учебные ресурсы
                </span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/assistant/homework">
                <BookOpen className="h-6 w-6 mb-2" />
                <span className="font-semibold">Домашние задания</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Проверка работ
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Subjects */}
      {assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Мои предметы</CardTitle>
            <CardDescription>
              Предметы, где вы выступаете ассистентом
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {assignments.map((assignment) => (
                <Badge key={assignment.id} variant="secondary" className="text-sm">
                  <BookOpen className="mr-1 h-3 w-3" />
                  {assignment.subject.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Schedule */}
      {upcomingSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ближайшие занятия</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/assistant/schedule">Все занятия →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{schedule.subject.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {schedule.group?.name || 'Без группы'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(schedule.date), 'd MMMM, ', { locale: ru })}
                        {schedule.startTime}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={schedule.attendance.length > 0 ? 'default' : 'outline'}
                  >
                    {schedule.attendance.length > 0 ? 'Отмечено' : 'Ожидает'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Attendance */}
      {pendingAttendance.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-orange-900">Требует внимания</CardTitle>
            <CardDescription className="text-orange-700">
              Занятия с неотмеченной посещаемостью
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingAttendance.slice(0, 3).map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {format(new Date(schedule.date), 'd MMMM', { locale: ru })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {schedule.group?.name || 'Без группы'}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/assistant/attendance/${schedule.id}`}>
                      Отметить
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
            {pendingAttendance.length > 3 && (
              <Button asChild variant="link" className="mt-2 w-full">
                <Link href="/assistant/attendance">
                  Показать все ({pendingAttendance.length})
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
