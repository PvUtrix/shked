import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Принудительно делаем роут динамическим
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации - только админы
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Получаем информацию о пользователе из базы данных
    let dbUser = null
    if (session?.user?.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true
        }
      })
    }

    return NextResponse.json({
      message: 'Debug информация',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL
        // Не раскрываем информацию о секретах и базе данных
      },
      session: session ? {
        user: session.user,
        expires: session.expires
      } : null,
      dbUser,
      request: {
        url: request.url,
        headers: {
          host: request.headers.get('host'),
          origin: request.headers.get('origin')
        }
      }
    })

  } catch (error) {
    console.error('❌ Debug error:', error)
    // Не раскрываем стек ошибки в ответе
    return NextResponse.json({
      error: 'Debug error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
