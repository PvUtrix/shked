import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logActivity } from '@/lib/activity-log'

// GET /api/groups - получение списка групп
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mentor = searchParams.get('mentor') === 'true'

    const where: any = {}

    // Для менторов показываем только их группы
    if (session.user.role === 'mentor' || mentor) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })

      if (user?.mentorGroupIds && Array.isArray(user.mentorGroupIds)) {
        where.id = {
          in: user.mentorGroupIds as string[]
        }
      }
    }

    const groups = await prisma.group.findMany({
      where,
      include: {
        users: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            users: true,
            schedules: true,
            homework: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ groups })

  } catch (error) {
    console.error('Ошибка при получении групп:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/groups - создание новой группы
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    
    // Валидация обязательных полей
    if (!body.name) {
      return NextResponse.json(
        { error: 'Название группы обязательно' },
        { status: 400 }
      )
    }

    const group = await prisma.group.create({
      data: {
        name: body.name,
        description: body.description,
        semester: body.semester,
        year: body.year
      },
      include: {
        _count: {
          select: {
            users: true,
            schedules: true,
            homework: true
          }
        }
      }
    })

    // Логируем создание группы
    await logActivity({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Group',
      entityId: group.id,
      request,
      details: {
        after: {
          id: group.id,
          name: group.name,
          description: group.description,
          semester: group.semester,
          year: group.year
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json(group, { status: 201 })

  } catch (error) {
    console.error('Ошибка при создании группы:', error)
    
    // Логируем ошибку
    const session = await getServerSession(authOptions)
    if (session?.user) {
      await logActivity({
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'Group',
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

// PUT /api/groups - обновление группы
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID группы обязателен' },
        { status: 400 }
      )
    }

    // Получаем текущее состояние группы для логирования
    const existingGroup = await prisma.group.findUnique({
      where: { id: body.id },
      select: {
        id: true,
        name: true,
        description: true,
        semester: true,
        year: true,
        isActive: true
      }
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Группа не найдена' },
        { status: 404 }
      )
    }

    const group = await prisma.group.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        semester: body.semester,
        year: body.year
      },
      include: {
        _count: {
          select: {
            users: true,
            schedules: true,
            homework: true
          }
        }
      }
    })

    // Логируем обновление группы
    await logActivity({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'Group',
      entityId: group.id,
      request,
      details: {
        before: {
          id: existingGroup.id,
          name: existingGroup.name,
          description: existingGroup.description,
          semester: existingGroup.semester,
          year: existingGroup.year,
          isActive: existingGroup.isActive
        },
        after: {
          id: group.id,
          name: group.name,
          description: group.description,
          semester: group.semester,
          year: group.year
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json(group)

  } catch (error) {
    console.error('Ошибка при обновлении группы:', error)
    
    // Логируем ошибку
    const session = await getServerSession(authOptions)
    if (session?.user && body?.id) {
      await logActivity({
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'Group',
        entityId: body.id,
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

// DELETE /api/groups - мягкое удаление группы
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID группы обязателен' },
        { status: 400 }
      )
    }

    // Проверяем существование группы
    const existingGroup = await prisma.group.findUnique({
      where: { id }
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Группа не найдена' },
        { status: 404 }
      )
    }

    // Мягкое удаление - помечаем как неактивную
    await prisma.group.update({
      where: { id },
      data: { isActive: false }
    })

    // Логируем удаление группы
    await logActivity({
      userId: session.user.id,
      action: 'DELETE',
      entityType: 'Group',
      entityId: id,
      request,
      details: {
        before: {
          id: existingGroup.id,
          name: existingGroup.name,
          description: existingGroup.description,
          isActive: existingGroup.isActive
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json({ message: 'Группа удалена' })

  } catch (error) {
    console.error('Ошибка при удалении группы:', error)
    
    // Логируем ошибку
    const session = await getServerSession(authOptions)
    if (session?.user) {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      if (id) {
        await logActivity({
          userId: session.user.id,
          action: 'DELETE',
          entityType: 'Group',
          entityId: id,
          request,
          details: {
            error: error instanceof Error ? error.message : 'Неизвестная ошибка'
          },
          result: 'FAILURE'
        })
      }
    }
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
