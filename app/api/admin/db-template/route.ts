import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import fs from 'fs/promises'
import path from 'path'

// Путь к папке с шаблонами
const TEMPLATES_DIR = path.join(process.cwd(), 'data', 'templates')

// Обеспечиваем существование папки
async function ensureTemplatesDir() {
  try {
    await fs.access(TEMPLATES_DIR)
  } catch {
    await fs.mkdir(TEMPLATES_DIR, { recursive: true })
  }
}

// Получение всех данных из базы
async function getAllData() {
  const [
    users,
    groups,
    subjects,
    schedules,
    homework,
    homeworkSubmissions,
    telegramUsers,
    userGroups,
    attendance,
    exams,
    examResults,
    mentorMeetings,
    forumTopics,
    forumPosts,
    subjectDocuments,
    externalResources,
    subgroups,
    subgroupStudents,
    subjectLectors,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.group.findMany(),
    prisma.subject.findMany(),
    prisma.schedule.findMany(),
    prisma.homework.findMany(),
    prisma.homeworkSubmission.findMany(),
    prisma.telegramUser.findMany(),
    prisma.userGroup.findMany(),
    prisma.attendance.findMany(),
    prisma.exam.findMany(),
    prisma.examResult.findMany(),
    prisma.mentorMeeting.findMany(),
    prisma.forumTopic.findMany(),
    prisma.forumPost.findMany(),
    prisma.subjectDocument.findMany(),
    prisma.externalResource.findMany(),
    prisma.subgroup.findMany(),
    prisma.subgroupStudent.findMany(),
    prisma.subjectLector.findMany(),
  ])

  return {
    users,
    groups,
    subjects,
    schedules,
    homework,
    homeworkSubmissions,
    telegramUsers,
    userGroups,
    attendance,
    exams,
    examResults,
    mentorMeetings,
    forumTopics,
    forumPosts,
    subjectDocuments,
    externalResources,
    subgroups,
    subgroupStudents,
    subjectLectors,
  }
}

// Очистка базы данных
async function clearDatabase() {
  // Удаляем в правильном порядке (с учетом foreign keys)
  await prisma.homeworkSubmission.deleteMany()
  await prisma.homework.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.examResult.deleteMany()
  await prisma.exam.deleteMany()
  await prisma.mentorMeeting.deleteMany()
  await prisma.forumPost.deleteMany()
  await prisma.forumTopic.deleteMany()
  await prisma.subgroupStudent.deleteMany()
  await prisma.subgroup.deleteMany()
  await prisma.subjectLector.deleteMany()
  await prisma.subjectDocument.deleteMany()
  await prisma.externalResource.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.userGroup.deleteMany()
  await prisma.telegramUser.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.group.deleteMany()
  await prisma.user.deleteMany()
}

// Восстановление данных из шаблона
async function restoreData(data: any) {
  // Создаем записи в правильном порядке
  if (data.users?.length > 0) {
    for (const user of data.users) {
      await prisma.user.create({ data: user })
    }
  }

  if (data.groups?.length > 0) {
    for (const group of data.groups) {
      await prisma.group.create({ data: group })
    }
  }

  if (data.subjects?.length > 0) {
    for (const subject of data.subjects) {
      await prisma.subject.create({ data: subject })
    }
  }

  if (data.telegramUsers?.length > 0) {
    for (const telegramUser of data.telegramUsers) {
      await prisma.telegramUser.create({ data: telegramUser })
    }
  }

  if (data.userGroups?.length > 0) {
    for (const userGroup of data.userGroups) {
      await prisma.userGroup.create({ data: userGroup })
    }
  }

  if (data.schedules?.length > 0) {
    for (const schedule of data.schedules) {
      await prisma.schedule.create({ data: schedule })
    }
  }

  if (data.subjectLectors?.length > 0) {
    for (const subjectLector of data.subjectLectors) {
      await prisma.subjectLector.create({ data: subjectLector })
    }
  }

  if (data.subjectDocuments?.length > 0) {
    for (const doc of data.subjectDocuments) {
      await prisma.subjectDocument.create({ data: doc })
    }
  }

  if (data.externalResources?.length > 0) {
    for (const resource of data.externalResources) {
      await prisma.externalResource.create({ data: resource })
    }
  }

  if (data.subgroups?.length > 0) {
    for (const subgroup of data.subgroups) {
      await prisma.subgroup.create({ data: subgroup })
    }
  }

  if (data.subgroupStudents?.length > 0) {
    for (const subgroupStudent of data.subgroupStudents) {
      await prisma.subgroupStudent.create({ data: subgroupStudent })
    }
  }

  if (data.attendance?.length > 0) {
    for (const att of data.attendance) {
      await prisma.attendance.create({ data: att })
    }
  }

  if (data.exams?.length > 0) {
    for (const exam of data.exams) {
      await prisma.exam.create({ data: exam })
    }
  }

  if (data.examResults?.length > 0) {
    for (const result of data.examResults) {
      await prisma.examResult.create({ data: result })
    }
  }

  if (data.mentorMeetings?.length > 0) {
    for (const meeting of data.mentorMeetings) {
      await prisma.mentorMeeting.create({ data: meeting })
    }
  }

  if (data.forumTopics?.length > 0) {
    for (const topic of data.forumTopics) {
      await prisma.forumTopic.create({ data: topic })
    }
  }

  if (data.forumPosts?.length > 0) {
    for (const post of data.forumPosts) {
      await prisma.forumPost.create({ data: post })
    }
  }

  if (data.homework?.length > 0) {
    for (const hw of data.homework) {
      await prisma.homework.create({ data: hw })
    }
  }

  if (data.homeworkSubmissions?.length > 0) {
    for (const submission of data.homeworkSubmissions) {
      await prisma.homeworkSubmission.create({ data: submission })
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

    const body = await request.json()
    const { action, name } = body

    if (!action || !name) {
      return NextResponse.json({ error: 'Не указаны action и name' }, { status: 400 })
    }

    // Валидация имени шаблона для предотвращения path traversal
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return NextResponse.json({ 
        error: 'Недопустимое имя шаблона. Используйте только латинские буквы, цифры, дефис и подчеркивание' 
      }, { status: 400 })
    }

    await ensureTemplatesDir()

    const templatePath = path.join(TEMPLATES_DIR, `${name}.json`)

    if (action === 'save') {
      // Сохранение текущего состояния БД
      console.log(`💾 Сохранение шаблона "${name}"...`)
      
      const data = await getAllData()
      const snapshot = {
        name,
        createdAt: new Date().toISOString(),
        data,
      }

      await fs.writeFile(templatePath, JSON.stringify(snapshot, null, 2), 'utf-8')

      console.log(`✅ Шаблон "${name}" сохранен`)

      return NextResponse.json({
        success: true,
        message: `Шаблон "${name}" успешно сохранен`,
        snapshot: {
          name: snapshot.name,
          createdAt: snapshot.createdAt,
          stats: {
            users: data.users.length,
            groups: data.groups.length,
            subjects: data.subjects.length,
            schedules: data.schedules.length,
            homework: data.homework.length,
          },
        },
      })
    } else if (action === 'restore') {
      // Восстановление из шаблона
      console.log(`📥 Восстановление шаблона "${name}"...`)

      try {
        await fs.access(templatePath)
      } catch {
        return NextResponse.json({ error: `Шаблон "${name}" не найден` }, { status: 404 })
      }

      const fileContent = await fs.readFile(templatePath, 'utf-8')
      const snapshot = JSON.parse(fileContent)

      // Очищаем базу
      console.log('🗑️ Очистка базы данных...')
      await clearDatabase()

      // Восстанавливаем данные
      console.log('📦 Восстановление данных...')
      await restoreData(snapshot.data)

      console.log(`✅ Шаблон "${name}" восстановлен`)

      return NextResponse.json({
        success: true,
        message: `Шаблон "${name}" успешно восстановлен`,
        stats: {
          users: snapshot.data.users?.length || 0,
          groups: snapshot.data.groups?.length || 0,
          subjects: snapshot.data.subjects?.length || 0,
          schedules: snapshot.data.schedules?.length || 0,
          homework: snapshot.data.homework?.length || 0,
        },
      })
    } else if (action === 'list') {
      // Список шаблонов
      const files = await fs.readdir(TEMPLATES_DIR)
      const templates = files.filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''))

      return NextResponse.json({
        success: true,
        templates,
      })
    } else {
      return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Ошибка при работе с шаблоном:', error)
    return NextResponse.json(
      { error: 'Ошибка при работе с шаблоном', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET - список шаблонов
export async function GET() {
  try {
    await ensureTemplatesDir()
    const files = await fs.readdir(TEMPLATES_DIR)
    const templates = []

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(TEMPLATES_DIR, file), 'utf-8')
        const snapshot = JSON.parse(content)
        templates.push({
          name: snapshot.name,
          createdAt: snapshot.createdAt,
          stats: {
            users: snapshot.data.users?.length || 0,
            groups: snapshot.data.groups?.length || 0,
            subjects: snapshot.data.subjects?.length || 0,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      templates,
    })
  } catch (error) {
    console.error('❌ Ошибка при получении списка шаблонов:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списка шаблонов' },
      { status: 500 }
    )
  }
}

