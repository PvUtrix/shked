import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Calendar, Users, FileText } from 'lucide-react'

export default async function AssistantDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'assistant') {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Дашборд ассистента</h1>
        <p className="text-muted-foreground mt-2">
          Добро пожаловать, {session.user.name}!
        </p>
      </div>

      {/* Информационная карточка */}
      <Card>
        <CardHeader>
          <CardTitle>Функционал находится в разработке</CardTitle>
          <CardDescription>
            Полный функционал для ассистентов будет доступен в следующих версиях
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Как ассистент, вы помогаете преподавателям в ведении занятий и проверке работ.
            В будущих версиях здесь будут доступны:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start">
              <Calendar className="h-5 w-5 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>Просмотр расписания занятий</span>
            </li>
            <li className="flex items-start">
              <FileText className="h-5 w-5 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
              <span>Помощь в проверке домашних заданий</span>
            </li>
            <li className="flex items-start">
              <Users className="h-5 w-5 mr-2 mt-0.5 text-purple-600 flex-shrink-0" />
              <span>Отметка посещаемости студентов</span>
            </li>
            <li className="flex items-start">
              <BookOpen className="h-5 w-5 mr-2 mt-0.5 text-orange-600 flex-shrink-0" />
              <span>Доступ к учебным материалам</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Временный доступ к функциям преподавателя */}
      <Card>
        <CardHeader>
          <CardTitle>Временное решение</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            До момента полной реализации функционала, вы можете обратиться к администратору
            для получения доступа к необходимым разделам системы.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
