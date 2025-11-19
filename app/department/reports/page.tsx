import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Users, GraduationCap, TrendingUp } from 'lucide-react'

export default async function DepartmentReportsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'department_admin') {
    redirect('/login')
  }

  const userId = session.user.id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { departmentId: true }
  })

  if (!user?.departmentId) {
    return <div>Department not found</div>
  }

  // Mock data for now - real implementation would require complex aggregations
  // involving grades, attendance, etc.
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Отчеты и аналитика</h1>
        <p className="text-muted-foreground mt-2">
          Статистика успеваемости и показатели эффективности кафедры
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средний балл</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2</div>
            <p className="text-xs text-muted-foreground">+0.1 к прошлому семестру</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Посещаемость</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">В среднем по предметам</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Успеваемость</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">Студентов без задолженностей</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нагрузка</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14.5</div>
            <p className="text-xs text-muted-foreground">Часов в неделю на преподавателя</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Детальные отчеты</CardTitle>
          <CardDescription>
            Функционал генерации подробных отчетов находится в разработке.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center border rounded-md bg-muted/10">
            <p className="text-muted-foreground">Графики и таблицы будут доступны в следующем обновлении</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
