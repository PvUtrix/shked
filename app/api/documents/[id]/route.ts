import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// DELETE /api/documents/[id] - Удалить документ по ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const document = await prisma.subjectDocument.findUnique({
      where: { id: params.id }
    })

    if (!document) {
      return NextResponse.json({ error: 'Документ не найден' }, { status: 404 })
    }

    // Мягкое удаление (деактивация)
    await prisma.subjectDocument.update({
      where: { id: params.id },
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

