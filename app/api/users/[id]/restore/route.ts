import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logActivity } from '@/lib/activity-log'

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
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: true }
    })

    // Логируем восстановление пользователя
    // Используем email из сессии, так как ID может быть устаревшим после сброса БД
    try {
      await logActivity({
        userId: session.user.email || session.user.id,
        action: 'UPDATE',
        entityType: 'User',
        entityId: params.id,
        request,
        details: {
          before: {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            isActive: existingUser.isActive
          },
          after: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            isActive: updatedUser.isActive
          }
        },
        result: 'SUCCESS'
      })
    } catch (logError) {
      // Логируем ошибку логирования, но не прерываем операцию
      console.error('Ошибка при логировании восстановления пользователя:', logError)
    }

    return NextResponse.json({ message: 'Пользователь восстановлен' })

  } catch (error) {
    console.error('Ошибка при восстановлении пользователя:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

