import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Принудительно делаем роут динамическим
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
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
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
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
          origin: request.headers.get('origin'),
          referer: request.headers.get('referer'),
          'user-agent': request.headers.get('user-agent')
        }
      }
    })

  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json({ 
      error: 'Debug error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
