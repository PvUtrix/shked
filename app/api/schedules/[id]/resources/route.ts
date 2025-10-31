import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/schedules/[id]/resources - Получить ресурсы занятия
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const resources = await prisma.externalResource.findMany({
      where: {
        scheduleId: params.id,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(resources)
  } catch (error) {
    console.error('Ошибка при получении ресурсов:', error)
    return NextResponse.json(
      { error: 'Не удалось получить ресурсы' },
      { status: 500 }
    )
  }
}

// POST /api/schedules/[id]/resources - Добавить ресурс к занятию
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверка прав доступа
    if (!['admin', 'teacher', 'assistant'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { type, title, url, description } = body

    // Валидация
    if (!type || !title || !url) {
      return NextResponse.json(
        { error: 'Не все обязательные поля заполнены' },
        { status: 400 }
      )
    }

    // Проверка существования занятия
    const schedule = await prisma.schedule.findUnique({
      where: { id: params.id }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Занятие не найдено' },
        { status: 404 }
      )
    }

    // Создание ресурса
    const resource = await prisma.externalResource.create({
      data: {
        scheduleId: params.id,
        subjectId: schedule.subjectId, // Связываем с предметом для удобства
        type,
        title,
        url,
        description: description || null
      }
    })

    return NextResponse.json(resource, { status: 201 })
  } catch (error) {
    console.error('Ошибка при создании ресурса:', error)
    return NextResponse.json(
      { error: 'Не удалось создать ресурс' },
      { status: 500 }
    )
  }
}


