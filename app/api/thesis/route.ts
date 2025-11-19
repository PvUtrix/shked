import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Схема валидации для создания/обновления ВКР
const thesisSchema = z.object({
  studentId: z.string().optional(),
  supervisorId: z.string().optional(),
  title: z.string().min(1, 'Название обязательно'),
  abstract: z.string().optional(),
  status: z.enum(['IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DEFENDED']).optional(),
  milestones: z.array(z.object({
    id: z.string(),
    name: z.string(),
    deadline: z.string(),
    status: z.string(),
    completedAt: z.string().nullable().optional(),
    description: z.string().optional(),
  })).optional(),
  artifacts: z.array(z.object({
    id: z.string(),
    type: z.string(),
    url: z.string(),
    uploadedAt: z.string(),
    description: z.string().optional(),
    fileName: z.string(),
  })).optional(),
  defenseDate: z.string().optional(),
  grade: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/thesis - Получить список ВКР или конкретную ВКР
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const supervisorId = searchParams.get('supervisorId')

    // Построить условия запроса
    const where: any = {}

    // Студент может видеть только свою ВКР
    if (user.role === 'student') {
      where.studentId = user.id
    } else if (user.role === 'mentor') {
      // Ментор видит ВКР своих студентов
      if (supervisorId) {
        where.supervisorId = supervisorId
      } else {
        where.supervisorId = user.id
      }
    } else if (['admin', 'education_office_head', 'department_admin'].includes(user.role)) {
      // Администраторы могут фильтровать по студенту или руководителю
      if (studentId) {
        where.studentId = studentId
      }
      if (supervisorId) {
        where.supervisorId = supervisorId
      }
    } else {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const theses = await prisma.thesis.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
            groupId: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ theses })
  } catch (error) {
    console.error('Ошибка при получении ВКР:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении ВКР' },
      { status: 500 }
    )
  }
}

// POST /api/thesis - Создать новую ВКР
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Только admin, mentor и сам студент могут создавать ВКР
    if (!['admin', 'student', 'mentor'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Недостаточно прав для создания ВКР' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = thesisSchema.parse(body)

    // Определить ID студента
    let studentId = validatedData.studentId
    if (user.role === 'student') {
      studentId = user.id // Студент создаёт ВКР для себя
    }

    if (!studentId) {
      return NextResponse.json(
        { error: 'Не указан ID студента' },
        { status: 400 }
      )
    }

    // Проверить, нет ли уже ВКР для этого студента
    const existingThesis = await prisma.thesis.findUnique({
      where: { studentId },
    })

    if (existingThesis) {
      return NextResponse.json(
        { error: 'У студента уже есть ВКР' },
        { status: 400 }
      )
    }

    // Определить ID научного руководителя
    let supervisorId = validatedData.supervisorId
    if (!supervisorId && user.role === 'mentor') {
      supervisorId = user.id
    }

    if (!supervisorId) {
      return NextResponse.json(
        { error: 'Не указан научный руководитель' },
        { status: 400 }
      )
    }

    // Создать ВКР
    const thesis = await prisma.thesis.create({
      data: {
        studentId,
        supervisorId,
        title: validatedData.title,
        abstract: validatedData.abstract,
        status: validatedData.status || 'IN_PROGRESS',
        milestones: validatedData.milestones || [],
        artifacts: validatedData.artifacts || [],
        defenseDate: validatedData.defenseDate ? new Date(validatedData.defenseDate) : null,
        grade: validatedData.grade,
        notes: validatedData.notes,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
          },
        },
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ thesis }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Ошибка при создании ВКР:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании ВКР' },
      { status: 500 }
    )
  }
}

// PUT /api/thesis?id=xxx - Обновить ВКР
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const thesisId = searchParams.get('id')

    if (!thesisId) {
      return NextResponse.json({ error: 'Не указан ID ВКР' }, { status: 400 })
    }

    const existingThesis = await prisma.thesis.findUnique({
      where: { id: thesisId },
    })

    if (!existingThesis) {
      return NextResponse.json({ error: 'ВКР не найдена' }, { status: 404 })
    }

    // Проверка прав доступа
    const canEdit =
      user.role === 'admin' ||
      user.id === existingThesis.studentId ||
      user.id === existingThesis.supervisorId

    if (!canEdit) {
      return NextResponse.json({ error: 'Нет прав на редактирование' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = thesisSchema.parse(body)

    // Обновить ВКР
    const thesis = await prisma.thesis.update({
      where: { id: thesisId },
      data: {
        title: validatedData.title !== undefined ? validatedData.title : existingThesis.title,
        abstract: validatedData.abstract !== undefined ? validatedData.abstract : existingThesis.abstract,
        status: validatedData.status !== undefined ? validatedData.status : existingThesis.status,
        milestones: validatedData.milestones !== undefined ? validatedData.milestones : existingThesis.milestones,
        artifacts: validatedData.artifacts !== undefined ? validatedData.artifacts : existingThesis.artifacts,
        defenseDate: validatedData.defenseDate !== undefined ? (validatedData.defenseDate ? new Date(validatedData.defenseDate) : null) : existingThesis.defenseDate,
        grade: validatedData.grade !== undefined ? validatedData.grade : existingThesis.grade,
        notes: validatedData.notes !== undefined ? validatedData.notes : existingThesis.notes,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
          },
        },
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ thesis })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Ошибка при обновлении ВКР:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении ВКР' },
      { status: 500 }
    )
  }
}

// DELETE /api/thesis?id=xxx - Удалить ВКР
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Только admin может удалять ВКР
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Недостаточно прав для удаления ВКР' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const thesisId = searchParams.get('id')

    if (!thesisId) {
      return NextResponse.json({ error: 'Не указан ID ВКР' }, { status: 400 })
    }

    await prisma.thesis.delete({
      where: { id: thesisId },
    })

    return NextResponse.json({ message: 'ВКР успешно удалена' })
  } catch (error) {
    console.error('Ошибка при удалении ВКР:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении ВКР' },
      { status: 500 }
    )
  }
}
