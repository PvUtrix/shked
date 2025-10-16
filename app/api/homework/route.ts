import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { HomeworkFormData } from '@/lib/types'

// GET /api/homework - получение списка домашних заданий
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const groupId = searchParams.get('groupId')
    const status = searchParams.get('status')
    const lector = searchParams.get('lector') === 'true'
    const mentor = searchParams.get('mentor') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {
      isActive: true
    }

    // Фильтрация по предмету
    if (subjectId) {
      where.subjectId = subjectId
    }

    // Фильтрация по группе
    if (groupId) {
      where.groupId = groupId
    }

    // Для студентов показываем только их группу
    if (session.user.role === 'student' && session.user.groupId) {
      where.groupId = session.user.groupId
    }

    // Для преподавателей показываем только их предметы
    if (session.user.role === 'lector' || lector) {
      where.subject = {
        lectorId: session.user.id
      }
    }

    // Для менторов показываем только их группы
    if (session.user.role === 'mentor' || mentor) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })
      
      // Временно отключаем фильтрацию по mentorGroupIds до применения миграции
      // if (user?.mentorGroupIds) {
      //   const groupIds = Array.isArray(user.mentorGroupIds) ? user.mentorGroupIds : []
      //   where.groupId = {
      //     in: groupIds
      //   }
      // }
    }

    const homework = await prisma.homework.findMany({
      where,
      include: {
        subject: true,
        group: true,
        submissions: {
          where: session.user.role === 'student' ? { userId: session.user.id } : undefined,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        deadline: 'asc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Фильтрация по статусу для студентов
    let filteredHomework = homework
    if (session.user.role === 'student' && status) {
      filteredHomework = homework.filter(hw => {
        const submission = hw.submissions[0]
        if (!submission) return status === 'not_submitted'
        return submission.status.toLowerCase() === status.toLowerCase()
      })
    }

    const total = await prisma.homework.count({ where })

    return NextResponse.json({
      homework: filteredHomework,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Ошибка при получении домашних заданий:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/homework - создание нового домашнего задания
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Проверяем права на создание домашнего задания
    if (!session?.user || !['admin', 'lector'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body: HomeworkFormData = await request.json()
    
    // Для преподавателей проверяем, что предмет принадлежит им
    if (session.user.role === 'lector') {
      const subject = await prisma.subject.findUnique({
        where: { id: body.subjectId }
      })

      // Временно отключаем проверку lectorId до применения миграции
      // if (!subject || subject.lectorId !== session.user.id) {
      //   return NextResponse.json({ error: 'Нет доступа к этому предмету' }, { status: 403 })
      // }
    }
    
    // Валидация обязательных полей
    if (!body.title || !body.subjectId || !body.deadline) {
      return NextResponse.json(
        { error: 'Название, предмет и дедлайн обязательны' },
        { status: 400 }
      )
    }

    // Проверка существования предмета
    const subject = await prisma.subject.findUnique({
      where: { id: body.subjectId }
    })

    if (!subject) {
      return NextResponse.json(
        { error: 'Предмет не найден' },
        { status: 404 }
      )
    }

    // Проверка существования группы (если указана)
    if (body.groupId) {
      const group = await prisma.group.findUnique({
        where: { id: body.groupId }
      })

      if (!group) {
        return NextResponse.json(
          { error: 'Группа не найдена' },
          { status: 404 }
        )
      }
    }

    const homework = await prisma.homework.create({
      data: {
        title: body.title,
        description: body.description,
        content: body.content,  // MDX контент
        taskUrl: body.taskUrl,
        deadline: new Date(body.deadline),
        materials: body.materials || [],
        subjectId: body.subjectId,
        groupId: body.groupId
      },
      include: {
        subject: true,
        group: true
      }
    })

    return NextResponse.json(homework, { status: 201 })

  } catch (error) {
    console.error('Ошибка при создании домашнего задания:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
