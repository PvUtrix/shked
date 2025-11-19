import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logActivity } from '@/lib/activity-log'

// Принудительно делаем роут динамическим
export const dynamic = 'force-dynamic'

// GET - получение данных профиля
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        birthday: true,
        snils: true,
        sex: true,
        email: true,
        // canHelp: true,
        // lookingFor: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Ошибка при получении профиля:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// PUT - обновление данных профиля
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, middleName, birthday, snils, sex, canHelp, lookingFor } = body

    // Валидация данных
    if (firstName && firstName.length > 50) {
      return NextResponse.json({ error: 'Имя слишком длинное' }, { status: 400 })
    }
    
    if (lastName && lastName.length > 50) {
      return NextResponse.json({ error: 'Фамилия слишком длинная' }, { status: 400 })
    }

    if (middleName && middleName.length > 50) {
      return NextResponse.json({ error: 'Отчество слишком длинное' }, { status: 400 })
    }

    if (snils && snils.length > 11) {
      return NextResponse.json({ error: 'СНИЛС должен содержать не более 11 цифр' }, { status: 400 })
    }

    if (snils && !/^\d+$/.test(snils)) {
      return NextResponse.json({ error: 'СНИЛС должен содержать только цифры' }, { status: 400 })
    }

    // Валидация даты рождения
    if (birthday && birthday.trim() !== '') {
      const birthdayDate = new Date(birthday)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Проверяем, что дата не в будущем
      if (birthdayDate > today) {
        return NextResponse.json({ error: 'Дата рождения не может быть в будущем' }, { status: 400 })
      }
      
      // Проверяем, что возраст не меньше 10 лет
      const minDate = new Date(today)
      minDate.setFullYear(today.getFullYear() - 10)
      
      if (birthdayDate > minDate) {
        return NextResponse.json({ error: 'Возраст не может быть меньше 10 лет' }, { status: 400 })
      }
      
      // Проверяем, что возраст не больше 150 лет
      const maxDate = new Date(today)
      maxDate.setFullYear(today.getFullYear() - 150)
      
      if (birthdayDate < maxDate) {
        return NextResponse.json({ error: 'Возраст не может быть больше 150 лет' }, { status: 400 })
      }
    }
    
    if (canHelp && canHelp.length > 1000) {
      return NextResponse.json({ error: 'Поле "Чем могу быть полезен" слишком длинное' }, { status: 400 })
    }
    
    if (lookingFor && lookingFor.length > 1000) {
      return NextResponse.json({ error: 'Поле "Что ищу" слишком длинное' }, { status: 400 })
    }

    // Получаем текущее состояние профиля для логирования
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        birthday: true,
        snils: true,
        sex: true
      }
    })

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        firstName: firstName || null,
        lastName: lastName || null,
        middleName: middleName || null,
        birthday: birthday ? new Date(birthday) : null,
        snils: snils || null,
        sex: sex || null,
        // canHelp: canHelp || null,
        // lookingFor: lookingFor || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        birthday: true,
        snils: true,
        sex: true,
        email: true,
        // canHelp: true,
        // lookingFor: true,
        role: true,
        updatedAt: true
      }
    })

    // Логируем обновление профиля
    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'User',
      entityId: user.id,
      request,
      details: {
        before: existingUser ? {
          id: existingUser.id,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          middleName: existingUser.middleName,
          birthday: existingUser.birthday?.toISOString(),
          snils: existingUser.snils,
          sex: existingUser.sex
        } : undefined,
        after: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          middleName: user.middleName,
          birthday: user.birthday?.toISOString(),
          snils: user.snils,
          sex: user.sex
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json({ 
      message: 'Профиль успешно обновлен',
      user 
    })
  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}