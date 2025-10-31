
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Скрипт миграции роли lector -> teacher
 * Обновляет всех пользователей с ролью 'lector' на роль 'teacher'
 */
async function main() {
  try {
    console.log('🔄 Начинаем миграцию роли lector -> teacher...')
    
    // Подсчитываем количество пользователей с ролью lector
    const lectorCount = await prisma.user.count({
      where: { role: 'lector' }
    })
    
    if (lectorCount === 0) {
      console.log('✅ Пользователей с ролью lector не найдено. Миграция не требуется.')
      return
    }
    
    console.log(`📊 Найдено пользователей с ролью lector: ${lectorCount}`)
    
    // Обновляем роль lector на teacher
    const result = await prisma.user.updateMany({
      where: { role: 'lector' },
      data: { role: 'teacher' }
    })
    
    console.log(`✅ Миграция завершена! Обновлено пользователей: ${result.count}`)
    
    // Показываем всех преподавателей после миграции
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
      }
    })
    
    console.log('\n👨‍🏫 Список всех преподавателей (роль teacher):')
    teachers.forEach(teacher => {
      console.log(`  - ${teacher.name || `${teacher.firstName} ${teacher.lastName}`} (${teacher.email})`)
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

