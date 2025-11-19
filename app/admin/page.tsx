
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, BookOpen, Clock } from 'lucide-react'
import { Schedule, Subject, Group } from '@prisma/client'
import Link from 'next/link'

export const dynamic = "force-dynamic"

async function getAdminStats() {
  try {
    const [usersCount, groupsCount, subjectsCount, schedulesCount] = await Promise.all([
      prisma.user.count(),
      prisma.group.count(),
      prisma.subject.count(),
      prisma.schedule.count()
    ])

    return {
      usersCount,
      groupsCount,
      subjectsCount,
      schedulesCount
    }
  } catch (error) {
    console.error('Ошибка при получении статистики:', error)
    return {
      usersCount: 0,
      groupsCount: 0,
      subjectsCount: 0,
      schedulesCount: 0
    }
  }
}

async function getRecentSchedules() {
  try {
    const schedules = await prisma.schedule.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        subject: true,
        group: true
      }
    })
    return schedules || []
  } catch (error) {
    console.error('Ошибка при получении расписаний:', error)
    return []
  }
}

interface ExtendedSchedule extends Schedule {
  subject: Subject | null;
  group: Group | null;
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  const stats = await getAdminStats()
  const recentSchedules: ExtendedSchedule[] = await getRecentSchedules()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Панель администратора
        </h1>
        <p className="text-gray-600 mt-2">
          Добро пожаловать, {session?.user?.name || 'Администратор'}! Управляйте расписанием и группами студентов.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Всего пользователей
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 count-up">
              {stats?.usersCount ?? 0}
            </div>
            <p className="text-xs text-gray-500">
              Студенты и администраторы
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Групп
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 count-up">
              {stats?.groupsCount ?? 0}
            </div>
            <p className="text-xs text-gray-500">
              Активных учебных групп
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Предметов
            </CardTitle>
            <BookOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 count-up">
              {stats?.subjectsCount ?? 0}
            </div>
            <p className="text-xs text-gray-500">
              В базе знаний
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Занятий
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 count-up">
              {stats?.schedulesCount ?? 0}
            </div>
            <p className="text-xs text-gray-500">
              Запланировано
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Schedules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Недавние расписания
          </CardTitle>
          <CardDescription>
            Последние добавленные занятия
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentSchedules?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Расписания не найдены
            </p>
          ) : (
            <div className="space-y-4">
              {recentSchedules?.map((schedule, index) => (
                <div
                  key={schedule?.id || index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {schedule?.subject?.name || 'Предмет не указан'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Группа: {schedule?.group?.name || 'Не указана'} • {schedule?.description || 'Без описания'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {schedule?.startTime || '00:00'} - {schedule?.endTime || '00:00'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {schedule?.date 
                        ? new Date(schedule.date).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : 'Дата не указана'}
                    </p>
                  </div>
                </div>
              )) || []}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
          <CardDescription>
            Часто используемые функции администратора
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/schedule"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Calendar className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">Создать расписание</h3>
              <p className="text-sm text-gray-500">Добавить новое занятие в расписание</p>
            </Link>
            <Link
              href="/admin/groups"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Users className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-medium text-gray-900">Управление группами</h3>
              <p className="text-sm text-gray-500">Создать или изменить учебные группы</p>
            </Link>
            <Link
              href="/admin/subjects"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <BookOpen className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-medium text-gray-900">Добавить предмет</h3>
              <p className="text-sm text-gray-500">Создать новый предмет в базе</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
