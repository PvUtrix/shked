import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// Принудительно делаем роут динамическим
export const dynamic = 'force-dynamic'

// POST - создание тестовых пользователей
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации - только админы
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Проверяем, что это не production без явного разрешения
    const { force } = await request.json().catch(() => ({}))

    if (process.env.NODE_ENV === 'production' && !force) {
      return NextResponse.json({
        error: 'Для production требуется параметр force: true'
      }, { status: 400 })
    }

    console.error('🌱 Начинаем создание тестовых пользователей...')

    // Создаем тестовых пользователей для всех 8 ролей
    const adminPassword = await bcryptjs.hash('admin123', 12)
    await prisma.user.upsert({
      where: { email: 'admin@shked.com' },
      update: {
        firstName: 'Иван',
        lastName: 'Администраторов',
        name: 'Иван Администраторов',
        sex: 'male',
      },
      create: {
        email: 'admin@shked.com',
        password: adminPassword,
        firstName: 'Иван',
        lastName: 'Администраторов',
        name: 'Иван Администраторов',
        sex: 'male',
        role: 'admin',
      },
    })

    const studentPassword = await bcryptjs.hash('student123', 12)
    await prisma.user.upsert({
      where: { email: 'student@demo.com' },
      update: {
        firstName: 'Мария',
        lastName: 'Студентова',
        name: 'Мария Студентова',
        sex: 'female',
      },
      create: {
        email: 'student@demo.com',
        password: studentPassword,
        firstName: 'Мария',
        lastName: 'Студентова',
        name: 'Мария Студентова',
        sex: 'female',
        role: 'student',
      },
    })

    const lectorPassword = await bcryptjs.hash('lector123', 12)
    await prisma.user.upsert({
      where: { email: 'lector@demo.com' },
      update: {
        firstName: 'Александр',
        lastName: 'Преподавателев',
        name: 'Александр Преподавателев',
        sex: 'male',
      },
      create: {
        email: 'lector@demo.com',
        password: lectorPassword,
        firstName: 'Александр',
        lastName: 'Преподавателев',
        name: 'Александр Преподавателев',
        sex: 'male',
        role: 'lector',
      },
    })

    const mentorPassword = await bcryptjs.hash('mentor123', 12)
    await prisma.user.upsert({
      where: { email: 'mentor@demo.com' },
      update: {
        firstName: 'Анна',
        lastName: 'Менторова',
        name: 'Анна Менторова',
        sex: 'female',
      },
      create: {
        email: 'mentor@demo.com',
        password: mentorPassword,
        firstName: 'Анна',
        lastName: 'Менторова',
        name: 'Анна Менторова',
        sex: 'female',
        role: 'mentor',
      },
    })

    const assistantPassword = await bcryptjs.hash('assistant123', 12)
    await prisma.user.upsert({
      where: { email: 'assistant@demo.com' },
      update: {
        firstName: 'Дмитрий',
        lastName: 'Ассистентов',
        name: 'Дмитрий Ассистентов',
        sex: 'male',
      },
      create: {
        email: 'assistant@demo.com',
        password: assistantPassword,
        firstName: 'Дмитрий',
        lastName: 'Ассистентов',
        name: 'Дмитрий Ассистентов',
        sex: 'male',
        role: 'assistant',
      },
    })

    const coLectorPassword = await bcryptjs.hash('co_lecturer123', 12)
    await prisma.user.upsert({
      where: { email: 'co-lecturer@demo.com' },
      update: {
        firstName: 'Елена',
        lastName: 'Со-преподавателева',
        name: 'Елена Со-преподавателева',
        sex: 'female',
      },
      create: {
        email: 'co-lecturer@demo.com',
        password: coLectorPassword,
        firstName: 'Елена',
        lastName: 'Со-преподавателева',
        name: 'Елена Со-преподавателева',
        sex: 'female',
        role: 'co_lecturer',
      },
    })

    const eduOfficePassword = await bcryptjs.hash('eduoffice123', 12)
    await prisma.user.upsert({
      where: { email: 'eduoffice@demo.com' },
      update: {
        firstName: 'Михаил',
        lastName: 'Учебногоотдела',
        name: 'Михаил Учебногоотдела',
        sex: 'male',
      },
      create: {
        email: 'eduoffice@demo.com',
        password: eduOfficePassword,
        firstName: 'Михаил',
        lastName: 'Учебногоотдела',
        name: 'Михаил Учебногоотдела',
        sex: 'male',
        role: 'education_office_head',
      },
    })

    const deptAdminPassword = await bcryptjs.hash('deptadmin123', 12)
    await prisma.user.upsert({
      where: { email: 'deptadmin@demo.com' },
      update: {
        firstName: 'Ольга',
        lastName: 'Кафедрова',
        name: 'Ольга Кафедрова',
        sex: 'female',
      },
      create: {
        email: 'deptadmin@demo.com',
        password: deptAdminPassword,
        firstName: 'Ольга',
        lastName: 'Кафедрова',
        name: 'Ольга Кафедрова',
        sex: 'female',
        role: 'department_admin',
      },
    })

    console.error('✅ Тестовые пользователи созданы успешно!')

    // Не возвращаем пароли в ответе по соображениям безопасности
    return NextResponse.json({
      message: 'Тестовые пользователи созданы успешно! (8 ролей)',
      users: [
        { email: 'admin@shked.com', role: 'admin' },
        { email: 'student@demo.com', role: 'student' },
        { email: 'lector@demo.com', role: 'lector' },
        { email: 'mentor@demo.com', role: 'mentor' },
        { email: 'assistant@demo.com', role: 'assistant' },
        { email: 'co-lecturer@demo.com', role: 'co_lecturer' },
        { email: 'eduoffice@demo.com', role: 'education_office_head' },
        { email: 'deptadmin@demo.com', role: 'department_admin' },
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
    // Проверка авторизации - только админы
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

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
