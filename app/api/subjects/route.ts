import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/subjects - получение списка предметов
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lector = searchParams.get('lector') === 'true'

    const where: any = {}

    // Для преподавателей показываем только их предметы
    if (session.user.role === 'lector' || lector) {
      where.lectorId = session.user.id
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        lector: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            schedules: true,
            homework: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ subjects })

  } catch (error) {
    console.error('Ошибка при получении предметов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/subjects - создание нового предмета
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['admin', 'lector'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    
    // Валидация обязательных полей
    if (!body.name) {
      return NextResponse.json(
        { error: 'Название предмета обязательно' },
        { status: 400 }
      )
    }

    const subject = await prisma.subject.create({
      data: {
        name: body.name,
        description: body.description,
        instructor: body.instructor,
        lectorId: session.user.role === 'lector' ? session.user.id : body.lectorId
      },
      include: {
        lector: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(subject, { status: 201 })

  } catch (error) {
    console.error('Ошибка при создании предмета:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/subjects - обновление предмета
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['admin', 'lector'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID предмета обязателен' },
        { status: 400 }
      )
    }

    // Для преподавателей проверяем, что предмет принадлежит им
    if (session.user.role === 'lector') {
      const existingSubject = await prisma.subject.findUnique({
        where: { id: body.id },
        select: { lectorId: true }
      })

      if (!existingSubject || existingSubject.lectorId !== session.user.id) {
        return NextResponse.json({ error: 'Нет доступа к этому предмету' }, { status: 403 })
      }
    }

    const subject = await prisma.subject.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        instructor: body.instructor,
        lectorId: session.user.role === 'admin' ? body.lectorId : undefined
      },
      include: {
        lector: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(subject)

  } catch (error) {
    console.error('Ошибка при обновлении предмета:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
