
import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.error('🌱 Начинаем заполнение базы данных...')

    // 1. Создание группы (создаем раньше, чтобы можно было назначить студента)
    console.error('👥 Создание групп...')
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

    // 2. Создание демо аккаунтов (8 ролей)
    console.error('👤 Создание демо аккаунтов...')
    
    // Админ
    const adminPassword = await bcryptjs.hash('admin123', 12)
    await prisma.user.upsert({
      where: { email: 'admin@shked.com' },
      update: {
        firstName: 'Иван',
        lastName: 'Администраторов',
        name: 'Иван Администраторов',
        sex: 'male',
      },
      create: {
        email: 'admin@shked.com',
        password: adminPassword,
        firstName: 'Иван',
        lastName: 'Администраторов',
        name: 'Иван Администраторов',
        sex: 'male',
        role: 'admin',
      },
    })

    // Студент
    const studentPassword = await bcryptjs.hash('student123', 12)
    const demoStudent = await prisma.user.upsert({
      where: { email: 'student@demo.com' },
      update: {
        firstName: 'Мария',
        lastName: 'Студентова',
        name: 'Мария Студентова',
        sex: 'female',
        groupId: techPredGroup.id,
      },
      create: {
        email: 'student@demo.com',
        password: studentPassword,
        firstName: 'Мария',
        lastName: 'Студентова',
        name: 'Мария Студентова',
        sex: 'female',
        role: 'student',
        groupId: techPredGroup.id,
      },
    })

    // Преподаватель
    const lectorPassword = await bcryptjs.hash('lector123', 12)
    const demoLector = await prisma.user.upsert({
      where: { email: 'lector@demo.com' },
      update: {
        firstName: 'Александр',
        lastName: 'Преподавателев',
        name: 'Александр Преподавателев',
        sex: 'male',
      },
      create: {
        email: 'lector@demo.com',
        password: lectorPassword,
        firstName: 'Александр',
        lastName: 'Преподавателев',
        name: 'Александр Преподавателев',
        sex: 'male',
        role: 'lector',
      },
    })

    // Ментор
    const mentorPassword = await bcryptjs.hash('mentor123', 12)
    const demoMentor = await prisma.user.upsert({
      where: { email: 'mentor@demo.com' },
      update: {
        firstName: 'Анна',
        lastName: 'Менторова',
        name: 'Анна Менторова',
        sex: 'female',
      },
      create: {
        email: 'mentor@demo.com',
        password: mentorPassword,
        firstName: 'Анна',
        lastName: 'Менторова',
        name: 'Анна Менторова',
        sex: 'female',
        role: 'mentor',
      },
    })

    // Ассистент
    const assistantPassword = await bcryptjs.hash('assistant123', 12)
    await prisma.user.upsert({
      where: { email: 'assistant@demo.com' },
      update: {
        firstName: 'Дмитрий',
        lastName: 'Ассистентов',
        name: 'Дмитрий Ассистентов',
        sex: 'male',
      },
      create: {
        email: 'assistant@demo.com',
        password: assistantPassword,
        firstName: 'Дмитрий',
        lastName: 'Ассистентов',
        name: 'Дмитрий Ассистентов',
        sex: 'male',
        role: 'assistant',
      },
    })

    // Со-преподаватель
    const coLecturerPassword = await bcryptjs.hash('co_lecturer123', 12)
    await prisma.user.upsert({
      where: { email: 'co-lecturer@demo.com' },
      update: {
        firstName: 'Елена',
        lastName: 'Со-преподавателева',
        name: 'Елена Со-преподавателева',
        sex: 'female',
      },
      create: {
        email: 'co-lecturer@demo.com',
        password: coLecturerPassword,
        firstName: 'Елена',
        lastName: 'Со-преподавателева',
        name: 'Елена Со-преподавателева',
        sex: 'female',
        role: 'co_lecturer',
      },
    })

    // Учебный отдел
    const eduOfficePassword = await bcryptjs.hash('eduoffice123', 12)
    await prisma.user.upsert({
      where: { email: 'eduoffice@demo.com' },
      update: {
        firstName: 'Михаил',
        lastName: 'Учебногоотдела',
        name: 'Михаил Учебногоотдела',
        sex: 'male',
      },
      create: {
        email: 'eduoffice@demo.com',
        password: eduOfficePassword,
        firstName: 'Михаил',
        lastName: 'Учебногоотдела',
        name: 'Михаил Учебногоотдела',
        sex: 'male',
        role: 'education_office_head',
      },
    })

    // Админ кафедры
    const deptAdminPassword = await bcryptjs.hash('deptadmin123', 12)
    const deptAdmin = await prisma.user.upsert({
      where: { email: 'deptadmin@demo.com' },
      update: {
        firstName: 'Ольга',
        lastName: 'Кафедрова',
        name: 'Ольга Кафедрова',
        sex: 'female',
      },
      create: {
        email: 'deptadmin@demo.com',
        password: deptAdminPassword,
        firstName: 'Ольга',
        lastName: 'Кафедрова',
        name: 'Ольга Кафедрова',
        sex: 'female',
        role: 'department_admin',
      },
    })

    // Глава учебного отдела
    const eduHeadPassword = await bcryptjs.hash('eduhead123', 12)
    await prisma.user.upsert({
      where: { email: 'eduhead@demo.com' },
      update: {
        firstName: 'Виктор',
        lastName: 'Учебный',
        name: 'Виктор Учебный',
        sex: 'male',
      },
      create: {
        email: 'eduhead@demo.com',
        password: eduHeadPassword,
        firstName: 'Виктор',
        lastName: 'Учебный',
        name: 'Виктор Учебный',
        sex: 'male',
        role: 'education_office_head',
      },
    })

    // Создание кафедры
    console.error('🏛️ Создание кафедры...')
    const department = await prisma.department.upsert({
      where: { name: 'Кафедра Технологического Предпринимательства' },
      update: {},
      create: {
        name: 'Кафедра Технологического Предпринимательства',
        code: 'TECHPRED',
        description: 'Кафедра, отвечающая за подготовку технологических предпринимателей',
        headId: deptAdmin.id,
      }
    })

    // Привязка админа к кафедре
    await prisma.user.update({
      where: { id: deptAdmin.id },
      data: { departmentId: department.id }
    })

    // 4. Создание предметов на основе Excel данных
    console.error('📚 Создание предметов...')
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

    // Назначаем демо преподавателя к нескольким предметам
    const lectorSubjects = createdSubjects.slice(0, 3) // Первые 3 предмета
    for (const subject of lectorSubjects) {
      await prisma.subjectLector.create({
        data: {
          subjectId: subject.id,
          userId: demoLector.id,
          role: 'LECTOR'
        }
      })
    }

    // Назначаем демо ментора к группе
    await prisma.user.update({
      where: { id: demoMentor.id },
      data: { mentorGroupIds: [techPredGroup.id] }
    })

    // Store assistant for later use
    const demoAssistant = await prisma.user.findUnique({
      where: { email: 'assistant@demo.com' }
    })

    // Назначаем ассистента к предметам
    console.error('🤝 Назначение ассистента к предметам...')
    if (demoAssistant) {
      const assistantSubjects = createdSubjects.slice(0, 4) // Первые 4 предмета
      for (const subject of assistantSubjects) {
        await prisma.subjectAssistant.upsert({
          where: {
            subjectId_userId: {
              subjectId: subject.id,
              userId: demoAssistant.id,
            }
          },
          update: {},
          create: {
            subjectId: subject.id,
            userId: demoAssistant.id,
            assignedBy: demoLector.id, // Assigned by lector
            isActive: true,
          }
        })
      }
      console.error(`   ✓ Назначен ассистент к ${assistantSubjects.length} предметам`)
    }

    // Создание дополнительных студентов для реалистичного тестирования
    console.error('👥 Создание дополнительных студентов...')
    const additionalStudents = [
      { firstName: 'Петр', lastName: 'Петров', email: 'petr.petrov@demo.com', sex: 'male' },
      { firstName: 'Елена', lastName: 'Иванова', email: 'elena.ivanova@demo.com', sex: 'female' },
      { firstName: 'Алексей', lastName: 'Сидоров', email: 'alexey.sidorov@demo.com', sex: 'male' },
      { firstName: 'Анастасия', lastName: 'Смирнова', email: 'anastasia.smirnova@demo.com', sex: 'female' },
    ]

    const defaultPassword = await bcryptjs.hash('student123', 12)
    for (const studentData of additionalStudents) {
      await prisma.user.upsert({
        where: { email: studentData.email },
        update: {
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          name: `${studentData.firstName} ${studentData.lastName}`,
          sex: studentData.sex,
          groupId: techPredGroup.id,
        },
        create: {
          email: studentData.email,
          password: defaultPassword,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          name: `${studentData.firstName} ${studentData.lastName}`,
          sex: studentData.sex,
          role: 'student',
          groupId: techPredGroup.id,
        },
      })
    }
    console.error(`   ✓ Создано ${additionalStudents.length} дополнительных студентов`)


    // 5. Добавление дополнительных тестовых расписаний
    console.error('📋 Добавление дополнительных занятий...')
    
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfterTomorrow = new Date(now)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const twoDaysAgo = new Date(now)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    const additionalSchedules = [
      // Past schedules (for attendance marking)
      {
        subject: createdSubjects.find(s => s.name.includes('Системное мышление')),
        date: twoDaysAgo,
        startTime: '10:00',
        endTime: '12:00',
        location: 'Аудитория 301',
        description: 'Лекция по системному мышлению (требует отметки посещаемости)'
      },
      {
        subject: createdSubjects.find(s => s.name.includes('Коммерциализация')),
        date: yesterday,
        startTime: '14:00',
        endTime: '16:00',
        location: 'Аудитория 205',
        description: 'Практикум по коммерциализации (требует отметки посещаемости)'
      },
      // Future schedules (for schedule view)
      {
        subject: createdSubjects.find(s => s.name.includes('финансового моделирования')),
        date: tomorrow,
        startTime: '11:00',
        endTime: '13:00',
        location: 'Компьютерный класс',
        description: 'Практикум по финансовому моделированию'
      },
      {
        subject: createdSubjects.find(s => s.name.includes('Проектирование венчурного')),
        date: tomorrow,
        startTime: '15:00',
        endTime: '17:00',
        location: 'Аудитория 412',
        description: 'Тьюториал по венчурному предпринимательству'
      },
      {
        subject: createdSubjects.find(s => s.name.includes('Научный семинар')),
        date: dayAfterTomorrow,
        startTime: '09:00',
        endTime: '11:00',
        location: 'Конференц-зал',
        description: 'Научный семинар - презентации проектов'
      },
      {
        subject: createdSubjects.find(s => s.name.includes('Разработка продукта')),
        date: nextWeek,
        startTime: '13:00',
        endTime: '15:00',
        location: 'Аудитория 203',
        description: 'Методология разработки продукта - практикум'
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
    console.error(`   ✓ Создано ${additionalSchedules.length} расписаний (прошлые и будущие для тестирования)`)


    // 6. Создание тестовых домашних заданий
    console.error('📝 Создание домашних заданий...')
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

    // 7. Создание тестовых сдач домашних заданий
    console.error('📤 Создание сдач домашних заданий...')
    
    // Используем только демо-студента для сдач
    const students = [demoStudent]
    
    for (const student of students) {
      for (const homework of createdHomework) {
        // Создаем сдачу для каждого студента (некоторые сданы, некоторые нет)
        const shouldSubmit = Math.random() > 0.3 // 70% вероятность сдачи
        
        if (shouldSubmit) {
          const status = Math.random() > 0.5 ? 'SUBMITTED' : 'REVIEWED'
          const grade = status === 'REVIEWED' ? Math.floor(Math.random() * 2) + 4 : null // 4 или 5
          const comment = status === 'REVIEWED' ? 
            (grade === 5 ? 'Отличная работа! Очень детальный анализ.' : 'Хорошая работа, есть что улучшить.') : 
            null

          await prisma.homeworkSubmission.upsert({
            where: {
              homeworkId_userId: {
                homeworkId: homework.id,
                userId: student.id
              }
            },
            update: {},
            create: {
              homeworkId: homework.id,
              userId: student.id,
              submissionUrl: Math.random() > 0.5 
                ? `https://github.com/student-${student.id}/homework-${homework.id}` 
                : null,
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

    console.error('✅ Заполнение базы данных завершено!')
    console.error(`📊 Создано:
    - Пользователей: 13 (8 ролей + 5 студентов)
    - Групп: 1
    - Предметов: ${createdSubjects.length}
    - Назначений ассистента: 4 предмета
    - Расписаний: ${additionalSchedules.length} (прошлые и будущие)
    - Домашних заданий: ${createdHomework.length}
    - Сдач: созданы для демо-студента
    
    🎯 Демо аккаунты (8 ролей):
    - admin@shked.com / admin123 (👨‍💼 Админ)
    - student@demo.com / student123 (🎓 Студент)
    - lector@demo.com / lector123 (👨‍🏫 Преподаватель)
    - mentor@demo.com / mentor123 (👤 Ментор)
    - assistant@demo.com / assistant123 (🤝 Ассистент - назначен к 4 предметам)
    - co-lecturer@demo.com / co_lecturer123 (👥 Со-преподаватель)
    - eduoffice@demo.com / eduoffice123 (📊 Учебный отдел)
    - deptadmin@demo.com / deptadmin123 (🏛️ Админ кафедры)
    
    📚 Дополнительные студенты (все пароли: student123):
    - petr.petrov@demo.com
    - elena.ivanova@demo.com
    - alexey.sidorov@demo.com
    - anastasia.smirnova@demo.com
    
    ✨ Функции для тестирования:
    - Ассистент может видеть расписание назначенных предметов
    - Прошлые занятия требуют отметки посещаемости
    - Будущие занятия доступны для просмотра
    - Материалы доступны ассистенту`)
    
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
