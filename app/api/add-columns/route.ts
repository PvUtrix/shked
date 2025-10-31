import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Принудительно делаем роут динамическим
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Добавляем недостающие колонки...')

    // Прямое добавление колонок
    try {
      await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS "canHelp" TEXT`
      console.log('✅ Добавлена колонка canHelp')
    } catch (error) {
      console.log('ℹ️ Колонка canHelp уже существует или ошибка:', error instanceof Error ? error.message : 'Unknown error')
    }

    try {
      await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS "lookingFor" TEXT`
      console.log('✅ Добавлена колонка lookingFor')
    } catch (error) {
      console.log('ℹ️ Колонка lookingFor уже существует или ошибка:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Проверяем результат
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('canHelp', 'lookingFor')
    `

    console.log('📋 Результат:', columns)

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
