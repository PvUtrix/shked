import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { broadcastToAll, broadcastToGroup, sendTestMessage } from '@/lib/max/notifications'
import { sendMessage } from '@/lib/max/bot'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { type, message, targetGroup, targetRole, testUserId } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Сообщение не указано' },
        { status: 400 }
      )
    }

    let result: any = {}

    switch (type) {
      case 'test': {
        if (!testUserId) {
          return NextResponse.json(
            { error: 'ID пользователя для теста не указан' },
            { status: 400 }
          )
        }

        const testSuccess = await sendTestMessage(testUserId)
        result = {
          success: testSuccess,
          message: testSuccess ? 'Тестовое сообщение отправлено' : 'Ошибка отправки'
        }
        break
      }

      case 'broadcast_all': {
        const allResult = await broadcastToAll(message, targetRole)
        result = {
          success: allResult.sent > 0,
          sent: allResult.sent,
          total: allResult.total,
          message: `Отправлено ${allResult.sent} из ${allResult.total} пользователей`
        }
        break
      }

      case 'broadcast_group': {
        if (!targetGroup) {
          return NextResponse.json(
            { error: 'Группа не указана' },
            { status: 400 }
          )
        }

        const groupResult = await broadcastToGroup(targetGroup, message)
        result = {
          success: groupResult.sent > 0,
          sent: groupResult.sent,
          total: groupResult.total,
          message: `Отправлено ${groupResult.sent} из ${groupResult.total} пользователей группы`
        }
        break
      }

      case 'custom':
        // Отправка кастомного сообщения (пока не реализовано)
        result = {
          success: false,
          message: 'Кастомная отправка пока не реализована'
        }
        break

      default:
        return NextResponse.json(
          { error: 'Неверный тип отправки' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
