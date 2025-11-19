import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logActivity } from '@/lib/activity-log'

// GET /api/schedules - получение списка расписания
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const groupId = searchParams.get('groupId')
    const lector = searchParams.get('lector') === 'true'
    const mentor = searchParams.get('mentor') === 'true'
    const date = searchParams.get('date')

    const where: any = {}

    // Фильтрация по предмету
    if (subjectId) {
      where.subjectId = subjectId
    }

    // Фильтрация по группе
    if (groupId) {
      where.groupId = groupId
    }

    // Фильтрация по дате
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      
      where.date = {
        gte: startDate,
        lt: endDate
      }
    }

    // Для студентов показываем только их группу с учетом подгрупп
    if (session.user.role === 'student' && session.user.groupId) {
      where.groupId = session.user.groupId
      
      // Получаем информацию о подгруппах студента
      const userGroup = await prisma.userGroup.findUnique({
        where: {
          userId_groupId: {
            userId: session.user.id,
            groupId: session.user.groupId
          }
        }
      })
      
      // Если у студента есть подгруппы, фильтруем расписание
      // Показываем занятия либо для всей группы (subgroupId = null),
      // либо для конкретных подгрупп студента
      if (userGroup) {
        const subgroupConditions: Array<{ subgroupId: string | null }> = [
          { subgroupId: null }, // Занятия для всей группы
        ]
        
        // Добавляем условия для каждой подгруппы, в которую назначен студент
        if (userGroup.subgroupCommerce !== null && userGroup.subgroupCommerce !== undefined) {
          subgroupConditions.push({ subgroupId: String(userGroup.subgroupCommerce) })
        }
        if (userGroup.subgroupTutorial !== null && userGroup.subgroupTutorial !== undefined) {
          subgroupConditions.push({ subgroupId: String(userGroup.subgroupTutorial) })
        }
        if (userGroup.subgroupFinance !== null && userGroup.subgroupFinance !== undefined) {
          subgroupConditions.push({ subgroupId: String(userGroup.subgroupFinance) })
        }
        if (userGroup.subgroupSystemThinking !== null && userGroup.subgroupSystemThinking !== undefined) {
          subgroupConditions.push({ subgroupId: String(userGroup.subgroupSystemThinking) })
        }
        
        // Применяем фильтр OR для подгрупп
        where.OR = subgroupConditions
      }
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

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        subject: {
          select: {
            id: true,
            name: true
            // Временно отключаем lector до применения миграции
            // lector: {
            //   select: {
            //     id: true,
            //     name: true,
            //     firstName: true,
            //     lastName: true
            //   }
            // }
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json({ schedules })

  } catch (error) {
    console.error('Ошибка при получении расписания:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/schedules - создание расписания
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['admin', 'lector'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    
    // Валидация обязательных полей
    if (!body.subjectId || !body.date || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: 'Предмет, дата, время начала и окончания обязательны' },
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

    // Вычисляем день недели
    const date = new Date(body.date)
    const dayOfWeek = date.getDay()

    // Обрабатываем subgroupId
    // Если subgroupId пустой или равен 'none', устанавливаем null
    // Если subgroupId это просто номер (строка "1", "2", "3", "4"), пытаемся найти реальную подгруппу
    let subgroupId: string | null = null
    if (body.subgroupId && body.subgroupId.trim() !== '' && body.subgroupId !== 'none') {
      // Проверяем, является ли это ID подгруппы (cuid имеет длину ~25 символов)
      // или это просто номер подгруппы (1-2 символа)
      if (body.subgroupId.length <= 4 && /^\d+$/.test(body.subgroupId)) {
        // Это номер подгруппы, пытаемся найти реальную подгруппу
        const subgroupNumber = parseInt(body.subgroupId, 10)
        if (body.groupId) {
          const subgroup = await prisma.subgroup.findFirst({
            where: {
              groupId: body.groupId,
              number: subgroupNumber,
              // Ищем либо общую подгруппу (subjectId = null), либо подгруппу для этого предмета
              OR: [
                { subjectId: null },
                { subjectId: body.subjectId }
              ],
              isActive: true
            }
          })
          
          if (subgroup) {
            subgroupId = subgroup.id
          } else {
            // Если подгруппа не найдена, просто не устанавливаем subgroupId (null)
            // Это означает, что занятие для всей группы
            subgroupId = null
          }
        }
      } else {
        // Это похоже на реальный ID подгруппы, проверяем его существование
        const subgroup = await prisma.subgroup.findUnique({
          where: { id: body.subgroupId }
        })
        
        if (subgroup) {
          subgroupId = body.subgroupId
        } else {
          // Если подгруппа не найдена, устанавливаем null
          subgroupId = null
        }
      }
    }

    const schedule = await prisma.schedule.create({
      data: {
        subjectId: body.subjectId,
        groupId: body.groupId,
        subgroupId: subgroupId,
        date: date,
        dayOfWeek: dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        location: body.location,
        eventType: body.eventType,
        description: body.description
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Логируем создание расписания
    await logActivity({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Schedule',
      entityId: schedule.id,
      request,
      details: {
        after: {
          id: schedule.id,
          subjectId: schedule.subjectId,
          groupId: schedule.groupId,
          date: schedule.date.toISOString(),
          startTime: schedule.startTime,
          endTime: schedule.endTime
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json(schedule, { status: 201 })

  } catch (error) {
    console.error('Ошибка при создании расписания:', error)
    
    // Логируем ошибку
    const session = await getServerSession(authOptions)
    if (session?.user) {
      await logActivity({
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'Schedule',
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

// PUT /api/schedules - обновление расписания
export async function PUT(request: NextRequest) {
  let body: any = null
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !['admin', 'lector'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID расписания обязателен' },
        { status: 400 }
      )
    }

    // Проверка существования расписания
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: body.id },
      select: {
        id: true,
        subjectId: true,
        groupId: true,
        date: true,
        startTime: true,
        endTime: true,
        location: true,
        isActive: true
      }
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Расписание не найдено' },
        { status: 404 }
      )
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
    
    if (body.subjectId !== undefined) updateData.subjectId = body.subjectId
    if (body.groupId !== undefined) updateData.groupId = body.groupId
    // Обрабатываем subgroupId
    if (body.subgroupId !== undefined) {
      // Если subgroupId пустой или равен 'none', устанавливаем null
      if (!body.subgroupId || body.subgroupId.trim() === '' || body.subgroupId === 'none') {
        updateData.subgroupId = null
      } else {
        // Проверяем, является ли это ID подгруппы или номер подгруппы
        if (body.subgroupId.length <= 4 && /^\d+$/.test(body.subgroupId)) {
          // Это номер подгруппы, пытаемся найти реальную подгруппу
          const subgroupNumber = parseInt(body.subgroupId, 10)
          const existingSchedule = await prisma.schedule.findUnique({
            where: { id: body.id },
            select: { groupId: true, subjectId: true }
          })
          
          if (existingSchedule?.groupId) {
            const subgroup = await prisma.subgroup.findFirst({
              where: {
                groupId: existingSchedule.groupId,
                number: subgroupNumber,
                OR: [
                  { subjectId: null },
                  { subjectId: existingSchedule.subjectId }
                ],
                isActive: true
              }
            })
            
            if (subgroup) {
              updateData.subgroupId = subgroup.id
            } else {
              updateData.subgroupId = null
            }
          } else {
            updateData.subgroupId = null
          }
        } else {
          // Это похоже на реальный ID подгруппы, проверяем его существование
          const subgroup = await prisma.subgroup.findUnique({
            where: { id: body.subgroupId }
          })
          
          if (subgroup) {
            updateData.subgroupId = body.subgroupId
          } else {
            updateData.subgroupId = null
          }
        }
      }
    }
    if (body.date) {
      const date = new Date(body.date)
      updateData.date = date
      updateData.dayOfWeek = date.getDay()
    }
    if (body.startTime !== undefined) updateData.startTime = body.startTime
    if (body.endTime !== undefined) updateData.endTime = body.endTime
    if (body.location !== undefined) updateData.location = body.location
    if (body.eventType !== undefined) updateData.eventType = body.eventType
    if (body.description !== undefined) updateData.description = body.description

    const schedule = await prisma.schedule.update({
      where: { id: body.id },
      data: updateData,
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Логируем обновление расписания
    await logActivity({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'Schedule',
      entityId: schedule.id,
      request,
      details: {
        before: {
          id: existingSchedule.id,
          subjectId: existingSchedule.subjectId,
          groupId: existingSchedule.groupId,
          date: existingSchedule.date.toISOString(),
          startTime: existingSchedule.startTime,
          endTime: existingSchedule.endTime,
          location: existingSchedule.location,
          isActive: existingSchedule.isActive
        },
        after: {
          id: schedule.id,
          subjectId: schedule.subjectId,
          groupId: schedule.groupId,
          date: schedule.date.toISOString(),
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          location: schedule.location
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json(schedule)

  } catch (error) {
    console.error('Ошибка при обновлении расписания:', error)
    
    // Логируем ошибку
    const session = await getServerSession(authOptions)
    if (session?.user && body?.id) {
      await logActivity({
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'Schedule',
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

// DELETE /api/schedules - мягкое удаление расписания
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['admin', 'lector'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID расписания обязателен' },
        { status: 400 }
      )
    }

    // Проверяем существование расписания
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id }
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Расписание не найдено' },
        { status: 404 }
      )
    }

    // Мягкое удаление - помечаем как неактивное
    await prisma.schedule.update({
      where: { id },
      data: { isActive: false }
    })

    // Логируем удаление расписания
    await logActivity({
      userId: session.user.id,
      action: 'DELETE',
      entityType: 'Schedule',
      entityId: id,
      request,
      details: {
        before: {
          id: existingSchedule.id,
          subjectId: existingSchedule.subjectId,
          groupId: existingSchedule.groupId,
          isActive: existingSchedule.isActive
        }
      },
      result: 'SUCCESS'
    })

    return NextResponse.json({ message: 'Расписание удалено' })

  } catch (error) {
    console.error('Ошибка при удалении расписания:', error)
    
    // Логируем ошибку
    const session = await getServerSession(authOptions)
    if (session?.user) {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      if (id) {
        await logActivity({
          userId: session.user.id,
          action: 'DELETE',
          entityType: 'Schedule',
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