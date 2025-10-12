import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcryptjs from 'bcryptjs'

// Принудительно делаем роут динамическим
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email и пароль обязательны' 
      }, { status: 400 })
    }

    // Ищем пользователя в базе данных
    const user = await prisma.user.findUnique({
      where: { email },
      include: { group: true }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'Пользователь не найден',
        found: false
      }, { status: 404 })
    }

    // Проверяем пароль
    const isPasswordValid = await bcryptjs.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ 
        error: 'Неверный пароль',
        found: true,
        passwordValid: false
      }, { status: 401 })
    }

    return NextResponse.json({
      message: 'Логин успешен',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        groupId: user.groupId
      },
      found: true,
      passwordValid: true
    })

  } catch (error) {
    console.error('❌ Test login error:', error)
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
