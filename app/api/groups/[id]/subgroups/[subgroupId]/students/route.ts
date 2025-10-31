import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/groups/[id]/subgroups/[subgroupId]/students - Добавить студентов в подгруппу
export async function POST(
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
    const { studentIds } = body

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'Не указаны студенты' },
        { status: 400 }
      )
    }

    // Проверка существования подгруппы
    const subgroup = await prisma.subgroup.findFirst({
      where: {
        id: params.subgroupId,
        groupId: params.id
      }
    })

    if (!subgroup) {
      return NextResponse.json({ error: 'Подгруппа не найдена' }, { status: 404 })
    }

    // Добавление студентов
    const createdMemberships = await Promise.all(
      studentIds.map(async (userId: string) => {
        // Проверка, не добавлен ли уже студент
        const existing = await prisma.subgroupStudent.findUnique({
          where: {
            subgroupId_userId: {
              subgroupId: params.subgroupId,
              userId
            }
          }
        })

        if (existing) {
          return null // Пропускаем уже добавленных
        }

        return prisma.subgroupStudent.create({
          data: {
            subgroupId: params.subgroupId,
            userId
          },
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
        })
      })
    )

    const added = createdMemberships.filter(m => m !== null)

    return NextResponse.json({
      message: `Добавлено студентов: ${added.length}`,
      students: added
    }, { status: 201 })
  } catch (error) {
    console.error('Ошибка при добавлении студентов:', error)
    return NextResponse.json(
      { error: 'Не удалось добавить студентов' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[id]/subgroups/[subgroupId]/students?userId=... - Удалить студента из подгруппы
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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Не указан студент' },
        { status: 400 }
      )
    }

    await prisma.subgroupStudent.delete({
      where: {
        subgroupId_userId: {
          subgroupId: params.subgroupId,
          userId
        }
      }
    })

    return NextResponse.json({ message: 'Студент удален из подгруппы' })
  } catch (error) {
    console.error('Ошибка при удалении студента:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить студента' },
      { status: 500 }
    )
  }
}


