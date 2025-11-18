import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, FileText, Settings } from 'lucide-react'

export default async function DepartmentDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'department_admin') {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Дашборд администратора кафедры</h1>
        <p className="text-muted-foreground mt-2">
          Добро пожаловать, {session.user.name}!
        </p>
      </div>

      {/* Информационная карточка */}
      <Card>
        <CardHeader>
          <CardTitle>Функционал находится в разработке</CardTitle>
          <CardDescription>
            Полный функционал для администраторов кафедры будет доступен в следующих версиях
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Как администратор кафедры, вы управляете деятельностью вашей кафедры.
            В будущих версиях здесь будут доступны:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start">
              <Users className="h-5 w-5 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>Управление преподавателями кафедры</span>
            </li>
            <li className="flex items-start">
              <BookOpen className="h-5 w-5 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Координация предметов и учебных программ кафедры</span>
            </li>
            <li className="flex items-start">
              <FileText className="h-5 w-5 mr-2 mt-0.5 text-purple-600 flex-shrink-0" />
              <span>Отчеты по успеваемости студентов</span>
            </li>
            <li className="flex items-start">
              <Settings className="h-5 w-5 mr-2 mt-0.5 text-orange-600 flex-shrink-0" />
              <span>Настройка параметров кафедры</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Временное решение */}
      <Card>
        <CardHeader>
          <CardTitle>Временное решение</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            До момента полной реализации функционала, вы можете обратиться к администратору
            для получения необходимых прав доступа.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
