import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Принудительно делаем роут динамическим
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Проверяем, что это не production без явного разрешения
    const { force } = await request.json().catch(() => ({}))
    
    if (process.env.NODE_ENV === 'production' && !force) {
      return NextResponse.json({ 
        error: 'Для production требуется параметр force: true' 
      }, { status: 400 })
    }

    console.log('🔄 Начинаем миграцию базы данных...')

    // Проверяем текущую схему
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('canHelp', 'lookingFor')
    `

    console.log('📋 Текущие колонки:', result)

    // Добавляем недостающие колонки если их нет
    const addCanHelp = await prisma.$executeRaw`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "canHelp" TEXT
    `

    const addLookingFor = await prisma.$executeRaw`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "lookingFor" TEXT
    `

    console.log('✅ Миграция завершена успешно!')

    return NextResponse.json({
      message: 'Миграция базы данных завершена успешно!',
      addedColumns: {
        canHelp: 'Добавлена колонка canHelp',
        lookingFor: 'Добавлена колонка lookingFor'
      },
      result
    })

  } catch (error) {
    console.error('❌ Ошибка при миграции:', error)
    return NextResponse.json({ 
      error: 'Ошибка при миграции базы данных',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - проверка схемы базы данных
export async function GET() {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      ORDER BY ordinal_position
    `

    return NextResponse.json({
      message: 'Схема таблицы User',
      columns: result
    })

  } catch (error) {
    console.error('❌ Ошибка при проверке схемы:', error)
    return NextResponse.json({ 
      error: 'Ошибка при проверке схемы базы данных',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
