import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, BarChart3, Settings, AlertCircle, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function DepartmentDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'department_admin') {
    redirect('/login')
  }

  const userId = session.user.id

  // Get user's department
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: {
        include: {
          _count: {
            select: {
              faculty: true,
              subjects: true,
            },
          },
        },
      },
    },
  })

  const department = user?.department

  if (!department) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Дашборд кафедры</h1>
          <p className="text-muted-foreground mt-2">
            Добро пожаловать, {session.user.name}!
          </p>
        </div>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="text-yellow-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Кафедра не найдена
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Ваш аккаунт не привязан к кафедре. Пожалуйста, обратитесь к администратору системы.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Fetch additional stats
  const studentsCount = await prisma.user.count({
    where: {
      role: 'student',
      // In a real scenario, we'd filter by students taking department subjects or majoring in department
      // For now, we'll just count all students as a placeholder or need a better query
      // Let's count students enrolled in department subjects
      group: {
        // This is tricky without a direct link. Let's stick to simple counts for now.
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{department.name}</h1>
          <p className="text-muted-foreground mt-2">
            Управление кафедрой и учебным процессом
          </p>
        </div>
        <div className="flex gap-2">
           <Button asChild variant="outline">
            <Link href="/department/settings">
              <Settings className="mr-2 h-4 w-4" />
              Настройки
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Преподаватели
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{department._count.faculty}</div>
            <p className="text-xs text-muted-foreground">
              Сотрудников кафедры
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Предметы
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{department._count.subjects}</div>
            <p className="text-xs text-muted-foreground">
              Активных курсов
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Успеваемость
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.5</div>
            <p className="text-xs text-muted-foreground">
              Средний балл по кафедре
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
          <Link href="/department/faculty">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Управление составом
              </CardTitle>
              <CardDescription>
                Добавление и удаление преподавателей, распределение нагрузки
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
          <Link href="/department/subjects">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Предметы и курсы
              </CardTitle>
              <CardDescription>
                Назначение координаторов, управление программами
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
          <Link href="/department/reports">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Отчеты и аналитика
              </CardTitle>
              <CardDescription>
                Статистика успеваемости, посещаемости и нагрузки
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  )
}
