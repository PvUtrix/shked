import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию (только для админов)
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только администраторы могут применять миграции.' },
        { status: 403 }
      )
    }

    console.log('🔄 Начинаем миграцию для таблицы homework_comments...')

    // Проверяем, существует ли таблица
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'homework_comments'
      );
    `

    console.log('📋 Проверка существования таблицы:', tableExists)

    // Создаем таблицу если её нет
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "homework_comments" (
        "id" TEXT NOT NULL,
        "submissionId" TEXT NOT NULL,
        "authorId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "startOffset" INTEGER NOT NULL,
        "endOffset" INTEGER NOT NULL,
        "selectedText" TEXT NOT NULL,
        "resolved" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "homework_comments_pkey" PRIMARY KEY ("id")
      );
    `

    console.log('✅ Таблица homework_comments создана')

    // Добавляем внешние ключи
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'homework_comments_submissionId_fkey'
        ) THEN
          ALTER TABLE "homework_comments" 
          ADD CONSTRAINT "homework_comments_submissionId_fkey" 
          FOREIGN KEY ("submissionId") REFERENCES "homework_submissions"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `

    console.log('✅ Внешний ключ для submissionId создан')

    await prisma.$executeRaw`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'homework_comments_authorId_fkey'
        ) THEN
          ALTER TABLE "homework_comments" 
          ADD CONSTRAINT "homework_comments_authorId_fkey" 
          FOREIGN KEY ("authorId") REFERENCES "users"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `

    console.log('✅ Внешний ключ для authorId создан')

    console.log('✅ Миграция завершена успешно!')

    return NextResponse.json({
      success: true,
      message: 'Таблица homework_comments успешно создана с внешними ключами'
    })

  } catch (error) {
    console.error('❌ Ошибка при миграции:', error)
    return NextResponse.json({
      success: false,
      error: 'Ошибка при миграции базы данных',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - проверка схемы таблицы homework_comments
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'homework_comments' 
      ORDER BY ordinal_position
    `

    return NextResponse.json({
      message: 'Схема таблицы homework_comments',
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

