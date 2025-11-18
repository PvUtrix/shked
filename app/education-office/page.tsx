import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, FileText, Users, Calendar } from 'lucide-react'

export default async function EducationOfficeDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'education_office_head') {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Дашборд учебного отдела</h1>
        <p className="text-muted-foreground mt-2">
          Добро пожаловать, {session.user.name}!
        </p>
      </div>

      {/* Информационная карточка */}
      <Card>
        <CardHeader>
          <CardTitle>Функционал находится в разработке</CardTitle>
          <CardDescription>
            Полный функционал для учебного отдела будет доступен в следующих версиях
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Как руководитель учебного отдела, вы отвечаете за координацию учебного процесса.
            В будущих версиях здесь будут доступны:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start">
              <Calendar className="h-5 w-5 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>Управление общим расписанием университета</span>
            </li>
            <li className="flex items-start">
              <Users className="h-5 w-5 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Координация работы всех преподавателей и групп</span>
            </li>
            <li className="flex items-start">
              <FileText className="h-5 w-5 mr-2 mt-0.5 text-purple-600 flex-shrink-0" />
              <span>Сводные отчеты по успеваемости и посещаемости</span>
            </li>
            <li className="flex items-start">
              <GraduationCap className="h-5 w-5 mr-2 mt-0.5 text-orange-600 flex-shrink-0" />
              <span>Управление учебными программами и планами</span>
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
            для получения расширенных прав доступа к административной панели.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
