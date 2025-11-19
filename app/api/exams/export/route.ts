import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createExcelFile, createExcelResponse, ExcelColumn } from '@/lib/export/excel'
import { getFullName } from '@/lib/utils'

// GET /api/exams/export?examId=xxx - Экспорт экзаменационной ведомости в Excel
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new Response('Необходима авторизация', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return new Response('Пользователь не найден', { status: 404 })
    }

    // Проверка прав доступа
    const allowedRoles = ['admin', 'lector', 'department_admin', 'education_office_head']
    if (!allowedRoles.includes(user.role)) {
      return new Response('Нет прав для экспорта ведомостей', { status: 403 })
    }

    // Получить ID экзамена
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')

    if (!examId) {
      return new Response('Не указан ID экзамена', { status: 400 })
    }

    // Получить информацию об экзамене
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        subject: {
          select: {
            name: true,
          },
        },
        group: {
          select: {
            name: true,
            semester: true,
            year: true,
          },
        },
        results: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                middleName: true,
                email: true,
              },
            },
          },
          orderBy: {
            student: {
              lastName: 'asc',
            },
          },
        },
      },
    })

    if (!exam) {
      return new Response('Экзамен не найден', { status: 404 })
    }

    // Получить всех студентов группы
    const allStudents = await prisma.user.findMany({
      where: {
        groupId: exam.groupId,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        email: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    })

    // Создать Map результатов для быстрого доступа
    const resultsMap = new Map(
      exam.results.map((result) => [result.userId, result])
    )

    // Подготовить данные для экспорта (все студенты, включая тех, кто не сдавал)
    const exportData = allStudents.map((student, index) => {
      const result = resultsMap.get(student.id)
      return {
        number: index + 1,
        studentName: getFullName(student) || student.email,
        grade: result?.grade || '',
        status: result ? getStatusLabel(result.status) : 'Не сдавал',
        takenAt: result?.takenAt || null,
        notes: result?.notes || '',
      }
    })

    // Определить колонки
    const columns: ExcelColumn[] = [
      { header: '№', key: 'number', width: 5 },
      { header: 'ФИО студента', key: 'studentName', width: 35 },
      { header: 'Оценка', key: 'grade', width: 10 },
      { header: 'Статус', key: 'status', width: 15 },
      { header: 'Дата сдачи', key: 'takenAt', width: 18 },
      { header: 'Примечания', key: 'notes', width: 30 },
    ]

    // Создать Excel файл
    const sheetName = `${getExamTypeLabel(exam.type)} - ${exam.subject.name}`
    const buffer = await createExcelFile(exportData, columns, sheetName.substring(0, 31)) // Максимум 31 символ для названия листа

    // Сформировать имя файла
    const examDate = new Date(exam.date).toISOString().split('T')[0]
    const filename = `Ведомость_${exam.subject.name.replace(/[^\w\s]/gi, '')}_${exam.group.name}_${examDate}.xlsx`

    // Вернуть файл для скачивания
    return createExcelResponse(buffer, filename)
  } catch (error) {
    console.error('Ошибка при экспорте ведомости:', error)
    return new Response('Ошибка при экспорте ведомости', { status: 500 })
  }
}

// Вспомогательные функции
function getExamTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    EXAM: 'Экзамен',
    CREDIT: 'Зачёт',
    DIFF_CREDIT: 'Дифф. зачёт',
  }
  return typeMap[type] || type
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    NOT_TAKEN: 'Не сдавал',
    PASSED: 'Сдал',
    FAILED: 'Не сдал',
  }
  return statusMap[status] || status
}
