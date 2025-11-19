import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { FacultyList } from '@/components/department/faculty-list'
import { AddFacultyModal } from '@/components/department/add-faculty-modal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function FacultyManagementPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'department_admin') {
    redirect('/login')
  }

  const userId = session.user.id

  // Get user's department
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { departmentId: true }
  })

  if (!user?.departmentId) {
    return (
      <div className="p-6">
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="text-yellow-900">Кафедра не найдена</CardTitle>
            <CardDescription className="text-yellow-700">
              Ваш аккаунт не привязан к кафедре.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Fetch faculty members
  const faculty = await prisma.user.findMany({
    where: {
      departmentId: user.departmentId,
      // Exclude students from faculty list usually, but keeping flexible for now
      role: { in: ['lector', 'co_lecturer', 'assistant', 'mentor', 'department_admin'] }
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      _count: {
        select: {
          lectorSubjects: true,
          assistantSubjects: true,
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Сотрудники кафедры</h1>
          <p className="text-muted-foreground mt-2">
            Управление преподавательским составом и распределение нагрузки
          </p>
        </div>
        <AddFacultyModal />
      </div>

      <FacultyList 
        initialFaculty={faculty} 
        departmentId={user.departmentId} 
      />
    </div>
  )
}
