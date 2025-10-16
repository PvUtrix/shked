// Скрипт для назначения демо-студента в группу
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixDemoStudent() {
  try {
    console.log('🔧 Назначение демо-студента в группу...')

    // Находим группу
    const group = await prisma.group.findUnique({
      where: { name: 'ТехПред МФТИ 2025-27' }
    })

    if (!group) {
      console.error('❌ Группа "ТехПред МФТИ 2025-27" не найдена!')
      return
    }

    console.log(`✅ Группа найдена: ${group.name} (${group.id})`)

    // Обновляем демо-студента
    const updatedStudent = await prisma.user.update({
      where: { email: 'student123@demo.com' },
      data: {
        groupId: group.id
      }
    })

    console.log(`✅ Демо-студент обновлен: ${updatedStudent.email}`)
    console.log(`   Имя: ${updatedStudent.firstName} ${updatedStudent.lastName}`)
    console.log(`   Группа ID: ${updatedStudent.groupId}`)

    // Создаем или обновляем запись UserGroup для подгрупп
    const userGroup = await prisma.userGroup.upsert({
      where: {
        userId_groupId: {
          userId: updatedStudent.id,
          groupId: group.id
        }
      },
      update: {
        subgroupCommerce: 1,
        subgroupTutorial: 1,
        subgroupFinance: 1,
        subgroupSystemThinking: 1
      },
      create: {
        userId: updatedStudent.id,
        groupId: group.id,
        subgroupCommerce: 1,
        subgroupTutorial: 1,
        subgroupFinance: 1,
        subgroupSystemThinking: 1
      }
    })

    console.log(`✅ Подгруппы назначены:`)
    console.log(`   Коммерциализация: ${userGroup.subgroupCommerce}`)
    console.log(`   Тьюториал: ${userGroup.subgroupTutorial}`)
    console.log(`   Финансовое моделирование: ${userGroup.subgroupFinance}`)
    console.log(`   Системное мышление: ${userGroup.subgroupSystemThinking}`)

    console.log('\n🎉 Готово! Теперь демо-студент может видеть домашние задания.')

  } catch (error) {
    console.error('❌ Ошибка при обновлении:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixDemoStudent()

