import { redirect } from 'next/navigation'

// Assistants manage homework through the lecturer pages: they share the
// SubjectLector-based API and the middleware lets assistants into /lector.
export default function AssistantHomeworkPage() {
  redirect('/lector/homework')
}
