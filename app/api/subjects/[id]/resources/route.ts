import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/subjects/[id]/resources - Получить внешние ресурсы предмета
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subjectId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const resources = await prisma.externalResource.findMany({
      where: {
        subjectId: subjectId,
        scheduleId: null, // Ресурсы предмета (не привязанные к конкретному занятию)
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

// POST /api/subjects/[id]/resources - Создать внешний ресурс
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subjectId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверка прав доступа
    if (!['admin', 'lector', 'assistant'].includes(session.user.role)) {
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

    // Проверка существования предмета
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    })

    if (!subject) {
      return NextResponse.json(
        { error: 'Предмет не найден' },
        { status: 404 }
      )
    }

    // Создание ресурса
    const resource = await prisma.externalResource.create({
      data: {
        subjectId: subjectId,
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


