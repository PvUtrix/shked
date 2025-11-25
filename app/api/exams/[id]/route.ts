import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/exams/[id] - Получить экзамен
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
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
        },
        results: {
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
            recorder: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Экзамен не найден' }, { status: 404 })
    }

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Ошибка при получении экзамена:', error)
    return NextResponse.json(
      { error: 'Не удалось получить экзамен' },
      { status: 500 }
    )
  }
}

// PATCH /api/exams/[id] - Обновить экзамен
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверка прав доступа
    if (!['admin', 'lector'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { type, format, date, location, description } = body

    const exam = await prisma.exam.update({
      where: { id: examId },
      data: {
        ...(type && { type }),
        ...(format && { format }),
        ...(date && { date: new Date(date) }),
        ...(location !== undefined && { location }),
        ...(description !== undefined && { description })
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

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Ошибка при обновлении экзамена:', error)
    return NextResponse.json(
      { error: 'Не удалось обновить экзамен' },
      { status: 500 }
    )
  }
}

// DELETE /api/exams/[id] - Удалить экзамен
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверка прав доступа
    if (!['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Мягкое удаление
    await prisma.exam.update({
      where: { id: examId },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Экзамен удален' })
  } catch (error) {
    console.error('Ошибка при удалении экзамена:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить экзамен' },
      { status: 500 }
    )
  }
}


