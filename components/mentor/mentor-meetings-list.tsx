'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Calendar, Clock, MapPin, User, FileText, CheckCircle2, XCircle, Edit } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MarkdownViewer } from '@/components/ui/markdown-viewer'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

type MeetingStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
type MeetingType = 'VKR' | 'ACADEMIC' | 'PERSONAL' | 'OTHER'

interface Meeting {
  id: string
  scheduledAt: string
  duration: number
  status: MeetingStatus
  agenda: string
  notes?: string | null
  location?: string | null
  meetingType: MeetingType
  createdAt: string
  student: {
    id: string
    name: string
    email: string
  }
}

interface MentorMeetingsListProps {
  meetings: Meeting[]
  mentorId: string
  onUpdate?: () => void
}

const statusConfig = {
  SCHEDULED: {
    label: 'Запланирована',
    color: 'bg-blue-500',
    icon: Calendar,
  },
  COMPLETED: {
    label: 'Проведена',
    color: 'bg-green-500',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Отменена',
    color: 'bg-red-500',
    icon: XCircle,
  },
}

const typeConfig = {
  VKR: 'ВКР',
  ACADEMIC: 'Академическая',
  PERSONAL: 'Личная',
  OTHER: 'Другое',
}

export function MentorMeetingsList({ meetings, mentorId, onUpdate }: MentorMeetingsListProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [notes, setNotes] = useState('')
  const [updating, setUpdating] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const scheduledMeetings = meetings.filter(m => m.status === 'SCHEDULED')
  const completedMeetings = meetings.filter(m => m.status === 'COMPLETED')
  const cancelledMeetings = meetings.filter(m => m.status === 'CANCELLED')

  const handleUpdateStatus = async (meetingId: string, status: MeetingStatus) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/mentor-meetings/${meetingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error('Ошибка при обновлении статуса')

      toast({
        title: 'Успешно',
        description: 'Статус встречи обновлен',
      })

      router.refresh()
      onUpdate?.()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveNotes = async (meetingId: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/mentor-meetings/${meetingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes, status: 'COMPLETED' }),
      })

      if (!response.ok) throw new Error('Ошибка при сохранении заметок')

      toast({
        title: 'Успешно',
        description: 'Заметки сохранены',
      })

      setSelectedMeeting(null)
      setNotes('')
      router.refresh()
      onUpdate?.()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить заметки',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
    const statusInfo = statusConfig[meeting.status]
    const StatusIcon = statusInfo.icon

    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                {meeting.student.name}
              </CardTitle>
              <CardDescription>{meeting.student.email}</CardDescription>
            </div>
            <Badge className={`${statusInfo.color} text-white`}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(meeting.scheduledAt), 'dd MMMM yyyy', { locale: ru })}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(meeting.scheduledAt), 'HH:mm')} ({meeting.duration} мин)
            </div>
            {meeting.location && (
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <MapPin className="h-4 w-4" />
                {meeting.location}
              </div>
            )}
          </div>

          <div>
            <Badge variant="outline">{typeConfig[meeting.meetingType]}</Badge>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Повестка:</p>
            <p className="text-sm text-muted-foreground">{meeting.agenda}</p>
          </div>

          {meeting.notes && (
            <div>
              <p className="text-sm font-medium mb-2">Заметки:</p>
              <MarkdownViewer content={meeting.notes} />
            </div>
          )}

          {meeting.status === 'SCHEDULED' && (
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSelectedMeeting(meeting)
                      setNotes(meeting.notes || '')
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Завершить встречу
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Завершить встречу</DialogTitle>
                    <DialogDescription>
                      Добавьте заметки о проведенной встрече
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Заметки о встрече (поддерживается Markdown)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={10}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedMeeting(null)}
                        disabled={updating}
                      >
                        Отмена
                      </Button>
                      <Button
                        onClick={() => handleSaveNotes(meeting.id)}
                        disabled={updating}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Сохранить
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus(meeting.id, 'CANCELLED')}
                disabled={updating}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Отменить
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="scheduled" className="space-y-4">
      <TabsList>
        <TabsTrigger value="scheduled">
          Запланированные ({scheduledMeetings.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Проведенные ({completedMeetings.length})
        </TabsTrigger>
        <TabsTrigger value="cancelled">
          Отмененные ({cancelledMeetings.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="scheduled" className="space-y-4">
        {scheduledMeetings.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Нет запланированных встреч
              </p>
            </CardContent>
          </Card>
        ) : (
          scheduledMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))
        )}
      </TabsContent>

      <TabsContent value="completed" className="space-y-4">
        {completedMeetings.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Нет проведенных встреч
              </p>
            </CardContent>
          </Card>
        ) : (
          completedMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))
        )}
      </TabsContent>

      <TabsContent value="cancelled" className="space-y-4">
        {cancelledMeetings.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Нет отмененных встреч
              </p>
            </CardContent>
          </Card>
        ) : (
          cancelledMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))
        )}
      </TabsContent>
    </Tabs>
  )
}


