import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { MentorMeetingsList } from '@/components/mentor/mentor-meetings-list'

export default async function MentorMeetingsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'mentor') {
    redirect('/login')
  }

  const mentorId = session.user.id

  // Получаем все встречи ментора
  const meetings = await prisma.mentorMeeting.findMany({
    where: {
      mentorId,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      scheduledAt: 'desc',
    },
  })

  // Преобразуем данные для компонента
  const meetingsData = meetings.map(meeting => ({
    ...meeting,
    scheduledAt: meeting.scheduledAt.toISOString(),
    createdAt: meeting.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Управление встречами</h1>
        <p className="text-muted-foreground mt-2">
          Просматривайте и управляйте встречами с вашими студентами
        </p>
      </div>

      <MentorMeetingsList
        meetings={meetingsData}
        mentorId={mentorId}
      />
    </div>
  )
}


