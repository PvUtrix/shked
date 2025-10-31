// Скрипт для проверки доступа студента к домашнему заданию
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAccess() {
  try {
    const homeworkId = 'cmgr1wlbm001y9k3ygp5vwmcm'
    const studentEmail = 'student123@demo.com'

    // Находим студента
    const student = await prisma.user.findUnique({
      where: { email: studentEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        groupId: true,
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log('\n📌 Информация о студенте:')
    console.log(JSON.stringify(student, null, 2))

    if (!student) {
      console.error('❌ Студент не найден!')
      return
    }

    // Находим домашнее задание
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log('\n📝 Информация о домашнем задании:')
    console.log(JSON.stringify(homework, null, 2))

    if (!homework) {
      console.error('❌ Домашнее задание не найдено!')
      return
    }

    // Проверяем доступ
    console.log('\n🔍 Проверка доступа:')
    console.log(`Студент из группы: ${student.groupId || 'НЕТ ГРУППЫ'}`)
    console.log(`Задание для группы: ${homework.groupId || 'ВСЕ ГРУППЫ'}`)

    const hasAccess = 
      !homework.groupId || // Задание для всех групп
      homework.groupId === student.groupId // Задание для группы студента

    if (hasAccess) {
      console.log('✅ У студента ЕСТЬ доступ к заданию')
    } else {
      console.log('❌ У студента НЕТ доступа к заданию')
      console.log('\n💡 Причина: Задание назначено для другой группы')
      console.log(`   Группа студента: ${student.group?.name || 'Не назначена'}`)
      console.log(`   Группа задания: ${homework.group?.name || 'Все группы'}`)
    }

  } catch (error) {
    console.error('Ошибка при проверке:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAccess()

