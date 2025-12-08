import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { HomeworkFormData } from '@/lib/types'
import { logActivity } from '@/lib/activity-log'

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
    const status = searchParams.get('status')  // Статус сдачи студента
    const homeworkStatus = searchParams.get('homeworkStatus')  // Статус самого задания (DRAFT, ACTIVE, ARCHIVED)
    const lector = searchParams.get('lector') === 'true'
    const mentor = searchParams.get('mentor') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {
      isActive: true
    }

    // Фильтрация по статусу задания
    if (homeworkStatus) {
      where.status = homeworkStatus
    } else if (session.user.role === 'student') {
      // Студенты видят только активные задания
      where.status = 'ACTIVE'
    }

    // Фильтрация по предмету
    if (subjectId) {
      where.subjectId = subjectId
    }

    // Фильтрация по группе
    if (groupId) {
      where.groupId = groupId
    }

    // Для студентов показываем только их группу или общие задания
    if (session.user.role === 'student') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { groupId: true }
      })
      
      const userGroupId = user?.groupId

      where.OR = [
        { groupId: null },  // Общие задания
        { groupId: userGroupId }  // Задания для группы студента
      ]
    }

    // Для преподавателей показываем только их предметы
    if (['lector', 'co_lecturer', 'assistant'].includes(session.user.role) || lector) {
      where.subject = {
        lectors: {
          some: {
            userId: session.user.id
          }
        }
      }
    }

    // Для менторов показываем только их группы
    if (session.user.role === 'mentor' || mentor) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })

      if (user?.mentorGroupIds && Array.isArray(user.mentorGroupIds)) {
        where.groupId = {
          in: user.mentorGroupIds as string[]
        }
      }
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
    if (!session?.user || !['admin', 'lector', 'co_lecturer', 'assistant'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body: HomeworkFormData = await request.json()

    // Для преподавателей проверяем, что предмет принадлежит им
    if (['lector', 'co_lecturer', 'assistant'].includes(session.user.role)) {
      const subjectLector = await prisma.subjectLector.findUnique({
        where: {
          subjectId_userId: {
            subjectId: body.subjectId,
            userId: session.user.id
          }
        }
      })

      if (!subjectLector) {
        return NextResponse.json({ error: 'Нет доступа к этому предмету' }, { status: 403 })
      }
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
        groupId: body.groupId,
        status: body.status || 'DRAFT'  // По умолчанию создаем как черновик
      },
      include: {
        subject: true,
        group: true
      }
    })

    // Логируем создание домашнего задания
    await logActivity({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Homework',
      entityId: homework.id,
      request,
      details: {
        after: {
          id: homework.id,
          title: homework.title,
          subjectId: homework.subjectId,
          groupId: homework.groupId,
          deadline: homework.deadline.toISOString()
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json(homework, { status: 201 })

  } catch (error) {
    console.error('Ошибка при создании домашнего задания:', error)
    
    // Логируем ошибку
    const session = await getServerSession(authOptions)
    if (session?.user) {
      await logActivity({
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'Homework',
        request,
        details: {
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        },
        result: 'FAILURE'
      })
    }
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
