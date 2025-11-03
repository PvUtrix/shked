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

    // Создаем тестовых пользователей для всех 8 ролей
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

    const studentPassword = await bcryptjs.hash('student123', 12)
    const student = await prisma.user.upsert({
      where: { email: 'student@demo.com' },
      update: {},
      create: {
        email: 'student@demo.com',
        password: studentPassword,
        firstName: 'Демо',
        lastName: 'Студент',
        name: 'Демо Студент',
        role: 'student',
      },
    })

    const lectorPassword = await bcryptjs.hash('lector123', 12)
    const lector = await prisma.user.upsert({
      where: { email: 'lector@demo.com' },
      update: {},
      create: {
        email: 'lector@demo.com',
        password: lectorPassword,
        firstName: 'Демо',
        lastName: 'Преподаватель',
        name: 'Демо Преподаватель',
        role: 'lector',
      },
    })

    const mentorPassword = await bcryptjs.hash('mentor123', 12)
    const mentor = await prisma.user.upsert({
      where: { email: 'mentor@demo.com' },
      update: {},
      create: {
        email: 'mentor@demo.com',
        password: mentorPassword,
        firstName: 'Демо',
        lastName: 'Ментор',
        name: 'Демо Ментор',
        role: 'mentor',
      },
    })

    const assistantPassword = await bcryptjs.hash('assistant123', 12)
    const assistant = await prisma.user.upsert({
      where: { email: 'assistant@demo.com' },
      update: {},
      create: {
        email: 'assistant@demo.com',
        password: assistantPassword,
        firstName: 'Демо',
        lastName: 'Ассистент',
        name: 'Демо Ассистент',
        role: 'assistant',
      },
    })

    const coLectorPassword = await bcryptjs.hash('co_lecturer123', 12)
    const coLector = await prisma.user.upsert({
      where: { email: 'co_lecturer@demo.com' },
      update: {},
      create: {
        email: 'co_lecturer@demo.com',
        password: coLectorPassword,
        firstName: 'Демо',
        lastName: 'Со-преподаватель',
        name: 'Демо Со-преподаватель',
        role: 'co_lecturer',
      },
    })

    const eduOfficePassword = await bcryptjs.hash('eduoffice123', 12)
    const eduOffice = await prisma.user.upsert({
      where: { email: 'eduoffice@demo.com' },
      update: {},
      create: {
        email: 'eduoffice@demo.com',
        password: eduOfficePassword,
        firstName: 'Демо',
        lastName: 'Учебный отдел',
        name: 'Демо Учебный отдел',
        role: 'education_office_head',
      },
    })

    const deptAdminPassword = await bcryptjs.hash('deptadmin123', 12)
    const deptAdmin = await prisma.user.upsert({
      where: { email: 'deptadmin@demo.com' },
      update: {},
      create: {
        email: 'deptadmin@demo.com',
        password: deptAdminPassword,
        firstName: 'Демо',
        lastName: 'Админ кафедры',
        name: 'Демо Администратор кафедры',
        role: 'department_admin',
      },
    })

    console.log('✅ Тестовые пользователи созданы успешно!')

    return NextResponse.json({
      message: 'Тестовые пользователи созданы успешно! (8 ролей)',
      users: [
        { email: 'admin@shked.com', password: 'admin123', role: 'admin' },
        { email: 'student@demo.com', password: 'student123', role: 'student' },
        { email: 'lector@demo.com', password: 'lector123', role: 'lector' },
        { email: 'mentor@demo.com', password: 'mentor123', role: 'mentor' },
        { email: 'assistant@demo.com', password: 'assistant123', role: 'assistant' },
        { email: 'colecturer@demo.com', password: 'colecturer123', role: 'co_lecturer' },
        { email: 'eduoffice@demo.com', password: 'eduoffice123', role: 'education_office_head' },
        { email: 'deptadmin@demo.com', password: 'deptadmin123', role: 'department_admin' },
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
