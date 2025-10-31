import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/users - получение списка пользователей
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const mentor = searchParams.get('mentor') === 'true'
    const groupId = searchParams.get('groupId')

    const where: any = {}

    // Фильтрация по роли
    if (role) {
      where.role = role
    }

    // Для менторов показываем только студентов из их групп
    if (session.user.role === 'mentor' || mentor) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })
      
      // Временно отключаем фильтрацию по mentorGroupIds до применения миграции
      // if (user?.mentorGroupIds) {
      //   const groupIds = Array.isArray(user.mentorGroupIds) ? user.mentorGroupIds : []
      //   where.groupId = {
      //     in: groupIds
      //   }
      // }
    }

    // Фильтрация по группе
    if (groupId) {
      where.groupId = groupId
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        groupId: true,
        createdAt: true,
        group: {
          select: {
            id: true,
            name: true
          }
        }
        // Временно отключаем поля до применения миграции
        // canHelp: true,
        // lookingFor: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ users })

  } catch (error) {
    console.error('Ошибка при получении пользователей:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/users - создание пользователя
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    
    // Валидация обязательных полей
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    // Проверка существования пользователя с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    // Проверка существования группы (если указана)
    if (body.groupId) {
      const group = await prisma.group.findUnique({
        where: { id: body.groupId }
      })

      if (!group) {
        return NextResponse.json(
          { error: 'Группа не найдена' },
          { status: 404 }
        )
      }
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password, // В реальном приложении нужно хешировать
        name: body.name,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role || 'student',
        groupId: body.groupId
      },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        groupId: true,
        createdAt: true
      }
    })

    return NextResponse.json({ user }, { status: 201 })

  } catch (error) {
    console.error('Ошибка при создании пользователя:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/users - обновление пользователя
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID пользователя обязателен' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: body.id },
      data: {
        name: body.name,
        firstName: body.firstName,
        lastName: body.lastName
        // Временно отключаем mentorGroupIds до применения миграции
        // mentorGroupIds: body.mentorGroupIds
      },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        groupId: true,
        createdAt: true
        // Временно отключаем mentorGroupIds до применения миграции
        // mentorGroupIds: true,
      }
    })

    return NextResponse.json({ user })

  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/users - мягкое удаление пользователя
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
        { error: 'ID пользователя обязателен' },
        { status: 400 }
      )
    }

    // Проверяем существование пользователя
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Нельзя удалить самого себя
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Нельзя удалить самого себя' },
        { status: 400 }
      )
    }

    // Мягкое удаление - помечаем как неактивного
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Пользователь деактивирован' })

  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
