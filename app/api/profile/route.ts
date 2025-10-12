import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
    const { firstName, lastName, canHelp, lookingFor } = body

    // Валидация данных
    if (firstName && firstName.length > 50) {
      return NextResponse.json({ error: 'Имя слишком длинное' }, { status: 400 })
    }
    
    if (lastName && lastName.length > 50) {
      return NextResponse.json({ error: 'Фамилия слишком длинная' }, { status: 400 })
    }
    
    if (canHelp && canHelp.length > 1000) {
      return NextResponse.json({ error: 'Поле "Чем могу быть полезен" слишком длинное' }, { status: 400 })
    }
    
    if (lookingFor && lookingFor.length > 1000) {
      return NextResponse.json({ error: 'Поле "Что ищу" слишком длинное' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        firstName: firstName || null,
        lastName: lastName || null,
        // canHelp: canHelp || null,
        // lookingFor: lookingFor || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        // canHelp: true,
        // lookingFor: true,
        role: true,
        updatedAt: true
      }
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