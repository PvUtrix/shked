// Скрипт миграции подгрупп: из UserGroup в Subgroup/SubgroupStudent
// Дата создания: 2025-10-30
// Топик: Миграция КТП требований

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Маппинг старых полей подгрупп на новые сущности
const subgroupMappings = [
  { field: 'subgroupCommerce', subjectName: 'Коммерция' },
  { field: 'subgroupTutorial', subjectName: 'Тьюториал' },
  { field: 'subgroupFinance', subjectName: 'Финансы' },
  { field: 'subgroupSystemThinking', subjectName: 'Системное мышление' }
]

async function main() {
  console.log('🔄 Начало миграции подгрупп...')
  
  try {
    // Получить все группы
    const groups = await prisma.group.findMany({
      include: {
        userGroups: {
          include: {
            user: true
          }
        }
      }
    })
    
    console.log(`📦 Найдено групп: ${groups.length}`)
    
    let totalSubgroups = 0
    let totalStudents = 0
    
    for (const group of groups) {
      console.log(`\n🏫 Обработка группы: ${group.name}`)
      
      // Для каждого маппинга предмета
      for (const mapping of subgroupMappings) {
        // Найти предмет
        const subject = await prisma.subject.findFirst({
          where: { name: { contains: mapping.subjectName } }
        })
        
        if (!subject) {
          console.log(`  ⚠️  Предмет не найден: ${mapping.subjectName}`)
          continue
        }
        
        // Получить уникальные номера подгрупп для этого предмета
        const subgroupNumbers = new Set<number>()
        for (const userGroup of group.userGroups) {
          const subgroupNum = (userGroup as any)[mapping.field]
          if (subgroupNum) {
            subgroupNumbers.add(subgroupNum)
          }
        }
        
        // Создать подгруппы
        for (const num of Array.from(subgroupNumbers)) {
          // Проверить, существует ли уже подгруппа
          const existingSubgroup = await prisma.subgroup.findUnique({
            where: {
              groupId_subjectId_number: {
                groupId: group.id,
                subjectId: subject.id,
                number: num
              }
            }
          })
          
          if (existingSubgroup) {
            console.log(`  ℹ️  Подгруппа уже существует: ${mapping.subjectName} - ${num}`)
            continue
          }
          
          // Создать подгруппу
          const subgroup = await prisma.subgroup.create({
            data: {
              groupId: group.id,
              subjectId: subject.id,
              name: `Подгруппа ${num} (${mapping.subjectName})`,
              number: num
            }
          })
          
          totalSubgroups++
          console.log(`  ✅ Создана подгруппа: ${subgroup.name}`)
          
          // Добавить студентов в подгруппу
          for (const userGroup of group.userGroups) {
            const studentSubgroupNum = (userGroup as any)[mapping.field]
            if (studentSubgroupNum === num) {
              // Проверить, не добавлен ли уже студент
              const existingMembership = await prisma.subgroupStudent.findUnique({
                where: {
                  subgroupId_userId: {
                    subgroupId: subgroup.id,
                    userId: userGroup.userId
                  }
                }
              })
              
              if (!existingMembership) {
                await prisma.subgroupStudent.create({
                  data: {
                    subgroupId: subgroup.id,
                    userId: userGroup.userId
                  }
                })
                totalStudents++
              }
            }
          }
        }
      }
    }
    
    console.log('\n📊 Статистика миграции:')
    console.log(`  - Создано подгрупп: ${totalSubgroups}`)
    console.log(`  - Добавлено студентов в подгруппы: ${totalStudents}`)
    
    console.log('\n✨ Миграция подгрупп завершена успешно!')
    console.log('ℹ️  Старые поля в UserGroup можно удалить после проверки')
  } catch (error) {
    console.error('❌ Ошибка при миграции подгрупп:', error)
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


