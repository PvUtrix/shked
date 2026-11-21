import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/groups/[id]/students - получение списка студентов группы с подгруппами
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['admin', 'mentor', 'lector'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Группа не найдена' },
        { status: 404 }
      )
    }

    // Получаем студентов группы
    const students = await prisma.user.findMany({
      where: {
        groupId: groupId,
        role: 'student',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        subgroupMemberships: {
          where: { subgroup: { groupId } },
          select: { subgroupId: true, subgroup: { select: { subjectId: true } } }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    // Преобразуем данные в удобный формат
    // subgroups maps a subject id ("_group" for group-wide subgroups) to the
    // student's subgroup in it.
    const studentsWithSubgroups = students.map(student => ({
      id: student.id,
      name: student.name,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      subgroups: Object.fromEntries(
        student.subgroupMemberships.map((m) => [m.subgroup.subjectId ?? '_group', m.subgroupId])
      ) as Record<string, string>
    }))

    return NextResponse.json({ students: studentsWithSubgroups })

  } catch (error) {
    console.error('Ошибка при получении студентов группы:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[id]/students - добавление студента в группу
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    
    if (!body.userId) {
      return NextResponse.json(
        { error: 'ID студента обязателен' },
        { status: 400 }
      )
    }

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Группа не найдена' },
        { status: 404 }
      )
    }

    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({
      where: { id: body.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Обновляем groupId пользователя
    await prisma.user.update({
      where: { id: body.userId },
      data: { groupId: groupId }
    })

    // Создаем запись в UserGroup (если еще не существует)
    const existingUserGroup = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId: body.userId,
          groupId: groupId
        }
      }
    })

    if (!existingUserGroup) {
      await prisma.userGroup.create({
        data: {
          userId: body.userId,
          groupId: groupId
        }
      })
    }

    return NextResponse.json({ message: 'Студент добавлен в группу' }, { status: 201 })

  } catch (error) {
    console.error('Ошибка при добавлении студента в группу:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[id]/students - удаление студента из группы
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID студента обязателен' },
        { status: 400 }
      )
    }

    // Удаляем запись из UserGroup
    await prisma.userGroup.deleteMany({
      where: {
        userId,
        groupId: groupId
      }
    })

    // Leaving the group also ends the student's subgroup memberships in it.
    await prisma.subgroupStudent.deleteMany({
      where: { userId, subgroup: { groupId } }
    })

    // Убираем groupId у пользователя
    await prisma.user.update({
      where: { id: userId },
      data: { groupId: null }
    })

    return NextResponse.json({ message: 'Студент удален из группы' })

  } catch (error) {
    console.error('Ошибка при удалении студента из группы:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

