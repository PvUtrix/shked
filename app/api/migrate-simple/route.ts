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

    console.log('🔄 Начинаем простую миграцию базы данных...')

    // Проверяем существующие колонки
    const existingColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('canHelp', 'lookingFor')
    `

    console.log('📋 Существующие колонки:', existingColumns)

    const results = []

    // Добавляем canHelp если его нет
    if (!Array.isArray(existingColumns) || existingColumns.length === 0 || 
        !existingColumns.some((col: any) => col.column_name === 'canHelp')) {
      try {
        await prisma.$executeRaw`ALTER TABLE users ADD COLUMN "canHelp" TEXT`
        results.push('✅ Добавлена колонка canHelp')
        console.log('✅ Добавлена колонка canHelp')
      } catch (error) {
        results.push(`❌ Ошибка добавления canHelp: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.log('❌ Ошибка добавления canHelp:', error)
      }
    } else {
      results.push('ℹ️ Колонка canHelp уже существует')
    }

    // Добавляем lookingFor если его нет
    if (!Array.isArray(existingColumns) || existingColumns.length === 0 || 
        !existingColumns.some((col: any) => col.column_name === 'lookingFor')) {
      try {
        await prisma.$executeRaw`ALTER TABLE users ADD COLUMN "lookingFor" TEXT`
        results.push('✅ Добавлена колонка lookingFor')
        console.log('✅ Добавлена колонка lookingFor')
      } catch (error) {
        results.push(`❌ Ошибка добавления lookingFor: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.log('❌ Ошибка добавления lookingFor:', error)
      }
    } else {
      results.push('ℹ️ Колонка lookingFor уже существует')
    }

    console.log('✅ Миграция завершена!')

    return NextResponse.json({
      message: 'Простая миграция базы данных завершена!',
      results,
      existingColumns
    })

  } catch (error) {
    console.error('❌ Ошибка при миграции:', error)
    return NextResponse.json({ 
      error: 'Ошибка при миграции базы данных',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
