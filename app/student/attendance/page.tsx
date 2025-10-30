import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AttendanceStatsView } from '@/components/student/attendance-stats-view'

export default async function StudentAttendancePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'student') {
    redirect('/login')
  }

  const studentId = session.user.id

  // Получаем данные о посещаемости студента
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      studentId,
    },
    include: {
      schedule: {
        include: {
          subject: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Подсчитываем общую статистику
  const stats = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter(a => a.status === 'PRESENT').length,
    absent: attendanceRecords.filter(a => a.status === 'ABSENT').length,
    late: attendanceRecords.filter(a => a.status === 'LATE').length,
    excused: attendanceRecords.filter(a => a.status === 'EXCUSED').length,
  }

  // Группируем по предметам
  const bySubject = attendanceRecords.reduce((acc, record) => {
    const subjectName = record.schedule.subject.name
    if (!acc[subjectName]) {
      acc[subjectName] = {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      }
    }
    acc[subjectName].total++
    acc[subjectName][record.status.toLowerCase() as 'present' | 'absent' | 'late' | 'excused']++
    return acc
  }, {} as Record<string, typeof stats>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Моя посещаемость</h1>
        <p className="text-muted-foreground mt-2">
          Статистика посещения занятий
        </p>
      </div>

      <AttendanceStatsView
        stats={stats}
        bySubject={bySubject}
      />
    </div>
  )
}


