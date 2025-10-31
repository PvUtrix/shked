import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

    console.log(`🔍 Testing authentication for: ${email}`)

    // 1. Проверяем существование пользователя
    const user = await prisma.user.findUnique({
      where: { email },
      include: { group: true }
    })

    if (!user) {
      console.log(`❌ User not found: ${email}`)
      return NextResponse.json({ 
        error: 'Пользователь не найден',
        step: 'user_lookup',
        success: false
      }, { status: 404 })
    }

    console.log(`✅ User found: ${user.email} (${user.role})`)

    // 2. Проверяем пароль
    const isPasswordValid = await bcryptjs.compare(password, user.password)

    if (!isPasswordValid) {
      console.log(`❌ Invalid password for: ${email}`)
      return NextResponse.json({ 
        error: 'Неверный пароль',
        step: 'password_check',
        success: false
      }, { status: 401 })
    }

    console.log(`✅ Password valid for: ${email}`)

    // 3. Проверяем NextAuth сессию
    const session = await getServerSession(authOptions)
    console.log(`🔍 Current session:`, session ? 'EXISTS' : 'NULL')

    // 4. Тестируем создание JWT токена (симуляция NextAuth)
    const jwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      groupId: user.groupId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }

    console.log(`✅ JWT payload created for: ${email}`)

    return NextResponse.json({
      message: 'Аутентификация успешна на всех уровнях',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        groupId: user.groupId
      },
      steps: {
        user_lookup: 'SUCCESS',
        password_check: 'SUCCESS',
        session_check: session ? 'EXISTS' : 'NONE',
        jwt_creation: 'SUCCESS'
      },
      success: true
    })

  } catch (error) {
    console.error('❌ Auth debug error:', error)
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Unknown error',
      step: 'error_handling',
      success: false
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      message: 'Auth debug info',
      session: session ? {
        user: session.user,
        expires: session.expires
      } : null,
      authOptions: {
        providers: authOptions.providers?.length || 0,
        session: authOptions.session?.strategy || 'unknown',
        callbacks: Object.keys(authOptions.callbacks || {})
      }
    })

  } catch (error) {
    console.error('❌ Auth debug GET error:', error)
    return NextResponse.json({ 
      error: 'Auth debug error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
