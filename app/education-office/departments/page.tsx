import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DepartmentList } from '@/components/education-office/department-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function DepartmentsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'education_office_head') {
    redirect('/login')
  }

  const departments = await prisma.department.findMany({
    include: {
      head: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          faculty: true,
          subjects: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Кафедры университета</h1>
          <p className="text-muted-foreground mt-2">
            Обзор и управление структурными подразделениями
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Создать кафедру
        </Button>
      </div>

      <DepartmentList departments={departments} />
    </div>
  )
}
