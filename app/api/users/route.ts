import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcryptjs from 'bcryptjs'
import { logActivity } from '@/lib/activity-log'

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
    const includeInactive = searchParams.get('includeInactive') === 'true'

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

    // Показываем только активных пользователей (если админ не запросил неактивных)
    // Только админы могут запросить неактивных пользователей
    if (!includeInactive || session.user.role !== 'admin') {
      where.isActive = true
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
        isActive: true,
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

    // Валидация роли - все роли из схемы Prisma
    const validRoles = ['admin', 'student', 'lector', 'mentor', 'assistant', 'co_lecturer', 'education_office_head', 'department_admin']
    if (body.role && !validRoles.includes(body.role)) {
      return NextResponse.json(
        { error: 'Недопустимая роль' },
        { status: 400 }
      )
    }

    // Проверка существования группы (если указана и не пустая)
    let groupId: string | null = null
    if (body.groupId && body.groupId.trim() !== '') {
      const group = await prisma.group.findUnique({
        where: { id: body.groupId }
      })

      if (!group) {
        return NextResponse.json(
          { error: 'Группа не найдена' },
          { status: 404 }
        )
      }
      groupId = body.groupId
    }

    // Хешируем пароль
    const hashedPassword = await bcryptjs.hash(body.password, 12)

    // Подготавливаем данные для создания пользователя
    const userData: any = {
      email: body.email,
      password: hashedPassword,
      name: body.name,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role || 'student',
      mustChangePassword: body.mustChangePassword || false
    }

    // Добавляем связь с группой, если группа указана
    if (groupId) {
      userData.group = {
        connect: { id: groupId }
      }
    }

    const user = await prisma.user.create({
      data: userData,
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

    // Логируем создание пользователя
    await logActivity({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      request,
      details: {
        after: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          groupId: user.groupId
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json({ user }, { status: 201 })

  } catch (error) {
    console.error('Ошибка при создании пользователя:', error)
    
    // Логируем ошибку
    const session = await getServerSession(authOptions)
    if (session?.user) {
      await logActivity({
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'User',
        request,
        details: {
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        },
        result: 'FAILURE'
      })
    }
    
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

    // Получаем текущее состояние пользователя для логирования
    const existingUser = await prisma.user.findUnique({
      where: { id: body.id },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        groupId: true,
        isActive: true
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Валидация роли (если указана)
    const validRoles = ['admin', 'student', 'lector', 'mentor', 'assistant', 'co_lecturer', 'education_office_head', 'department_admin']
    if (body.role && !validRoles.includes(body.role)) {
      return NextResponse.json(
        { error: 'Недопустимая роль' },
        { status: 400 }
      )
    }

    // Проверка существования группы (если указана и не пустая)
    let groupId: string | null = null
    if (body.groupId !== undefined && body.groupId !== null && body.groupId.trim() !== '') {
      const group = await prisma.group.findUnique({
        where: { id: body.groupId }
      })

      if (!group) {
        return NextResponse.json(
          { error: 'Группа не найдена' },
          { status: 404 }
        )
      }
      groupId = body.groupId
    } else if (body.groupId === '') {
      groupId = null
    }

    // Подготавливаем данные для обновления
    const updateData: any = {
      name: body.name,
      firstName: body.firstName,
      lastName: body.lastName
    }

    // Обновляем роль, если указана
    if (body.role !== undefined) {
      updateData.role = body.role
    }

    // Обновляем группу, если указана
    if (body.groupId !== undefined) {
      if (groupId !== null) {
        // Используем связь через group.connect
        updateData.group = {
          connect: { id: groupId }
        }
      } else {
        // Если передан пустой groupId, отключаем связь с группой
        updateData.group = {
          disconnect: true
        }
      }
    }

    // Обновляем пароль, если указан и не пустой
    if (body.password && body.password.trim() !== '') {
      // Хешируем пароль
      updateData.password = await bcryptjs.hash(body.password, 12)
      // Если пароль меняется, сбрасываем флаг mustChangePassword
      updateData.mustChangePassword = false
    }

    // Обновляем флаг mustChangePassword, если указан
    if (body.mustChangePassword !== undefined) {
      updateData.mustChangePassword = body.mustChangePassword
    }

    const user = await prisma.user.update({
      where: { id: body.id },
      data: updateData,
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

    // Логируем обновление пользователя
    await logActivity({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'User',
      entityId: user.id,
      request,
      details: {
        before: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          groupId: existingUser.groupId,
          isActive: existingUser.isActive
        },
        after: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          groupId: user.groupId
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json({ user })

  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error)
    
    // Логируем ошибку
    const session = await getServerSession(authOptions)
    if (session?.user && body?.id) {
      await logActivity({
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'User',
        entityId: body.id,
        request,
        details: {
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        },
        result: 'FAILURE'
      })
    }
    
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

    // Логируем удаление пользователя
    await logActivity({
      userId: session.user.id,
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      request,
      details: {
        before: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          isActive: existingUser.isActive
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json({ message: 'Пользователь деактивирован' })

  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error)
    
    // Логируем ошибку
    const session = await getServerSession(authOptions)
    if (session?.user) {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      if (id) {
        await logActivity({
          userId: session.user.id,
          action: 'DELETE',
          entityType: 'User',
          entityId: id,
          request,
          details: {
            error: error instanceof Error ? error.message : 'Неизвестная ошибка'
          },
          result: 'FAILURE'
        })
      }
    }
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
