import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcryptjs from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Все поля обязательны' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Новый пароль должен содержать минимум 6 символов' },
        { status: 400 }
      )
    }

    // Получаем пользователя с паролем
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Проверяем текущий пароль
    const isPasswordValid = await bcryptjs.compare(
      currentPassword,
      user.password
    )

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Неверный текущий пароль' },
        { status: 400 }
      )
    }

    // Проверяем, что новый пароль отличается от текущего
    const isSamePassword = await bcryptjs.compare(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'Новый пароль должен отличаться от текущего' },
        { status: 400 }
      )
    }

    // Хешируем новый пароль
    const hashedPassword = await bcryptjs.hash(newPassword, 12)

    // Обновляем пароль и сбрасываем флаг mustChangePassword
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false
      }
    })

    return NextResponse.json({ 
      message: 'Пароль успешно изменен' 
    })

  } catch (error) {
    console.error('Ошибка при смене пароля:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

