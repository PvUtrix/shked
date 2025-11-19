import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Users, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

async function getAssistantSchedule(userId: string) {
  const response = await fetch(
    `${process.env.NEXTAUTH_URL}/api/assistant/schedule`,
    {
      headers: {
        cookie: `next-auth.session-token=${userId}`,
      },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch schedule')
  }

  return response.json()
}

export default async function AssistantSchedulePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'assistant') {
    redirect('/login')
  }

  // For now, we'll fetch data directly with Prisma since we're server-side
  const { prisma } = await import('@/lib/db')

  const userId = session.user.id

  // Get assistant assignments
  const assignments = await prisma.subjectAssistant.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      subject: true,
    },
  })

  const subjectIds = assignments.map((a) => a.subjectId)

  // Get upcoming schedules
  const now = new Date()
  const schedules = await prisma.schedule.findMany({
    where: {
      subjectId: {
        in: subjectIds,
      },
      date: {
        gte: now,
      },
      isActive: true,
    },
    include: {
      subject: true,
      group: true,
      subgroup: true,
      attendance: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
    take: 20,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Расписание</h1>
        <p className="text-muted-foreground mt-2">
          Ваши занятия в качестве ассистента
        </p>
      </div>

      {/* Assigned Subjects */}
      <Card>
        <CardHeader>
          <CardTitle>Назначенные предметы</CardTitle>
          <CardDescription>
            Предметы, в которых вы выступаете в роли ассистента
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Вы пока не назначены ассистентом ни на один предмет
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignments.map((assignment) => (
                <Badge key={assignment.id} variant="secondary" className="text-sm">
                  <BookOpen className="mr-1 h-3 w-3" />
                  {assignment.subject.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Schedule */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Ближайшие занятия</h2>
        {schedules.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Нет запланированных занятий
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {schedule.subject.name}
                      </CardTitle>
                      <CardDescription>
                        {schedule.group?.name || 'Без группы'}
                        {schedule.subgroup && ` • ${schedule.subgroup.name}`}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={schedule.attendance.length > 0 ? 'default' : 'outline'}
                    >
                      {schedule.attendance.length > 0
                        ? 'Посещаемость отмечена'
                        : 'Ожидает отметки'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(schedule.date), 'EEEE, d MMMM yyyy', {
                          locale: ru,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {schedule.startTime} - {schedule.endTime}
                      </span>
                    </div>
                    {schedule.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{schedule.location}</span>
                      </div>
                    )}
                    {schedule.eventType && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{schedule.eventType}</Badge>
                      </div>
                    )}
                  </div>
                  {schedule.description && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {schedule.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
