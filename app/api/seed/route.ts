import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

// Принудительно делаем роут динамическим
export const dynamic = 'force-dynamic'

// POST - создание тестовых пользователей
export async function POST(request: NextRequest) {
  try {
    // Проверяем, что это не production без явного разрешения
    const { force } = await request.json().catch(() => ({}))
    
    if (process.env.NODE_ENV === 'production' && !force) {
      return NextResponse.json({ 
        error: 'Для production требуется параметр force: true' 
      }, { status: 400 })
    }

    console.log('🌱 Начинаем создание тестовых пользователей...')

    // Создаем тестовых пользователей
    const adminPassword = await bcryptjs.hash('admin123', 12)
    const admin = await prisma.user.upsert({
      where: { email: 'admin@shked.com' },
      update: {},
      create: {
        email: 'admin@shked.com',
        password: adminPassword,
        firstName: 'Администратор',
        lastName: 'Системы',
        name: 'Администратор Системы',
        role: 'admin',
      },
    })

    const testPassword = await bcryptjs.hash('johndoe123', 12)
    const testUser = await prisma.user.upsert({
      where: { email: 'john@doe.com' },
      update: {},
      create: {
        email: 'john@doe.com',
        password: testPassword,
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        role: 'admin',
      },
    })

    const studentPassword = await bcryptjs.hash('student123', 12)
    const student = await prisma.user.upsert({
      where: { email: 'student123@demo.com' },
      update: {},
      create: {
        email: 'student123@demo.com',
        password: studentPassword,
        firstName: 'Демо',
        lastName: 'Студент',
        name: 'Демо Студент',
        role: 'student',
      },
    })

    console.log('✅ Тестовые пользователи созданы успешно!')

    return NextResponse.json({
      message: 'Тестовые пользователи созданы успешно!',
      users: [
        { email: 'admin@shked.com', password: 'admin123', role: 'admin' },
        { email: 'john@doe.com', password: 'johndoe123', role: 'admin' },
        { email: 'student123@demo.com', password: 'student123', role: 'student' }
      ]
    })

  } catch (error) {
    console.error('❌ Ошибка при создании пользователей:', error)
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - проверка существующих пользователей
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      message: 'Пользователи в базе данных',
      count: users.length,
      users
    })

  } catch (error) {
    console.error('❌ Ошибка при получении пользователей:', error)
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера' 
    }, { status: 500 })
  }
}
