import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Указываем, что этот route должен быть динамическим
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Проверяем права администратора
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const isEnabled = process.env.ENABLE_DB_RESET === 'true'

    return NextResponse.json({
      enabled: isEnabled,
      message: isEnabled 
        ? 'Сброс базы данных разрешен' 
        : 'Сброс базы данных отключен в продакшене'
    })

  } catch (error) {
    console.error('Ошибка при проверке статуса сброса:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
