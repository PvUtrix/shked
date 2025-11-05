import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { HomeworkFormData } from '@/lib/types'

// GET /api/homework/[id] - получение конкретного домашнего задания
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const homework = await prisma.homework.findUnique({
      where: { id },
      include: {
        subject: true,
        group: true,
        submissions: {
          where: session.user.role === 'student' 
            ? { userId: session.user.id }  // Студенты видят только свою работу
            : undefined,  // Админы и преподаватели видят все работы
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
        }
      }
    })

    if (!homework) {
      return NextResponse.json(
        { error: 'Домашнее задание не найдено' },
        { status: 404 }
      )
    }

    // Для студентов проверяем доступ к заданию
    if (session.user.role === 'student') {
      // Студент может видеть задание если:
      // 1. Задание для всех групп (groupId === null)
      // 2. Задание для группы студента
      if (homework.groupId && homework.groupId !== session.user.groupId) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(homework)

  } catch (error) {
    console.error('Ошибка при получении домашнего задания:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/homework/[id] - обновление домашнего задания
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body: Partial<HomeworkFormData> = await request.json()

    // Проверка существования домашнего задания
    const existingHomework = await prisma.homework.findUnique({
      where: { id },
      include: {
        subject: {
          include: {
            lectors: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    })

    if (!existingHomework) {
      return NextResponse.json(
        { error: 'Домашнее задание не найдено' },
        { status: 404 }
      )
    }

    // Проверка прав доступа: только админы и лекторы своих предметов
    if (session.user.role === 'admin') {
      // Админы имеют полный доступ
    } else if (session.user.role === 'lector') {
      // Лекторы могут редактировать только свои задания
      const isLector = existingHomework.subject?.lectors.some(l => l.userId === session.user.id)
      if (!isLector) {
        return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Проверка существования предмета (если обновляется)
    if (body.subjectId) {
      const subject = await prisma.subject.findUnique({
        where: { id: body.subjectId }
      })

      if (!subject) {
        return NextResponse.json(
          { error: 'Предмет не найден' },
          { status: 404 }
        )
      }
    }

    // Проверка существования группы (если обновляется)
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

    const updateData: any = {}
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.content !== undefined) updateData.content = body.content  // MDX контент
    if (body.taskUrl !== undefined) updateData.taskUrl = body.taskUrl
    if (body.deadline) updateData.deadline = new Date(body.deadline)
    if (body.materials !== undefined) updateData.materials = body.materials
    if (body.subjectId !== undefined) updateData.subjectId = body.subjectId
    if (body.groupId !== undefined) updateData.groupId = body.groupId

    const homework = await prisma.homework.update({
      where: { id },
      data: updateData,
      include: {
        subject: true,
        group: true,
        submissions: {
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
        }
      }
    })

    return NextResponse.json(homework)

  } catch (error) {
    console.error('Ошибка при обновлении домашнего задания:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/homework/[id] - удаление домашнего задания
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Проверка существования домашнего задания
    const existingHomework = await prisma.homework.findUnique({
      where: { id }
    })

    if (!existingHomework) {
      return NextResponse.json(
        { error: 'Домашнее задание не найдено' },
        { status: 404 }
      )
    }

    // Мягкое удаление - помечаем как неактивное
    await prisma.homework.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Домашнее задание удалено' })

  } catch (error) {
    console.error('Ошибка при удалении домашнего задания:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
