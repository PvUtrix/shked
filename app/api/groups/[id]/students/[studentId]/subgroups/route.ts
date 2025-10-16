import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PUT /api/groups/[id]/students/[studentId]/subgroups - обновление подгрупп студента
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['admin', 'mentor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: params.id }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Группа не найдена' },
        { status: 404 }
      )
    }

    // Проверяем существование студента
    const student = await prisma.user.findUnique({
      where: { id: params.studentId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Студент не найден' },
        { status: 404 }
      )
    }

    // Проверяем, что студент принадлежит к этой группе
    if (student.groupId !== params.id) {
      return NextResponse.json(
        { error: 'Студент не принадлежит к этой группе' },
        { status: 400 }
      )
    }

    // Обновляем или создаем запись в UserGroup
    const existingUserGroup = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId: params.studentId,
          groupId: params.id
        }
      }
    })

    const subgroupsData = {
      subgroupCommerce: body.subgroupCommerce !== undefined ? body.subgroupCommerce : null,
      subgroupTutorial: body.subgroupTutorial !== undefined ? body.subgroupTutorial : null,
      subgroupFinance: body.subgroupFinance !== undefined ? body.subgroupFinance : null,
      subgroupSystemThinking: body.subgroupSystemThinking !== undefined ? body.subgroupSystemThinking : null
    }

    if (existingUserGroup) {
      // Обновляем существующую запись
      await prisma.userGroup.update({
        where: {
          userId_groupId: {
            userId: params.studentId,
            groupId: params.id
          }
        },
        data: subgroupsData
      })
    } else {
      // Создаем новую запись
      await prisma.userGroup.create({
        data: {
          userId: params.studentId,
          groupId: params.id,
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

