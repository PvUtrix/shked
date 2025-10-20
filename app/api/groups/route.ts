import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/groups - получение списка групп
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mentor = searchParams.get('mentor') === 'true'

    const where: any = {}

    // Для менторов показываем только их группы
    if (session.user.role === 'mentor' || mentor) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })
      
      // Временно отключаем фильтрацию по mentorGroupIds до применения миграции
      // if (user?.mentorGroupIds) {
      //   const groupIds = Array.isArray(user.mentorGroupIds) ? user.mentorGroupIds : []
      //   where.id = {
      //     in: groupIds
      //   }
      // }
    }

    const groups = await prisma.group.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            users: true,
            schedules: true,
            homework: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ groups })

  } catch (error) {
    console.error('Ошибка при получении групп:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/groups - создание новой группы
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    
    // Валидация обязательных полей
    if (!body.name) {
      return NextResponse.json(
        { error: 'Название группы обязательно' },
        { status: 400 }
      )
    }

    const group = await prisma.group.create({
      data: {
        name: body.name,
        description: body.description,
        semester: body.semester,
        year: body.year
      },
      include: {
        _count: {
          select: {
            users: true,
            schedules: true,
            homework: true
          }
        }
      }
    })

    return NextResponse.json(group, { status: 201 })

  } catch (error) {
    console.error('Ошибка при создании группы:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/groups - обновление группы
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID группы обязателен' },
        { status: 400 }
      )
    }

    const group = await prisma.group.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        semester: body.semester,
        year: body.year
      },
      include: {
        _count: {
          select: {
            users: true,
            schedules: true,
            homework: true
          }
        }
      }
    })

    return NextResponse.json(group)

  } catch (error) {
    console.error('Ошибка при обновлении группы:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups - мягкое удаление группы
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID группы обязателен' },
        { status: 400 }
      )
    }

    // Проверяем существование группы
    const existingGroup = await prisma.group.findUnique({
      where: { id }
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Группа не найдена' },
        { status: 404 }
      )
    }

    // Мягкое удаление - помечаем как неактивную
    await prisma.group.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Группа удалена' })

  } catch (error) {
    console.error('Ошибка при удалении группы:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
