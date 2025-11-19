import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH /api/users/[id]/restore - восстановление удалённого пользователя
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Проверяем существование пользователя
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Проверяем, что пользователь действительно неактивен
    if (existingUser.isActive) {
      return NextResponse.json(
        { error: 'Пользователь уже активен' },
        { status: 400 }
      )
    }

    // Восстанавливаем пользователя (активируем)
    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: true }
    })

    return NextResponse.json({ message: 'Пользователь восстановлен' })

  } catch (error) {
    console.error('Ошибка при восстановлении пользователя:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

