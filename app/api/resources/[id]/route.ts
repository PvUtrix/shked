import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH /api/resources/[id] - Обновить ресурс
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверка прав доступа
    if (!['admin', 'teacher'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { type, title, url, description } = body

    const resource = await prisma.externalResource.update({
      where: { id: params.id },
      data: {
        ...(type && { type }),
        ...(title && { title }),
        ...(url && { url }),
        ...(description !== undefined && { description })
      }
    })

    return NextResponse.json(resource)
  } catch (error) {
    console.error('Ошибка при обновлении ресурса:', error)
    return NextResponse.json(
      { error: 'Не удалось обновить ресурс' },
      { status: 500 }
    )
  }
}

// DELETE /api/resources/[id] - Удалить ресурс
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверка прав доступа
    if (!['admin', 'teacher'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Мягкое удаление
    await prisma.externalResource.update({
      where: { id: params.id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Ресурс удален' })
  } catch (error) {
    console.error('Ошибка при удалении ресурса:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить ресурс' },
      { status: 500 }
    )
  }
}


