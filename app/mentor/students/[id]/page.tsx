import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { StudentProfileView } from '@/components/mentor/student-profile-view'
import { notFound } from 'next/navigation'

export default async function StudentProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'mentor') {
    redirect('/login')
  }

  const studentId = params.id

  // Получаем полную информацию о студенте
  const student = await prisma.user.findUnique({
    where: {
      id: studentId,
      role: 'student',
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
      studentAttendance: {
        select: {
          id: true,
          status: true,
        },
      },
      studentExams: {
        include: {
          exam: {
            include: {
              subject: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      studentMeetings: {
        where: {
          mentorId: session.user.id,
        },
        select: {
          id: true,
          scheduledAt: true,
          status: true,
        },
      },
    },
  })

  if (!student) {
    notFound()
  }

  // Подсчитываем статистику посещаемости
  const attendanceStats = {
    total: student.studentAttendance.length,
    present: student.studentAttendance.filter(a => a.status === 'PRESENT').length,
    absent: student.studentAttendance.filter(a => a.status === 'ABSENT').length,
    late: student.studentAttendance.filter(a => a.status === 'LATE').length,
    excused: student.studentAttendance.filter(a => a.status === 'EXCUSED').length,
  }

  // Форматируем экзамены
  const exams = student.studentExams.map(se => ({
    id: se.id,
    subject: {
      name: se.exam.subject.name,
    },
    grade: se.grade,
    status: se.status,
  }))

  // Форматируем встречи
  const meetings = student.studentMeetings.map(m => ({
    id: m.id,
    scheduledAt: m.scheduledAt.toISOString(),
    status: m.status,
  }))

  const studentData = {
    id: student.id,
    name: student.name || '',
    email: student.email,
    status: student.status,
    group: student.group,
    attendance: attendanceStats,
    exams,
    meetings,
  }

  return (
    <div className="space-y-6">
      <StudentProfileView
        student={studentData as any}
      />
    </div>
  )
}
