import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/subjects - получение списка предметов
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')
    const assistantId = searchParams.get('assistantId')
    const includeRelations = searchParams.get('includeRelations') === 'true'

    const where: any = {}

    // Для преподавателей, ассистентов и со-преподавателей показываем только их предметы
    if (['teacher', 'assistant', 'co_teacher', 'lector'].includes(session.user.role)) {
      where.teachers = {
        some: {
          userId: session.user.id
        }
      }
    }

    // Фильтрация по ID преподавателя
    if (teacherId) {
      where.teachers = {
        some: {
          userId: teacherId,
          role: 'TEACHER'
        }
      }
    }

    // Фильтрация по ID ассистента
    if (assistantId) {
      where.teachers = {
        some: {
          userId: assistantId,
          role: 'ASSISTANT'
        }
      }
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        // Старое поле lector (deprecated, для обратной совместимости)
        lector: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        // Новая система множественных преподавателей
        teachers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          }
        },
        // Опциональные связи
        ...(includeRelations ? {
          documents: true,
          resources: true,
          subgroups: {
            include: {
              _count: {
                select: { students: true }
              }
            }
          },
          exams: {
            where: {
              isActive: true
            }
          }
        } : {}),
        _count: {
          select: {
            schedules: true,
            homework: true,
            documents: true,
            exams: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ subjects })

  } catch (error) {
    console.error('Ошибка при получении предметов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/subjects - создание нового предмета
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Только admin может создавать предметы
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    
    // Валидация обязательных полей
    if (!body.name) {
      return NextResponse.json(
        { error: 'Название предмета обязательно' },
        { status: 400 }
      )
    }

    const subject = await prisma.subject.create({
      data: {
        name: body.name,
        description: body.description,
        instructor: body.instructor,
        // Старое поле для обратной совместимости
        lectorId: body.lectorId
      },
      include: {
        lector: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        teachers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Если указан lectorId, создаем запись в SubjectTeacher для обратной совместимости
    if (body.lectorId) {
      await prisma.subjectTeacher.create({
        data: {
          subjectId: subject.id,
          userId: body.lectorId,
          role: 'TEACHER'
        }
      })
    }

    return NextResponse.json(subject, { status: 201 })

  } catch (error) {
    console.error('Ошибка при создании предмета:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/subjects - обновление предмета
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Только admin и teacher могут редактировать предметы
    if (!session?.user || !['admin', 'teacher', 'lector'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID предмета обязателен' },
        { status: 400 }
      )
    }

    // Для преподавателей проверяем, что предмет принадлежит им
    if (['teacher', 'lector'].includes(session.user.role)) {
      const existingSubject = await prisma.subject.findUnique({
        where: { id: body.id },
        include: {
          teachers: {
            where: {
              userId: session.user.id,
              role: { in: ['TEACHER', 'CO_TEACHER'] }
            }
          }
        }
      })

      if (!existingSubject || existingSubject.teachers.length === 0) {
        return NextResponse.json({ error: 'Нет доступа к этому предмету' }, { status: 403 })
      }
    }

    const subject = await prisma.subject.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        instructor: body.instructor,
        lectorId: session.user.role === 'admin' ? body.lectorId : undefined
      },
      include: {
        lector: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        teachers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(subject)

  } catch (error) {
    console.error('Ошибка при обновлении предмета:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/subjects - мягкое удаление предмета
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Только admin может удалять предметы
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID предмета обязателен' },
        { status: 400 }
      )
    }

    // Проверяем существование предмета
    const existingSubject = await prisma.subject.findUnique({
      where: { id }
    })

    if (!existingSubject) {
      return NextResponse.json(
        { error: 'Предмет не найден' },
        { status: 404 }
      )
    }

    // Мягкое удаление - помечаем как неактивный
    await prisma.subject.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Предмет удален' })

  } catch (error) {
    console.error('Ошибка при удалении предмета:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
