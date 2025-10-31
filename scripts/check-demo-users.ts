
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Скрипт для проверки ролей демо-пользователей
 */
async function main() {
  try {
    console.log('🔍 Проверка ролей демо-пользователей...\n')
    
    const demoUsers = [
      'admin@shked.com',
      'student@demo.com',
      'teacher@demo.com',
      'mentor@demo.com',
      'assistant@demo.com',
      'coteacher@demo.com',
      'eduoffice@demo.com',
      'deptadmin@demo.com',
      'lector@demo.com' // старый аккаунт
    ]
    
    for (const email of demoUsers) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        }
      })
      
      if (user) {
        console.log(`✅ ${user.email}`)
        console.log(`   Имя: ${user.name}`)
        console.log(`   Роль: ${user.role}`)
        console.log('')
      } else {
        console.log(`❌ ${email} - пользователь не найден\n`)
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке:', error)
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

