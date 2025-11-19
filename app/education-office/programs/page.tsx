import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ProgramList } from '@/components/education-office/program-list'

export default async function ProgramsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'education_office_head') {
    redirect('/login')
  }

  const programs = await prisma.academicProgram.findMany({
    include: {
      department: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          courses: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  const departments = await prisma.department.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Образовательные программы</h1>
        <p className="text-muted-foreground mt-2">
          Управление учебными планами и направлениями подготовки
        </p>
      </div>

      <ProgramList initialPrograms={programs} departments={departments} />
    </div>
  )
}
