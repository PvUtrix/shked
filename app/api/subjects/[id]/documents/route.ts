import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/subjects/[id]/documents - Получить список документов предмета
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const documents = await prisma.subjectDocument.findMany({
      where: {
        subjectId: params.id,
        isActive: true
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Ошибка при получении документов:', error)
    return NextResponse.json(
      { error: 'Не удалось получить документы' },
      { status: 500 }
    )
  }
}

// POST /api/subjects/[id]/documents - Загрузить документ предмета
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверка прав доступа (только admin, teacher)
    if (!['admin', 'teacher', 'assistant'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { type, fileName, fileUrl, fileSize } = body

    // Валидация
    if (!type || !fileName || !fileUrl) {
      return NextResponse.json(
        { error: 'Не все обязательные поля заполнены' },
        { status: 400 }
      )
    }

    // Проверка существования предмета
    const subject = await prisma.subject.findUnique({
      where: { id: params.id }
    })

    if (!subject) {
      return NextResponse.json(
        { error: 'Предмет не найден' },
        { status: 404 }
      )
    }

    // Создание документа
    const document = await prisma.subjectDocument.create({
      data: {
        subjectId: params.id,
        type,
        fileName,
        fileUrl,
        fileSize: fileSize || null,
        uploadedBy: session.user.id
      },
      include: {
        uploader: {
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

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Ошибка при создании документа:', error)
    return NextResponse.json(
      { error: 'Не удалось загрузить документ' },
      { status: 500 }
    )
  }
}


