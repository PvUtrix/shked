import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { SubjectManagement } from '@/components/department/subject-management'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function SubjectManagementPage() {
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

  // Fetch department subjects
  const subjects = await prisma.subject.findMany({
    where: {
      departmentId: user.departmentId
    },
    include: {
      lectors: {
        include: {
          lector: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      _count: {
        select: {
          schedules: true,
          documents: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Fetch faculty for assignment dropdown
  const faculty = await prisma.user.findMany({
    where: {
      departmentId: user.departmentId,
      role: { in: ['lector', 'co_lecturer', 'department_admin'] }
    },
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Предметы кафедры</h1>
        <p className="text-muted-foreground mt-2">
          Управление учебными курсами и назначение ответственных
        </p>
      </div>

      <SubjectManagement 
        initialSubjects={subjects} 
        faculty={faculty}
      />
    </div>
  )
}
