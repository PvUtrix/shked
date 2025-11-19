import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart3, Users, GraduationCap, Building2, TrendingUp } from 'lucide-react'

export default async function EducationOfficeReportsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'education_office_head') {
    redirect('/login')
  }

  // Mock data for now - real implementation would require complex aggregations
  const stats = {
    totalStudents: await prisma.user.count({ where: { role: 'student' } }),
    totalFaculty: await prisma.user.count({ where: { role: { in: ['lector', 'co_lecturer', 'assistant'] } } }),
    departments: await prisma.department.count(),
    programs: await prisma.academicProgram.count(),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Аналитика университета</h1>
        <p className="text-muted-foreground mt-2">
          Сводные показатели эффективности учебного процесса
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего студентов</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">+5% к прошлому году</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Преподавателей</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFaculty}</div>
            <p className="text-xs text-muted-foreground">Штатных сотрудников</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средняя посещаемость</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">По всем факультетам</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Успеваемость</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.1</div>
            <p className="text-xs text-muted-foreground">Средний балл</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Распределение по кафедрам</CardTitle>
            <CardDescription>Количество студентов и преподавателей</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border rounded-md bg-muted/10">
              <p className="text-muted-foreground">График распределения будет доступен позже</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Динамика успеваемости</CardTitle>
            <CardDescription>Средний балл по семестрам</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border rounded-md bg-muted/10">
              <p className="text-muted-foreground">График динамики будет доступен позже</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
