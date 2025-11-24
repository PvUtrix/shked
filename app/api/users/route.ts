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
      const _user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })

      // Временно отключаем фильтрацию по mentorGroupIds до применения миграции
      // if (_user?.mentorGroupIds) {
      //   const groupIds = Array.isArray(_user.mentorGroupIds) ? _user.mentorGroupIds : []
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
        // name больше не используется - формируем имя из firstName, lastName, middleName
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        birthday: true,
        snils: true,
        sex: true,
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
        lastName: 'asc' // Сортируем по фамилии вместо name
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

    // Валидация даты рождения
    if (body.birthday && body.birthday.trim() !== '') {
      const birthdayDate = new Date(body.birthday)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Проверяем, что дата не в будущем
      if (birthdayDate > today) {
        return NextResponse.json(
          { error: 'Дата рождения не может быть в будущем' },
          { status: 400 }
        )
      }
      
      // Проверяем, что возраст не меньше 10 лет
      const minDate = new Date(today)
      minDate.setFullYear(today.getFullYear() - 10)
      
      if (birthdayDate > minDate) {
        return NextResponse.json(
          { error: 'Возраст не может быть меньше 10 лет' },
          { status: 400 }
        )
      }
      
      // Проверяем, что возраст не больше 150 лет
      const maxDate = new Date(today)
      maxDate.setFullYear(today.getFullYear() - 150)
      
      if (birthdayDate < maxDate) {
        return NextResponse.json(
          { error: 'Возраст не может быть больше 150 лет' },
          { status: 400 }
        )
      }
    }

    // Хешируем пароль
    const hashedPassword = await bcryptjs.hash(body.password, 12)

    // Подготавливаем данные для создания пользователя
      // Поле name больше не используется - формируем имя из компонентов при необходимости
      const userData: any = {
        email: body.email,
        password: hashedPassword,
        // name больше не используется
        firstName: body.firstName,
        lastName: body.lastName,
        middleName: body.middleName,
        birthday: body.birthday ? new Date(body.birthday) : null,
        snils: body.snils,
        sex: body.sex,
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
        // name больше не используется
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        birthday: true,
        snils: true,
        sex: true,
        role: true,
        groupId: true,
        createdAt: true
      }
    })

    // Логируем создание пользователя
    // Используем email из сессии, так как ID может быть устаревшим после сброса БД
    await logActivity({
      userId: session.user.email || session.user.id,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      request,
      details: {
        after: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
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
        userId: session.user.email || session.user.id,
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
  let body: any = null
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    body = await request.json()
    
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
        // name больше не используется
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        birthday: true,
        snils: true,
        sex: true,
        role: true,
        groupId: true
        // Не включаем isActive, так как он не должен изменяться через эту форму
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
    // Обновляем только те поля, которые были явно переданы
    // ВАЖНО: Не обновляем системные поля вроде isActive, которые не должны изменяться через эту форму
    const updateData: any = {}
    
    // Защита от случайного изменения isActive - игнорируем это поле, если оно передано
    if (body.isActive !== undefined) {
      console.warn('[PUT /api/users] Попытка изменить isActive через форму редактирования. Игнорируем.')
    }

    // Обновляем email, если передан
    if (body.email !== undefined) {
      updateData.email = body.email
    }

    // Поле name больше не используется - игнорируем его, если передано
    if (body.name !== undefined) {
      console.warn('[PUT /api/users] Поле name больше не используется. Игнорируем.')
    }

    // Обновляем имя, если передано (null или пустая строка = null)
    if (body.firstName !== undefined) {
      updateData.firstName = body.firstName === '' || body.firstName === null ? null : body.firstName
    }

    // Обновляем фамилию, если передана (null или пустая строка = null)
    if (body.lastName !== undefined) {
      updateData.lastName = body.lastName === '' || body.lastName === null ? null : body.lastName
    }

    // Обновляем отчество, если передано (null или пустая строка = null)
    if (body.middleName !== undefined) {
      updateData.middleName = body.middleName === '' || body.middleName === null ? null : body.middleName
    }

    // Обновляем дату рождения, если передана (null или пустая строка = null)
    if (body.birthday !== undefined) {
      if (body.birthday === '' || body.birthday === null) {
        updateData.birthday = null
      } else {
        try {
          const birthdayDate = new Date(body.birthday)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          // Проверяем, что дата не в будущем
          if (birthdayDate > today) {
            return NextResponse.json(
              { error: 'Дата рождения не может быть в будущем' },
              { status: 400 }
            )
          }
          
          // Проверяем, что возраст не меньше 10 лет
          const minDate = new Date(today)
          minDate.setFullYear(today.getFullYear() - 10)
          
          if (birthdayDate > minDate) {
            return NextResponse.json(
              { error: 'Возраст не может быть меньше 10 лет' },
              { status: 400 }
            )
          }
          
          // Проверяем, что возраст не больше 150 лет
          const maxDate = new Date(today)
          maxDate.setFullYear(today.getFullYear() - 150)
          
          if (birthdayDate < maxDate) {
            return NextResponse.json(
              { error: 'Возраст не может быть больше 150 лет' },
              { status: 400 }
            )
          }
          
          updateData.birthday = birthdayDate
        } catch (error) {
          console.error('Ошибка при парсинге даты рождения:', error)
          return NextResponse.json(
            { error: 'Некорректная дата рождения' },
            { status: 400 }
          )
        }
      }
    }

    // Обновляем СНИЛС, если передан (пустая строка = null)
    if (body.snils !== undefined) {
      updateData.snils = body.snils === '' ? null : body.snils
    }

    // Обновляем пол, если передан (пустая строка = null)
    if (body.sex !== undefined) {
      updateData.sex = body.sex === '' ? null : body.sex
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
        // name больше не используется
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        birthday: true,
        snils: true,
        sex: true,
        role: true,
        groupId: true,
        createdAt: true
        // Временно отключаем mentorGroupIds до применения миграции
        // mentorGroupIds: true,
      }
    })

    // Логируем обновление пользователя
    // Используем email из сессии, так как ID может быть устаревшим после сброса БД
    await logActivity({
      userId: session.user.email || session.user.id,
      action: 'UPDATE',
      entityType: 'User',
      entityId: user.id,
      request,
      details: {
        before: {
          id: existingUser.id,
          // name больше не используется
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          middleName: existingUser.middleName || null,
          birthday: existingUser.birthday ? existingUser.birthday.toISOString().split('T')[0] : null,
          snils: existingUser.snils || null,
          sex: existingUser.sex || null,
          email: existingUser.email,
          role: existingUser.role,
          groupId: existingUser.groupId
          // Не включаем isActive, так как он не должен изменяться через эту форму
        },
        after: {
          id: user.id,
          // name больше не используется
          firstName: user.firstName,
          lastName: user.lastName,
          middleName: user.middleName,
          birthday: user.birthday ? user.birthday.toISOString().split('T')[0] : null,
          snils: user.snils,
          sex: user.sex,
          email: user.email,
          role: user.role,
          groupId: user.groupId
          // Не включаем isActive, так как он не должен изменяться через эту форму
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
        userId: session.user.email || session.user.id,
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
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false }
    })

    // Логируем удаление пользователя
    // Используем email из сессии, так как ID может быть устаревшим после сброса БД
    try {
      await logActivity({
        userId: session.user.email || session.user.id,
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
          },
          after: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            isActive: updatedUser.isActive
          }
        },
        result: 'SUCCESS'
      })
    } catch (logError) {
      // Логируем ошибку логирования, но не прерываем операцию
      console.error('Ошибка при логировании деактивации пользователя:', logError)
    }

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
          userId: session.user.email || session.user.id,
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
