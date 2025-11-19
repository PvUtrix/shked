import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Принудительно делаем роут динамическим
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.error('🔍 Начинаем диагностику базы данных...')

    // 1. Проверяем подключение к базе данных
    const connectionTest = await prisma.$queryRaw`SELECT 1 as test`
    console.error('✅ Подключение к базе данных работает')

    // 2. Проверяем все таблицы в базе данных
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    console.error('📋 Найденные таблицы:', tables)

    // 3. Проверяем таблицу User (разные варианты названий)
    const userTableVariants = ['User', 'user', 'users', 'Users']
    const userTableInfo: Record<string, any> = {}

    for (const tableName of userTableVariants) {
      try {
        const columns = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = ${tableName}
          ORDER BY ordinal_position
        `
        if (columns && Array.isArray(columns) && columns.length > 0) {
          userTableInfo[tableName] = columns
          console.error(`✅ Найдена таблица ${tableName}:`, columns.length, 'колонок')
        }
      } catch (error) {
        console.error(`❌ Таблица ${tableName} не найдена или ошибка:`, error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // 4. Проверяем существование пользователей
    let userCount = 0
    let users: any[] = []
    try {
      const userQuery = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        },
        take: 5
      })
      userCount = userQuery.length
      users = userQuery
      console.error(`✅ Найдено пользователей: ${userCount}`)
    } catch (error) {
      console.error('❌ Ошибка при запросе пользователей:', error instanceof Error ? error.message : 'Unknown error')
    }

    // 5. Проверяем схему Prisma
    const prismaSchema = await prisma.$queryRaw`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `

    return NextResponse.json({
      message: 'Диагностика базы данных',
      connection: {
        status: 'SUCCESS',
        test: connectionTest
      },
      tables: {
        found: tables,
        count: Array.isArray(tables) ? tables.length : 0
      },
      userTable: {
        variants: userTableInfo,
        found: Object.keys(userTableInfo).length > 0
      },
      users: {
        count: userCount,
        sample: users
      },
      fullSchema: prismaSchema
    })

  } catch (error) {
    console.error('❌ Ошибка диагностики базы данных:', error)
    return NextResponse.json({ 
      error: 'Ошибка диагностики базы данных',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
