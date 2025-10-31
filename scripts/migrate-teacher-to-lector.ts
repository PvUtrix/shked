
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Скрипт миграции: откат роли teacher -> lector
 * Обновляет всех пользователей с ролью 'teacher' на роль 'lector'
 * Обновляет пользователя teacher@demo.com на lector@demo.com
 */
async function main() {
  try {
    console.log('🔄 Начинаем откат роли teacher -> lector...')
    
    // 1. Обновляем роль teacher на lector
    const teacherCount = await prisma.user.count({
      where: { role: 'teacher' }
    })
    
    if (teacherCount > 0) {
      console.log(`📊 Найдено пользователей с ролью teacher: ${teacherCount}`)
      
      const result = await prisma.user.updateMany({
        where: { role: 'teacher' },
        data: { role: 'lector' }
      })
      
      console.log(`✅ Обновлено пользователей: ${result.count}`)
    } else {
      console.log('✅ Пользователей с ролью teacher не найдено')
    }
    
    // 2. Переименовываем teacher@demo.com в lector@demo.com
    const teacherDemoUser = await prisma.user.findUnique({
      where: { email: 'teacher@demo.com' }
    })
    
    if (teacherDemoUser) {
      console.log('\n📝 Найден пользователь teacher@demo.com, переименовываем...')
      
      // Проверяем, существует ли уже lector@demo.com
      const lectorDemoUser = await prisma.user.findUnique({
        where: { email: 'lector@demo.com' }
      })
      
      if (lectorDemoUser) {
        console.log('⚠️  Пользователь lector@demo.com уже существует. Удаляем teacher@demo.com...')
        await prisma.user.delete({
          where: { email: 'teacher@demo.com' }
        })
        console.log('✅ Пользователь teacher@demo.com удален')
      } else {
        await prisma.user.update({
          where: { email: 'teacher@demo.com' },
          data: { 
            email: 'lector@demo.com',
            role: 'lector'
          }
        })
        console.log('✅ Пользователь переименован: teacher@demo.com -> lector@demo.com')
      }
    }
    
    // 3. Показываем всех преподавателей после миграции
    const lectors = await prisma.user.findMany({
      where: { role: 'lector' },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
      }
    })
    
    console.log('\n👨‍🏫 Список всех преподавателей (роль lector):')
    lectors.forEach(lector => {
      console.log(`  - ${lector.name || `${lector.firstName} ${lector.lastName}`} (${lector.email})`)
    })
    
  } catch (error) {
    console.error('❌ Ошибка при миграции:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

