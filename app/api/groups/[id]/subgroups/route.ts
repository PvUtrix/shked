import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/groups/[id]/subgroups - Получить подгруппы группы
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')

    const subgroups = await prisma.subgroup.findMany({
      where: {
        groupId: params.id,
        ...(subjectId && { subjectId }),
        isActive: true
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
        },
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: [
        { subjectId: 'asc' },
        { number: 'asc' }
      ]
    })

    return NextResponse.json(subgroups)
  } catch (error) {
    console.error('Ошибка при получении подгрупп:', error)
    return NextResponse.json(
      { error: 'Не удалось получить подгруппы' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[id]/subgroups - Создать подгруппу
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const { subjectId, name, number, description } = body

    // Валидация
    if (!name || !number) {
      return NextResponse.json(
        { error: 'Не все обязательные поля заполнены' },
        { status: 400 }
      )
    }

    // Проверка существования группы
    const group = await prisma.group.findUnique({
      where: { id: params.id }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Группа не найдена' },
        { status: 404 }
      )
    }

    // Проверка на дубликат
    const existingSubgroup = await prisma.subgroup.findUnique({
      where: {
        groupId_subjectId_number: {
          groupId: params.id,
          subjectId: subjectId || null,
          number
        }
      }
    })

    if (existingSubgroup) {
      return NextResponse.json(
        { error: 'Подгруппа с таким номером уже существует' },
        { status: 400 }
      )
    }

    // Создание подгруппы
    const subgroup = await prisma.subgroup.create({
      data: {
        groupId: params.id,
        subjectId: subjectId || null,
        name,
        number,
        description: description || null
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

    return NextResponse.json(subgroup, { status: 201 })
  } catch (error) {
    console.error('Ошибка при создании подгруппы:', error)
    return NextResponse.json(
      { error: 'Не удалось создать подгруппу' },
      { status: 500 }
    )
  }
}


