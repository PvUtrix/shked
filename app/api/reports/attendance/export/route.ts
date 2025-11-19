import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createExcelFile, createExcelResponse, ExcelColumn } from '@/lib/export/excel'
import { getFullName } from '@/lib/utils'

// GET /api/reports/attendance/export - Экспорт отчёта по посещаемости в Excel
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Построить where условие
    const where: any = {}

    if (groupId) {
      where.schedule = { groupId }
    }

    if (subjectId) {
      if (where.schedule) {
        where.schedule.subjectId = subjectId
      } else {
        where.schedule = { subjectId }
      }
    }

    if (studentId) {
      where.userId = studentId
    }

    if (startDate || endDate) {
      if (where.schedule) {
        where.schedule.date = {}
      } else {
        where.schedule = { date: {} }
      }

      if (startDate) {
        where.schedule.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.schedule.date.lte = new Date(endDate)
      }
    }

    // Получить данные посещаемости
    const attendanceRecords = await prisma.attendance.findMany({
      where,
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
        schedule: {
          select: {
            date: true,
            startTime: true,
            endTime: true,
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ schedule: { date: 'asc' } }, { student: { lastName: 'asc' } }],
    })

    // Подготовить данные для экспорта
    const exportData = attendanceRecords.map((record) => ({
      studentName: getFullName(record.student) || record.student.email,
      group: record.student.group?.name || '-',
      subject: record.schedule.subject.name,
      date: record.schedule.date,
      time: `${record.schedule.startTime} - ${record.schedule.endTime}`,
      status: getStatusLabel(record.status),
      source: getSourceLabel(record.source || ''),
      markedAt: record.markedAt,
    }))

    // Определить колонки
    const columns: ExcelColumn[] = [
      { header: 'Студент', key: 'studentName', width: 30 },
      { header: 'Группа', key: 'group', width: 15 },
      { header: 'Предмет', key: 'subject', width: 30 },
      { header: 'Дата', key: 'date', width: 12 },
      { header: 'Время', key: 'time', width: 15 },
      { header: 'Статус', key: 'status', width: 15 },
      { header: 'Источник', key: 'source', width: 15 },
      { header: 'Отмечено', key: 'markedAt', width: 18 },
    ]

    // Создать Excel файл
    const buffer = await createExcelFile(exportData, columns, 'Посещаемость')

    // Сформировать имя файла
    const today = new Date().toISOString().split('T')[0]
    const filename = `Посещаемость_${today}.xlsx`

    // Вернуть файл для скачивания
    return createExcelResponse(buffer, filename)
  } catch (error) {
    console.error('Ошибка при экспорте отчёта по посещаемости:', error)
    return new Response('Ошибка при экспорте отчёта', { status: 500 })
  }
}

// Вспомогательные функции для форматирования
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    PRESENT: 'Присутствовал',
    ABSENT: 'Отсутствовал',
    LATE: 'Опоздал',
    EXCUSED: 'Уважительная причина',
  }
  return statusMap[status] || status
}

function getSourceLabel(source: string): string {
  const sourceMap: Record<string, string> = {
    MANUAL: 'Вручную',
    ZOOM_AUTO: 'Zoom (авто)',
    VISUAL: 'Визуальный контроль',
  }
  return sourceMap[source] || source
}
