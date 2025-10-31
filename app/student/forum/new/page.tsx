import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForumTopicForm } from '@/components/student/forum-topic-form'

export default async function NewForumTopicPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'student') {
    redirect('/login')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Создать новую тему</h1>
        <p className="text-muted-foreground mt-2">
          Задайте вопрос или начните обсуждение
        </p>
      </div>

      <ForumTopicForm />
    </div>
  )
}


