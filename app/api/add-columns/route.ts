import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// Принудительно делаем роут динамическим
export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest) {
  try {
    // Проверка авторизации - только админы
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    console.error('🔄 Добавляем недостающие колонки...')

    // Прямое добавление колонок
    try {
      await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS "canHelp" TEXT`
      console.error('✅ Добавлена колонка canHelp')
    } catch (error) {
      console.error('ℹ️ Колонка canHelp уже существует или ошибка:', error instanceof Error ? error.message : 'Unknown error')
    }

    try {
      await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS "lookingFor" TEXT`
      console.error('✅ Добавлена колонка lookingFor')
    } catch (error) {
      console.error('ℹ️ Колонка lookingFor уже существует или ошибка:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Проверяем результат
    const columns = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('canHelp', 'lookingFor')
    `

    console.error('📋 Результат:', columns)

    return NextResponse.json({
      message: 'Колонки добавлены успешно!',
      addedColumns: columns,
      success: true
    })

  } catch (error) {
    console.error('❌ Ошибка:', error)
    return NextResponse.json({ 
      error: 'Ошибка при добавлении колонок',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
