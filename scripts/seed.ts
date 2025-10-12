
import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface ExcelAnalysis {
  sheets: string[]
  data: {
    [key: string]: {
      shape: number[]
      columns: string[]
      sample_data: any[]
    }
  }
}

async function main() {
  try {
    console.log('🌱 Начинаем заполнение базы данных...')
    
    // Читаем анализ Excel файла
    const analysisPath = path.join(__dirname, '..', 'data', 'excel_analysis.json')
    const excelAnalysis: ExcelAnalysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'))
    
    // 1. Создание тестовых пользователей
    console.log('👤 Создание пользователей...')
    
    // Админ пользователь
    const adminPassword = await bcryptjs.hash('admin123', 12)
    const admin = await prisma.user.upsert({
      where: { email: 'admin@shked.com' },
      update: {},
      create: {
        email: 'admin@shked.com',
        password: adminPassword,
        firstName: 'Администратор',
        lastName: 'Системы',
        name: 'Администратор Системы',
        role: 'admin',
      },
    })

    // Тестовый пользователь для системы
    const testPassword = await bcryptjs.hash('johndoe123', 12)
    const testUser = await prisma.user.upsert({
      where: { email: 'john@doe.com' },
      update: {},
      create: {
        email: 'john@doe.com',
        password: testPassword,
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        role: 'admin',
      },
    })

    // Демо студент для тестирования
    const demoStudentPassword = await bcryptjs.hash('student123', 12)
    const demoStudent = await prisma.user.upsert({
      where: { email: 'student123@demo.com' },
      update: {},
      create: {
        email: 'student123@demo.com',
        password: demoStudentPassword,
        firstName: 'Демо',
        lastName: 'Студент',
        name: 'Демо Студент',
        role: 'student',
      },
    })

    // 2. Создание группы
    console.log('👥 Создание групп...')
    const techPredGroup = await prisma.group.upsert({
      where: { name: 'ТехПред МФТИ 2025-27' },
      update: {},
      create: {
        name: 'ТехПред МФТИ 2025-27',
        description: 'Магистратура Технологическое предпринимательство МФТИ 2025-27',
        semester: '1 семестр',
        year: '2025-27',
      },
    })

    // 3. Создание предметов на основе Excel данных
    console.log('📚 Создание предметов...')
    const subjects = [
      {
        name: 'Проектирование венчурного предприятия (Тьюториал)',
        instructor: 'Чикин В.Н., Бахчиев А.В.',
        description: 'Тьюториал по проектированию венчурного предприятия'
      },
      {
        name: 'Научный семинар',
        instructor: 'Буренин А.В.',
        description: 'Научный семинар с распределением на микро-группы'
      },
      {
        name: 'Системное мышление',
        instructor: 'Бухарин М.А., Бодров В.К.',
        description: 'Развитие системного мышления'
      },
      {
        name: 'Коммерциализация R&D',
        instructor: 'Антонец В.А., Буренин А.Г.',
        description: 'Коммерциализация исследований и разработок'
      },
      {
        name: 'Основы финансового моделирования',
        instructor: 'Чернова М.А.',
        description: 'Основы финансового моделирования'
      },
      {
        name: 'Разработка продукта',
        instructor: 'Николаев А.В.',
        description: 'Методология разработки продукта'
      },
      {
        name: 'Общеинститутские мероприятия',
        instructor: 'МФТИ',
        description: 'Административные и общеинститутские мероприятия'
      }
    ]

    const createdSubjects = []
    for (const subject of subjects) {
      const createdSubject = await prisma.subject.upsert({
        where: { name: subject.name },
        update: {},
        create: subject,
      })
      createdSubjects.push(createdSubject)
    }

    // 4. Создание студентов на основе данных распределения
    console.log('🎓 Создание студентов...')
    const studentsData = excelAnalysis.data['1 семестр. Распределение на под'].sample_data
    
    const students = []
    for (const studentData of studentsData) {
      if (studentData?.Студент) {
        const names = studentData.Студент.split(' ')
        const firstName = names[1] || 'Студент'
        const lastName = names[0] || 'Неизвестный'
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.mipt.ru`.replace(/[^a-z0-9@.]/g, '')
        
        const studentPassword = await bcryptjs.hash('student123', 12)
        const student = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            password: studentPassword,
            firstName,
            lastName,
            name: studentData.Студент,
            role: 'student',
            groupId: techPredGroup.id,
          },
        })
        
        // Создание записи о распределении по подгруппам
        await prisma.userGroup.upsert({
          where: { 
            userId_groupId: {
              userId: student.id,
              groupId: techPredGroup.id
            }
          },
          update: {},
          create: {
            userId: student.id,
            groupId: techPredGroup.id,
            subgroupCommerce: studentData.Коммерциализация,
            subgroupTutorial: studentData.Тьюториал,
            subgroupFinance: studentData['Финансовое моделирование'],
            subgroupSystemThinking: studentData['Системное мышление'],
          },
        })
        
        students.push(student)
      }
    }

    // 5. Создание расписания на основе Excel данных
    console.log('📅 Создание расписания...')
    const scheduleData = excelAnalysis.data['1 семестр. Расписание'].sample_data
    
    for (let i = 7; i < scheduleData.length; i++) { // Начинаем с 7-й записи, где начинаются реальные данные
      const row = scheduleData[i]
      if (row?.['Проектирование венчурного предприятия (Тьюториал)/ Чикин В.Н., Бахчиев А.В.'] && 
          typeof row['Проектирование венчурного предприятия (Тьюториал)/ Чикин В.Н., Бахчиев А.В.'] === 'string' &&
          row['Проектирование венчурного предприятия (Тьюториал)/ Чикин В.Н., Бахчиев А.В.'].includes('2025')) {
        
        const dateStr = row['Проектирование венчурного предприятия (Тьюториал)/ Чикин В.Н., Бахчиев А.В.']
        const dayOfWeek = row['Unnamed: 1']
        const time = row['Unnamed: 2']
        const eventName = row['Подгруппа 1']
        const location = row['Unnamed: 19']
        
        if (dateStr && eventName && time) {
          try {
            const eventDate = new Date(dateStr)
            if (!isNaN(eventDate.getTime())) {
              // Определяем предмет по названию события
              let subject = createdSubjects.find(s => s.name.includes('Общеинститутские'))
              if (eventName.includes('семинар')) {
                subject = createdSubjects.find(s => s.name.includes('Научный семинар'))
              } else if (eventName.includes('Fest Tech')) {
                subject = createdSubjects.find(s => s.name.includes('Общеинститутские'))
              }
              
              if (subject) {
                const [startTime, endTime] = time.includes('-') ? time.split('-') : [time, time]
                
                await prisma.schedule.create({
                  data: {
                    subjectId: subject.id,
                    groupId: techPredGroup.id,
                    date: eventDate,
                    dayOfWeek: typeof dayOfWeek === 'number' ? dayOfWeek : eventDate.getDay(),
                    startTime: startTime?.trim() || '09:00',
                    endTime: endTime?.trim() || '18:00',
                    location: location || 'Не указано',
                    eventType: 'seminar',
                    description: eventName,
                  },
                })
              }
            }
          } catch (error) {
            console.log(`Пропущена запись: ${error}`)
          }
        }
      }
    }

    // 6. Добавление дополнительных тестовых расписаний
    console.log('📋 Добавление дополнительных занятий...')
    const additionalSchedules = [
      {
        subject: createdSubjects.find(s => s.name.includes('Системное мышление')),
        date: new Date('2025-09-15'),
        startTime: '10:00',
        endTime: '12:00',
        location: 'Аудитория 301',
        description: 'Лекция по системному мышлению'
      },
      {
        subject: createdSubjects.find(s => s.name.includes('Коммерциализация')),
        date: new Date('2025-09-16'),
        startTime: '14:00',
        endTime: '16:00',
        location: 'Аудитория 205',
        description: 'Практикум по коммерциализации'
      },
      {
        subject: createdSubjects.find(s => s.name.includes('финансового моделирования')),
        date: new Date('2025-09-17'),
        startTime: '11:00',
        endTime: '13:00',
        location: 'Компьютерный класс',
        description: 'Практикум по финансовому моделированию'
      }
    ]

    for (const schedule of additionalSchedules) {
      if (schedule.subject) {
        await prisma.schedule.create({
          data: {
            subjectId: schedule.subject.id,
            groupId: techPredGroup.id,
            date: schedule.date,
            dayOfWeek: schedule.date.getDay(),
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            location: schedule.location,
            eventType: 'lecture',
            description: schedule.description,
          },
        })
      }
    }

    // 7. Создание тестовых домашних заданий
    console.log('📝 Создание домашних заданий...')
    const homeworkData = [
      {
        title: 'Анализ рынка для стартапа',
        description: 'Проведите анализ рынка для вашего стартап-проекта. Включите анализ конкурентов, целевую аудиторию и рыночные тренды.',
        taskUrl: 'https://docs.google.com/document/d/example1',
        deadline: new Date('2025-10-20T23:59:00'),
        materials: [
          { name: 'Шаблон анализа рынка', url: 'https://example.com/template', type: 'document' },
          { name: 'Примеры успешных анализов', url: 'https://example.com/examples', type: 'link' }
        ],
        subject: createdSubjects.find(s => s.name.includes('Коммерциализация'))
      },
      {
        title: 'Финансовая модель проекта',
        description: 'Создайте финансовую модель для вашего проекта на 3 года вперед. Включите прогнозы доходов, расходов и ключевые метрики.',
        taskUrl: 'https://docs.google.com/spreadsheets/d/example2',
        deadline: new Date('2025-10-25T23:59:00'),
        materials: [
          { name: 'Шаблон финансовой модели', url: 'https://example.com/financial-template', type: 'document' },
          { name: 'Видео-инструкция', url: 'https://example.com/video', type: 'video' }
        ],
        subject: createdSubjects.find(s => s.name.includes('финансового моделирования'))
      },
      {
        title: 'Системная диаграмма проекта',
        description: 'Создайте системную диаграмму вашего проекта, показывающую основные компоненты и их взаимодействие.',
        taskUrl: 'https://miro.com/board/example3',
        deadline: new Date('2025-10-18T23:59:00'),
        materials: [
          { name: 'Инструменты для создания диаграмм', url: 'https://example.com/tools', type: 'link' }
        ],
        subject: createdSubjects.find(s => s.name.includes('Системное мышление'))
      }
    ]

    const createdHomework = []
    for (const hw of homeworkData) {
      if (hw.subject) {
        const homework = await prisma.homework.create({
          data: {
            title: hw.title,
            description: hw.description,
            taskUrl: hw.taskUrl,
            deadline: hw.deadline,
            materials: hw.materials,
            subjectId: hw.subject.id,
            groupId: techPredGroup.id
          }
        })
        createdHomework.push(homework)
      }
    }

    // 8. Создание тестовых сдач домашних заданий
    console.log('📤 Создание сдач домашних заданий...')
    const sampleStudents = students.slice(0, 5) // Берем первых 5 студентов для демонстрации
    
    for (const student of sampleStudents) {
      for (const homework of createdHomework) {
        // Создаем сдачу для каждого студента (некоторые сданы, некоторые нет)
        const shouldSubmit = Math.random() > 0.3 // 70% вероятность сдачи
        
        if (shouldSubmit) {
          const status = Math.random() > 0.5 ? 'SUBMITTED' : 'REVIEWED'
          const grade = status === 'REVIEWED' ? Math.floor(Math.random() * 2) + 4 : null // 4 или 5
          const comment = status === 'REVIEWED' ? 
            (grade === 5 ? 'Отличная работа! Очень детальный анализ.' : 'Хорошая работа, есть что улучшить.') : 
            null

          await prisma.homeworkSubmission.create({
            data: {
              homeworkId: homework.id,
              userId: student.id,
              submissionUrl: `https://example.com/submission/${student.id}/${homework.id}`,
              status: status,
              grade: grade,
              comment: comment,
              submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Случайная дата в последние 7 дней
              reviewedAt: status === 'REVIEWED' ? new Date() : null
            }
          })
        }
      }
    }

    console.log('✅ Заполнение базы данных завершено!')
    console.log(`📊 Создано:
    - Пользователей: ${students.length + 2}
    - Групп: 1
    - Предметов: ${createdSubjects.length}
    - Расписаний: добавлены из Excel файла + дополнительные
    - Домашних заданий: ${createdHomework.length}
    - Сдач: созданы для демонстрации`)
    
  } catch (error) {
    console.error('❌ Ошибка при заполнении базы данных:', error)
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
