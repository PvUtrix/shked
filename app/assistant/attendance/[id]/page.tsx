import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AttendanceTracker } from '@/components/assistant/attendance-tracker'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default async function AttendanceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'assistant') {
    redirect('/login')
  }

  const userId = session.user.id
  const scheduleId = params.id

  // Verify access and get schedule data
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      subject: {
        include: {
          assistants: {
            where: {
              userId,
              isActive: true,
            },
          },
        },
      },
      group: {
        include: {
          users: {
            where: {
              isActive: true,
              status: 'ACTIVE',
            },
            select: {
              id: true,
              name: true,
              email: true,
              firstName: true,
              lastName: true,
            },
            orderBy: {
              lastName: 'asc',
            },
          },
        },
      },
      attendance: true,
    },
  })

  if (!schedule) {
    notFound()
  }

  // Check if assistant has access to this subject
  if (schedule.subject.assistants.length === 0) {
    redirect('/assistant/attendance')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/assistant/attendance">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Отметка посещаемости</h1>
          <p className="text-muted-foreground mt-1">
            {schedule.subject.name}
          </p>
        </div>
      </div>

      {/* Schedule Info */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о занятии</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{schedule.group?.name || 'Без группы'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(schedule.date), 'EEEE, d MMMM yyyy', {
                  locale: ru,
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {schedule.startTime} - {schedule.endTime}
              </span>
            </div>
            {schedule.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{schedule.location}</span>
              </div>
            )}
          </div>
          {schedule.description && (
            <p className="mt-4 text-sm text-muted-foreground">
              {schedule.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Attendance Tracker */}
      {schedule.group ? (
        <AttendanceTracker
          scheduleId={scheduleId}
          students={schedule.group.users}
          existingAttendance={schedule.attendance.map((att) => ({
            userId: att.userId,
            status: att.status as any,
            notes: att.notes,
          }))}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Нет студентов в группе для отметки посещаемости
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
