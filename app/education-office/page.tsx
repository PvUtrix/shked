import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, FileText, Users, Calendar, Building2, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default async function EducationOfficeDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'education_office_head') {
    redirect('/login')
  }

  // Fetch university-wide stats
  const stats = await prisma.$transaction([
    prisma.user.count({ where: { role: 'student' } }),
    prisma.user.count({ where: { role: { in: ['lector', 'co_lecturer', 'assistant'] } } }),
    prisma.department.count(),
    prisma.academicProgram.count(),
  ])

  const [studentCount, facultyCount, departmentCount, programCount] = stats

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Дашборд учебного отдела</h1>
        <p className="text-muted-foreground mt-2">
          Управление учебным процессом университета
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Студенты</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount}</div>
            <p className="text-xs text-muted-foreground">Всего обучающихся</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Преподаватели</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facultyCount}</div>
            <p className="text-xs text-muted-foreground">Профессорско-преподавательский состав</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Кафедры</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentCount}</div>
            <p className="text-xs text-muted-foreground">Активных подразделений</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Программы</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{programCount}</div>
            <p className="text-xs text-muted-foreground">Образовательных программ</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
          <Link href="/education-office/schedule">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Расписание
              </CardTitle>
              <CardDescription>
                Управление общим расписанием, проверка конфликтов
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
          <Link href="/education-office/departments">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Кафедры
              </CardTitle>
              <CardDescription>
                Координация работы кафедр, назначение заведующих
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
          <Link href="/education-office/programs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Программы
              </CardTitle>
              <CardDescription>
                Управление учебными планами и программами
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
          <Link href="/education-office/reports">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Отчеты
              </CardTitle>
              <CardDescription>
                Сводная аналитика по университету
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  )
}
