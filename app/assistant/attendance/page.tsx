import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AssistantAttendancePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'assistant') {
    redirect('/login')
  }

  const userId = session.user.id

  // Get assistant assignments
  const assignments = await prisma.subjectAssistant.findMany({
    where: {
      userId,
      isActive: true,
    },
  })

  const subjectIds = assignments.map((a) => a.subjectId)

  // Get recent and upcoming schedules
  const now = new Date()
  const twoDaysAgo = new Date(now)
  twoDaysAgo.setDate(now.getDate() - 2)

  const schedules = await prisma.schedule.findMany({
    where: {
      subjectId: {
        in: subjectIds,
      },
      date: {
        gte: twoDaysAgo,
      },
      isActive: true,
    },
    include: {
      subject: true,
      group: {
        include: {
          users: {
            select: {
              id: true,
            },
          },
        },
      },
      attendance: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
    take: 30,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Управление посещаемостью</h1>
        <p className="text-muted-foreground mt-2">
          Отметка посещаемости студентов на занятиях
        </p>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Нет доступных занятий для отметки посещаемости
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => {
            const totalStudents = schedule.group?.users.length || 0
            const markedStudents = schedule.attendance.length
            const isComplete = markedStudents === totalStudents && totalStudents > 0
            const isPast = new Date(schedule.date) < now

            return (
              <Card key={schedule.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {schedule.subject.name}
                      </CardTitle>
                      <CardDescription>
                        {schedule.group?.name || 'Без группы'}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={isComplete ? 'default' : isPast ? 'destructive' : 'secondary'}
                    >
                      {isComplete
                        ? 'Завершено'
                        : isPast
                        ? 'Требует внимания'
                        : 'Ожидает'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
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
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm">
                        <span className="font-medium">Посещаемость:</span>{' '}
                        <span className={markedStudents === 0 ? 'text-muted-foreground' : ''}>
                          {markedStudents} / {totalStudents} отмечено
                        </span>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/assistant/attendance/${schedule.id}`}>
                          {markedStudents === 0 ? 'Отметить' : 'Редактировать'}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
