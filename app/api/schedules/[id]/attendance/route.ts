import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/schedules/[id]/attendance - Получить список посещаемости занятия
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        scheduleId: params.id
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        marker: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        markedAt: 'desc'
      }
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Ошибка при получении посещаемости:', error)
    return NextResponse.json(
      { error: 'Не удалось получить посещаемость' },
      { status: 500 }
    )
  }
}

// POST /api/schedules/[id]/attendance - Отметить посещаемость (массовая отметка)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверка прав доступа
    if (!['admin', 'teacher', 'assistant'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { attendanceList } = body
    // attendanceList: [{ userId, status, notes?, source? }]

    if (!Array.isArray(attendanceList) || attendanceList.length === 0) {
      return NextResponse.json(
        { error: 'Не указана посещаемость' },
        { status: 400 }
      )
    }

    // Проверка существования занятия
    const schedule = await prisma.schedule.findUnique({
      where: { id: params.id }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Занятие не найдено' },
        { status: 404 }
      )
    }

    // Создание/обновление записей посещаемости
    const results = await Promise.all(
      attendanceList.map(async (item: any) => {
        const { userId, status, notes, source } = item

        // Проверка существования записи
        const existing = await prisma.attendance.findUnique({
          where: {
            scheduleId_userId: {
              scheduleId: params.id,
              userId
            }
          }
        })

        if (existing) {
          // Обновление
          return prisma.attendance.update({
            where: { id: existing.id },
            data: {
              status,
              notes: notes || existing.notes,
              source: source || existing.source,
              markedBy: session.user.id,
              markedAt: new Date()
            },
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          })
        } else {
          // Создание
          return prisma.attendance.create({
            data: {
              scheduleId: params.id,
              userId,
              status,
              notes: notes || null,
              source: source || 'MANUAL',
              markedBy: session.user.id
            },
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          })
        }
      })
    )

    return NextResponse.json({
      message: `Отмечено студентов: ${results.length}`,
      attendance: results
    }, { status: 201 })
  } catch (error) {
    console.error('Ошибка при отметке посещаемости:', error)
    return NextResponse.json(
      { error: 'Не удалось отметить посещаемость' },
      { status: 500 }
    )
  }
}


