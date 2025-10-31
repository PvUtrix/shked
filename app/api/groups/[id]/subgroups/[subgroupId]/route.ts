import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/groups/[id]/subgroups/[subgroupId] - Получить подгруппу
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; subgroupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const subgroup = await prisma.subgroup.findFirst({
      where: {
        id: params.subgroupId,
        groupId: params.id
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        students: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!subgroup) {
      return NextResponse.json({ error: 'Подгруппа не найдена' }, { status: 404 })
    }

    return NextResponse.json(subgroup)
  } catch (error) {
    console.error('Ошибка при получении подгруппы:', error)
    return NextResponse.json(
      { error: 'Не удалось получить подгруппу' },
      { status: 500 }
    )
  }
}

// PATCH /api/groups/[id]/subgroups/[subgroupId] - Обновить подгруппу
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; subgroupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверка прав доступа
    if (!['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description } = body

    const subgroup = await prisma.subgroup.update({
      where: { id: params.subgroupId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description })
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(subgroup)
  } catch (error) {
    console.error('Ошибка при обновлении подгруппы:', error)
    return NextResponse.json(
      { error: 'Не удалось обновить подгруппу' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[id]/subgroups/[subgroupId] - Удалить подгруппу
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; subgroupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверка прав доступа
    if (!['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Мягкое удаление
    await prisma.subgroup.update({
      where: { id: params.subgroupId },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Подгруппа удалена' })
  } catch (error) {
    console.error('Ошибка при удалении подгруппы:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить подгруппу' },
      { status: 500 }
    )
  }
}


