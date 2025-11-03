import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/exams - Получить список экзаменов
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const subjectId = searchParams.get('subjectId')

    const where: any = { isActive: true }
    
    if (groupId) where.groupId = groupId
    if (subjectId) where.subjectId = subjectId

    const exams = await prisma.exam.findMany({
      where,
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            results: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(exams)
  } catch (error) {
    console.error('Ошибка при получении экзаменов:', error)
    return NextResponse.json(
      { error: 'Не удалось получить экзамены' },
      { status: 500 }
    )
  }
}

// POST /api/exams - Создать экзамен
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверка прав доступа
    if (!['admin', 'lector'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { subjectId, groupId, type, format, date, location, description } = body

    // Валидация
    if (!subjectId || !groupId || !type || !format || !date) {
      return NextResponse.json(
        { error: 'Не все обязательные поля заполнены' },
        { status: 400 }
      )
    }

    // Проверка существования предмета и группы
    const [subject, group] = await Promise.all([
      prisma.subject.findUnique({ where: { id: subjectId } }),
      prisma.group.findUnique({ where: { id: groupId } })
    ])

    if (!subject || !group) {
      return NextResponse.json(
        { error: 'Предмет или группа не найдены' },
        { status: 404 }
      )
    }

    // Создание экзамена
    const exam = await prisma.exam.create({
      data: {
        subjectId,
        groupId,
        type,
        format,
        date: new Date(date),
        location: location || null,
        description: description || null
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(exam, { status: 201 })
  } catch (error) {
    console.error('Ошибка при создании экзамена:', error)
    return NextResponse.json(
      { error: 'Не удалось создать экзамен' },
      { status: 500 }
    )
  }
}


