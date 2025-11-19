import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createExcelFile, createExcelResponse, ExcelColumn } from '@/lib/export/excel'
import { getFullName } from '@/lib/utils'

// GET /api/reports/grades/export - Экспорт отчёта по успеваемости в Excel
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
      return new Response('Нет прав для экспорта отчётов', { status: 403 })
    }

    // Получить параметры фильтрации
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const subjectId = searchParams.get('subjectId')
    const studentId = searchParams.get('studentId')

    // Построить where условие для домашних заданий
    const homeworkWhere: any = {}

    if (subjectId) {
      homeworkWhere.homework = { subjectId }
    }

    if (studentId) {
      homeworkWhere.userId = studentId
    } else if (groupId) {
      homeworkWhere.user = { groupId }
    }

    // Получить оценки по домашним заданиям
    const homeworkGrades = await prisma.homeworkSubmission.findMany({
      where: {
        ...homeworkWhere,
        status: 'REVIEWED',
        grade: { not: null },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
            group: {
              select: {
                name: true,
              },
            },
          },
        },
        homework: {
          select: {
            title: true,
            deadline: true,
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ user: { lastName: 'asc' } }, { reviewedAt: 'desc' }],
    })

    // Построить where условие для экзаменов
    const examWhere: any = {}

    if (subjectId) {
      examWhere.exam = { subjectId }
    }

    if (studentId) {
      examWhere.userId = studentId
    } else if (groupId) {
      examWhere.exam = { ...(examWhere.exam || {}), groupId }
    }

    // Получить оценки по экзаменам
    const examGrades = await prisma.examResult.findMany({
      where: {
        ...examWhere,
        status: { in: ['PASSED', 'FAILED'] },
        grade: { not: null },
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
            group: {
              select: {
                name: true,
              },
            },
          },
        },
        exam: {
          select: {
            type: true,
            date: true,
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ student: { lastName: 'asc' } }, { takenAt: 'desc' }],
    })

    // Объединить данные
    const exportData: any[] = []

    // Добавить оценки по домашним заданиям
    homeworkGrades.forEach((record) => {
      exportData.push({
        studentName: getFullName(record.user) || record.user.email,
        group: record.user.group?.name || '-',
        subject: record.homework.subject.name,
        type: 'Домашнее задание',
        title: record.homework.title,
        date: record.homework.deadline,
        grade: record.grade,
        submittedAt: record.submittedAt,
        reviewedAt: record.reviewedAt,
      })
    })

    // Добавить оценки по экзаменам
    examGrades.forEach((record) => {
      exportData.push({
        studentName: getFullName(record.student) || record.student.email,
        group: record.student.group?.name || '-',
        subject: record.exam.subject.name,
        type: getExamTypeLabel(record.exam.type),
        title: getExamTypeLabel(record.exam.type),
        date: record.exam.date,
        grade: record.grade,
        submittedAt: record.takenAt,
        reviewedAt: record.takenAt,
      })
    })

    // Сортировать по студенту и дате
    exportData.sort((a, b) => {
      const nameCompare = a.studentName.localeCompare(b.studentName)
      if (nameCompare !== 0) return nameCompare
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    // Определить колонки
    const columns: ExcelColumn[] = [
      { header: 'Студент', key: 'studentName', width: 30 },
      { header: 'Группа', key: 'group', width: 15 },
      { header: 'Предмет', key: 'subject', width: 30 },
      { header: 'Тип', key: 'type', width: 20 },
      { header: 'Название', key: 'title', width: 30 },
      { header: 'Дата', key: 'date', width: 12 },
      { header: 'Оценка', key: 'grade', width: 10 },
      { header: 'Сдано', key: 'submittedAt', width: 18 },
      { header: 'Проверено', key: 'reviewedAt', width: 18 },
    ]

    // Создать Excel файл
    const buffer = await createExcelFile(exportData, columns, 'Успеваемость')

    // Сформировать имя файла
    const today = new Date().toISOString().split('T')[0]
    const filename = `Успеваемость_${today}.xlsx`

    // Вернуть файл для скачивания
    return createExcelResponse(buffer, filename)
  } catch (error) {
    console.error('Ошибка при экспорте отчёта по успеваемости:', error)
    return new Response('Ошибка при экспорте отчёта', { status: 500 })
  }
}

// Вспомогательная функция для форматирования типа экзамена
function getExamTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    EXAM: 'Экзамен',
    CREDIT: 'Зачёт',
    DIFF_CREDIT: 'Дифференцированный зачёт',
  }
  return typeMap[type] || type
}
