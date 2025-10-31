// Скрипт миграции ролей: lector → teacher
// Дата создания: 2025-10-30
// Топик: Миграция КТП требований

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Начало миграции ролей: lector → teacher...')
  
  try {
    // Обновить роль lector на teacher для всех пользователей
    const result = await prisma.user.updateMany({
      where: {
        role: 'lector'
      },
      data: {
        role: 'teacher'
      }
    })
    
    console.log(`✅ Обновлено пользователей: ${result.count}`)
    
    // Вывести статистику по ролям
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    })
    
    console.log('\n📊 Статистика по ролям после миграции:')
    roleStats.forEach(stat => {
      console.log(`  - ${stat.role}: ${stat._count} пользователей`)
    })
    
    console.log('\n✨ Миграция ролей завершена успешно!')
  } catch (error) {
    console.error('❌ Ошибка при миграции ролей:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })


