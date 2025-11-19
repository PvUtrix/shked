import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, AlertCircle, Calendar } from 'lucide-react'
import { ExportButton } from '@/components/export/export-button'

export default async function AdminAttendancePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    redirect('/login')
  }

  // Получаем все занятия
  const schedules = await prisma.schedule.findMany({
    where: {
      group: {
        isNot: null, // Только занятия с группой
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
          id: true,
          name: true,
        },
      },
      attendance: {
        include: {
          student: {
            select: {
              name: true,
            },
          },
          marker: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
    take: 100,
  })

  // Статистика
  const totalLessons = schedules.length
  const lessonsWithAttendance = schedules.filter(s => s.attendance.length > 0).length
  const totalAttendanceRecords = schedules.reduce((sum, s) => sum + s.attendance.length, 0)
  const presentCount = schedules.reduce(
    (sum, s) => sum + s.attendance.filter(a => a.status === 'PRESENT').length,
    0
  )
  const attendanceRate = totalAttendanceRecords > 0 
    ? Math.round((presentCount / totalAttendanceRecords) * 100) 
    : 0

  const stats = [
    {
      title: 'Всего занятий',
      value: totalLessons,
      description: 'За последнее время',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'С отметкой',
      value: lessonsWithAttendance,
      description: `Из ${totalLessons}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Посещаемость',
      value: `${attendanceRate}%`,
      description: 'Средняя по всем',
      icon: attendanceRate >= 70 ? TrendingUp : AlertCircle,
      color: attendanceRate >= 70 ? 'text-green-600' : 'text-red-600',
      bgColor: attendanceRate >= 70 ? 'bg-green-50' : 'bg-red-50',
    },
  ]

  // Группируем
  const pending = schedules.filter(s => 
    new Date(s.date) < new Date() && s.attendance.length === 0
  )
  const completed = schedules.filter(s => s.attendance.length > 0)
  const upcoming = schedules.filter(s => new Date(s.date) > new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление посещаемостью</h1>
          <p className="text-muted-foreground mt-2">
            Отметка и просмотр посещаемости по всем занятиям
          </p>
        </div>
        <ExportButton
          endpoint="/api/reports/attendance/export"
          label="Экспорт в Excel"
          variant="default"
        />
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

      {/* Табы */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Требуют отметки ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Предстоящие ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            С отметкой ({completed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Нет занятий, требующих отметки
                </p>
              </CardContent>
            </Card>
          ) : (
            pending.slice(0, 20).map((schedule) => {
              if (!schedule.group) return null // Дополнительная проверка для TypeScript
              
              return (
                <Card key={schedule.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {schedule.subject.name}
                    </CardTitle>
                    <CardDescription>
                      {schedule.group.name} •{' '}
                      {new Date(schedule.date).toLocaleDateString('ru-RU')} •{' '}
                      {schedule.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Функция отметки посещаемости в разработке. 
                      Используйте API для отметки: POST /api/schedules/{schedule.id}/attendance
                    </p>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Нет предстоящих занятий
                </p>
              </CardContent>
            </Card>
          ) : (
            upcoming.slice(0, 20).map((schedule) => {
              if (!schedule.group) return null
              
              return (
                <Card key={schedule.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {schedule.subject.name}
                    </CardTitle>
                    <CardDescription>
                      {schedule.group.name} •{' '}
                      {new Date(schedule.date).toLocaleDateString('ru-RU')} в{' '}
                      {schedule.startTime}{' '}
                      • {schedule.location}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completed.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Нет занятий с отметкой
                </p>
              </CardContent>
            </Card>
          ) : (
            completed.slice(0, 20).map((schedule) => {
              if (!schedule.group) return null
              
              const total = schedule.attendance.length
              const present = schedule.attendance.filter(a => a.status === 'PRESENT').length
              const percent = total > 0 ? Math.round((present / total) * 100) : 0

              return (
                <Card key={schedule.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {schedule.subject.name}
                    </CardTitle>
                    <CardDescription>
                      {schedule.group.name} •{' '}
                      {new Date(schedule.date).toLocaleDateString('ru-RU')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Посещаемость: {present} из {total} ({percent}%)
                      </p>
                      {schedule.attendance[0] && (
                        <div className="text-xs text-muted-foreground">
                          Отметил: {schedule.attendance[0].marker.name} •{' '}
                          {new Date(schedule.attendance[0].markedAt).toLocaleDateString('ru-RU')}
                        </div>
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
