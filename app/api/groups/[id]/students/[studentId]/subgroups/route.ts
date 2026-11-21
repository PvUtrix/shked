import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PUT /api/groups/[id]/students/[studentId]/subgroups - обновление подгрупп студента
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; studentId: string }> }
) {
  try {
    const { id, studentId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['admin', 'mentor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Группа не найдена' },
        { status: 404 }
      )
    }

    // Проверяем существование студента
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Студент не найден' },
        { status: 404 }
      )
    }

    // Проверяем, что студент принадлежит к этой группе
    if (student.groupId !== id) {
      return NextResponse.json(
        { error: 'Студент не принадлежит к этой группе' },
        { status: 400 }
      )
    }

    // Body: { assignments: { [subjectId | "_group"]: subgroupId | null } }.
    // Each key replaces the student's membership among that subject's
    // subgroups in this group; null removes it.
    const assignments: Record<string, string | null> =
      body && typeof body.assignments === 'object' && body.assignments !== null ? body.assignments : {}

    const groupSubgroups = await prisma.subgroup.findMany({
      where: { groupId: id, isActive: true },
      select: { id: true, subjectId: true }
    })
    const subjectKey = (subjectId: string | null) => subjectId ?? '_group'

    for (const [key, subgroupId] of Object.entries(assignments)) {
      const inSubject = groupSubgroups.filter((sg) => subjectKey(sg.subjectId) === key)
      if (subgroupId !== null && !inSubject.some((sg) => sg.id === subgroupId)) {
        return NextResponse.json(
          { error: `Subgroup ${subgroupId} does not belong to subject ${key} in this group` },
          { status: 400 }
        )
      }
      await prisma.$transaction([
        prisma.subgroupStudent.deleteMany({
          where: { userId: studentId, subgroupId: { in: inSubject.map((sg) => sg.id) } }
        }),
        ...(subgroupId ? [prisma.subgroupStudent.create({ data: { userId: studentId, subgroupId } })] : [])
      ])
    }

    return NextResponse.json({ assignments })

  } catch (error) {
    console.error('Ошибка при обновлении подгрупп студента:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

