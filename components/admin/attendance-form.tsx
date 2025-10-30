'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AttendanceBadge } from '@/components/ui/attendance-badge'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

interface Student {
  id: string
  name: string
  firstName?: string | null
  lastName?: string | null
}

interface AttendanceFormProps {
  scheduleId: string
  students: Student[]
  initialData?: Record<string, {
    status: AttendanceStatus
    notes?: string
  }>
  onSuccess?: () => void
  onCancel?: () => void
}

export function AttendanceForm({
  scheduleId,
  students,
  initialData = {},
  onSuccess,
  onCancel,
}: AttendanceFormProps) {
  const [loading, setLoading] = useState(false)
  const [attendanceData, setAttendanceData] = useState<Record<string, {
    status: AttendanceStatus
    notes: string
  }>>(
    students.reduce((acc, student) => {
      acc[student.id] = initialData[student.id] || {
        status: 'PRESENT',
        notes: ''
      }
      return acc
    }, {} as Record<string, { status: AttendanceStatus; notes: string }>)
  )
  const router = useRouter()
  const { toast } = useToast()

  const updateStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }))
  }

  const updateStudentNotes = (studentId: string, notes: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }))
  }

  const markAllAs = (status: AttendanceStatus) => {
    setAttendanceData(prev => {
      const updated = { ...prev }
      students.forEach(student => {
        updated[student.id] = {
          ...updated[student.id],
          status
        }
      })
      return updated
    })
  }

  const onSubmit = async () => {
    setLoading(true)

    try {
      const attendanceList = students.map(student => ({
        userId: student.id,
        status: attendanceData[student.id].status,
        source: 'MANUAL' as const,
        notes: attendanceData[student.id].notes || undefined
      }))

      const response = await fetch(`/api/schedules/${scheduleId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attendanceList }),
      })

      if (!response.ok) {
        throw new Error('Ошибка при сохранении посещаемости')
      }

      toast({
        title: 'Успешно',
        description: 'Посещаемость сохранена',
      })

      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось сохранить посещаемость',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Быстрые действия */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => markAllAs('PRESENT')}
              disabled={loading}
            >
              Отметить всех присутствующими
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => markAllAs('ABSENT')}
              disabled={loading}
            >
              Отметить всех отсутствующими
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Список студентов */}
      <div className="space-y-4">
        {students.map((student) => (
          <Card key={student.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {student.name || `${student.firstName} ${student.lastName}`}
                  </div>
                  <AttendanceBadge status={attendanceData[student.id].status} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map((status) => (
                    <Button
                      key={status}
                      type="button"
                      variant={attendanceData[student.id].status === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateStudentStatus(student.id, status)}
                      disabled={loading}
                      className="w-full"
                    >
                      <AttendanceBadge status={status} className="scale-75" />
                    </Button>
                  ))}
                </div>

                <Textarea
                  placeholder="Примечание (опционально)"
                  value={attendanceData[student.id].notes}
                  onChange={(e) => updateStudentNotes(student.id, e.target.value)}
                  disabled={loading}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Кнопки действий */}
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Отмена
          </Button>
        )}
        <Button onClick={onSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Сохранить посещаемость
            </>
          )}
        </Button>
      </div>
    </div>
  )
}


