import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/subjects/[id]/documents/[docId] - Получить документ
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const document = await prisma.subjectDocument.findFirst({
      where: {
        id: params.docId,
        subjectId: params.id
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

    if (!document) {
      return NextResponse.json({ error: 'Документ не найден' }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Ошибка при получении документа:', error)
    return NextResponse.json(
      { error: 'Не удалось получить документ' },
      { status: 500 }
    )
  }
}

// DELETE /api/subjects/[id]/documents/[docId] - Удалить документ
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверка прав доступа (только admin, teacher)
    if (!['admin', 'teacher'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const document = await prisma.subjectDocument.findFirst({
      where: {
        id: params.docId,
        subjectId: params.id
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Документ не найден' }, { status: 404 })
    }

    // Мягкое удаление (деактивация)
    await prisma.subjectDocument.update({
      where: { id: params.docId },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Документ удален' })
  } catch (error) {
    console.error('Ошибка при удалении документа:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить документ' },
      { status: 500 }
    )
  }
}


