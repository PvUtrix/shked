import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/exams/[id]/results - Получить результаты экзамена
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const results = await prisma.examResult.findMany({
      where: {
        examId: params.id
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
        recorder: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { status: 'desc' }, // PASSED, NOT_TAKEN, FAILED
        { student: { lastName: 'asc' } }
      ]
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('Ошибка при получении результатов:', error)
    return NextResponse.json(
      { error: 'Не удалось получить результаты' },
      { status: 500 }
    )
  }
}

// POST /api/exams/[id]/results - Внести результат для студента
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
    if (!['admin', 'lector'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, grade, status, notes } = body

    // Валидация
    if (!userId || !status) {
      return NextResponse.json(
        { error: 'Не все обязательные поля заполнены' },
        { status: 400 }
      )
    }

    // Проверка существования экзамена
    const exam = await prisma.exam.findUnique({
      where: { id: params.id }
    })

    if (!exam) {
      return NextResponse.json(
        { error: 'Экзамен не найден' },
        { status: 404 }
      )
    }

    // Проверка существующего результата
    const existing = await prisma.examResult.findUnique({
      where: {
        examId_userId: {
          examId: params.id,
          userId
        }
      }
    })

    let result

    if (existing) {
      // Обновление существующего результата
      result = await prisma.examResult.update({
        where: { id: existing.id },
        data: {
          grade: grade || null,
          status,
          notes: notes || null,
          takenAt: status === 'PASSED' || status === 'FAILED' ? new Date() : null,
          recordedBy: session.user.id
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
      // Создание нового результата
      result = await prisma.examResult.create({
        data: {
          examId: params.id,
          userId,
          grade: grade || null,
          status,
          notes: notes || null,
          takenAt: status === 'PASSED' || status === 'FAILED' ? new Date() : null,
          recordedBy: session.user.id
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

    return NextResponse.json(result, { status: existing ? 200 : 201 })
  } catch (error) {
    console.error('Ошибка при внесении результата:', error)
    return NextResponse.json(
      { error: 'Не удалось внести результат' },
      { status: 500 }
    )
  }
}


