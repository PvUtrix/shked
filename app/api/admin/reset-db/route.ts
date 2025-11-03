import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcryptjs from 'bcryptjs'
import fs from 'fs'
import path from 'path'

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Проверяем права администратора
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Проверяем переменную окружения
    if (process.env.ENABLE_DB_RESET !== 'true') {
      return NextResponse.json(
        { error: 'Сброс базы данных отключен в продакшене' },
        { status: 403 }
      )
    }

    console.log('🗑️ Начинаем сброс базы данных...')

    // Удаляем данные в правильном порядке (с учетом внешних ключей)
    await prisma.homeworkSubmission.deleteMany()
    await prisma.homework.deleteMany()
    await prisma.schedule.deleteMany()
    await prisma.userGroup.deleteMany()
    await prisma.telegramUser.deleteMany()
    await prisma.subject.deleteMany()
    await prisma.group.deleteMany()
    await prisma.user.deleteMany()

    console.log('✅ Данные удалены, начинаем заполнение...')

    // Читаем анализ Excel файла
    const analysisPath = path.join(process.cwd(), 'data', 'excel_analysis.json')
    const excelAnalysis: ExcelAnalysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'))
    
    // 1. Создание тестовых пользователей
    console.log('👤 Создание пользователей...')
    
    // Админ пользователь
    const adminPassword = await bcryptjs.hash('admin123', 12)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@shked.com',
        password: adminPassword,
        firstName: 'Иван',
        lastName: 'Администраторов',
        name: 'Иван Администраторов',
        sex: 'male',
        role: 'admin',
      },
    })

    // Демо студент для тестирования
    const demoStudentPassword = await bcryptjs.hash('student123', 12)
    const demoStudent = await prisma.user.create({
      data: {
        email: 'student123@demo.com',
        password: demoStudentPassword,
        firstName: 'Мария',
        lastName: 'Студентова',
        name: 'Мария Студентова',
        sex: 'female',
        role: 'student',
      },
    })

    // Демо преподаватель
    const demoLectorPassword = await bcryptjs.hash('lector123', 12)
    const demoLector = await prisma.user.create({
      data: {
        email: 'lector@demo.com',
        password: demoLectorPassword,
        firstName: 'Александр',
        lastName: 'Преподавателев',
        name: 'Александр Преподавателев',
        sex: 'male',
        role: 'lector',
      },
    })

    // Демо ментор
    const demoMentorPassword = await bcryptjs.hash('mentor123', 12)
    const demoMentor = await prisma.user.create({
      data: {
        email: 'mentor@demo.com',
        password: demoMentorPassword,
        firstName: 'Анна',
        lastName: 'Менторова',
        name: 'Анна Менторова',
        sex: 'female',
        role: 'mentor',
      },
    })

    // 2. Создание группы
    console.log('👥 Создание групп...')
    const techPredGroup = await prisma.group.create({
      data: {
        name: 'ТехПред МФТИ 2025-27',
        description: 'Магистратура Технологическое предпринимательство МФТИ 2025-27',
        semester: '1 семестр',
        year: '2025-27',
      },
    })

    // 3. Создание предметов
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
      const createdSubject = await prisma.subject.create({
        data: subject,
      })
      createdSubjects.push(createdSubject)
    }

    // Назначаем демо преподавателя к нескольким предметам
    const lectorSubjects = createdSubjects.slice(0, 3) // Первые 3 предмета
    for (const subject of lectorSubjects) {
      await prisma.subject.update({
        where: { id: subject.id },
        data: { lectorId: demoLector.id }
      })
    }

    // Назначаем демо ментора к группе
    await prisma.user.update({
      where: { id: demoMentor.id },
      data: { mentorGroupIds: [techPredGroup.id] }
    })

    // 4. Создание студентов
    console.log('🎓 Создание студентов...')
    const studentsData = excelAnalysis.data['1 семестр. Распределение на под'].sample_data
    
    const students = []
    for (const studentData of studentsData) {
      if (studentData?.Студент) {
        const names = studentData.Студент.split(' ')
        const firstName = names[1] || 'Студент'
        const lastName = names[0] || 'Неизвестный'
        
        // Функция транслитерации кириллицы в латиницу
        const transliterate = (str: string): string => {
          const ru = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'
          const en = 'abvgdeezhziyklmnoprstufhccss_y_eua'
          
          return str.toLowerCase()
            .split('')
            .map(char => {
              const index = ru.indexOf(char)
              return index >= 0 ? en[index] : char
            })
            .join('')
        }
        
        // Транслитерируем и очищаем от недопустимых символов
        const cleanFirstName = transliterate(firstName).replace(/[^a-z0-9+-]/g, '') || 'student'
        const cleanLastName = transliterate(lastName).replace(/[^a-z0-9+-]/g, '') || 'unknown'
        
        // Собираем локальную часть email (часть перед @)
        const localPart = `${cleanFirstName}.${cleanLastName}`
          .replace(/\.+/g, '.') // Убираем множественные точки
          .replace(/^\.+|\.+$/g, '') // Убираем точки в начале и конце
        
        // Если локальная часть пустая, используем дефолтное значение
        const email = localPart && localPart.length > 0 
          ? `${localPart}@student.mipt.ru`
          : `student.${Math.random().toString(36).substring(2, 8)}@student.mipt.ru`
        
        const studentPassword = await bcryptjs.hash('student123', 12)
        const student = await prisma.user.create({
          data: {
            email,
            password: studentPassword,
            firstName,
            lastName,
            name: studentData.Студент,
            sex: null, // Пол не указан в исходных данных
            role: 'student',
            groupId: techPredGroup.id,
          },
        })
        
        // Создание записи о распределении по подгруппам
        await prisma.userGroup.create({
          data: {
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

    // 5. Создание расписания
    console.log('📅 Создание расписания...')
    const scheduleData = excelAnalysis.data['1 семестр. Расписание'].sample_data
    
    for (let i = 7; i < scheduleData.length; i++) {
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

    // 6. Создание домашних заданий
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

    // 7. Создание сдач домашних заданий
    console.log('📤 Создание сдач домашних заданий...')
    const sampleStudents = students.slice(0, 5) // Берем первых 5 студентов для демонстрации
    
    for (const student of sampleStudents) {
      for (const homework of createdHomework) {
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
              submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
              reviewedAt: status === 'REVIEWED' ? new Date() : null
            }
          })
        }
      }
    }

    console.log('✅ База данных успешно сброшена и заполнена!')

    return NextResponse.json({
      success: true,
      message: 'База данных успешно сброшена и заполнена',
      stats: {
        users: students.length + 4,
        groups: 1,
        subjects: createdSubjects.length,
        homework: createdHomework.length,
        schedules: 'из Excel файла + дополнительные'
      }
    })

  } catch (error) {
    console.error('❌ Ошибка при сбросе базы данных:', error)
    return NextResponse.json(
      { error: 'Ошибка при сбросе базы данных' },
      { status: 500 }
    )
  }
}
