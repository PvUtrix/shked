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

    // Обновляем или создаем запись в UserGroup
    const existingUserGroup = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId: studentId,
          groupId: id
        }
      }
    })

    // Prepare exactly only what's provided in the payload body
    const subgroupsData: Record<string, any> = {}
    if (body.subgroupCommerce !== undefined) subgroupsData.subgroupCommerce = body.subgroupCommerce
    if (body.subgroupTutorial !== undefined) subgroupsData.subgroupTutorial = body.subgroupTutorial
    if (body.subgroupFinance !== undefined) subgroupsData.subgroupFinance = body.subgroupFinance
    if (body.subgroupSystemThinking !== undefined) subgroupsData.subgroupSystemThinking = body.subgroupSystemThinking

    if (existingUserGroup) {
      // Обновляем существующую запись
      await prisma.userGroup.update({
        where: {
          userId_groupId: {
            userId: studentId,
            groupId: id
          }
        },
        data: subgroupsData
      })
    } else {
      // Создаем новую запись, недостающие поля станут null по умолчанию (или согласно схеме)
      await prisma.userGroup.create({
        data: {
          userId: studentId,
          groupId: id,
          ...subgroupsData
        }
      })
    }

    return NextResponse.json({ 
      message: 'Подгруппы обновлены',
      subgroups: subgroupsData
    })

  } catch (error) {
    console.error('Ошибка при обновлении подгрупп студента:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

