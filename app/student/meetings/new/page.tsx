import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MentorMeetingForm } from '@/components/student/mentor-meeting-form'

export default async function NewMeetingPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'student') {
    redirect('/login')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Запланировать встречу</h1>
        <p className="text-muted-foreground mt-2">
          Создайте запрос на встречу с вашим ментором
        </p>
      </div>

      <MentorMeetingForm studentId={session.user.id} />
    </div>
  )
}


