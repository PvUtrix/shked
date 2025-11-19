'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

interface Student {
  id: string
  name: string | null
  email: string
  firstName: string | null
  lastName: string | null
}

interface AttendanceRecord {
  userId: string
  status: AttendanceStatus
  notes?: string
}

interface AttendanceTrackerProps {
  scheduleId: string
  students: Student[]
  existingAttendance: {
    userId: string
    status: AttendanceStatus
    notes: string | null
  }[]
  onSave?: () => void
}

const statusConfig = {
  PRESENT: {
    label: 'Присутствовал',
    icon: CheckCircle2,
    color: 'bg-green-500',
  },
  ABSENT: {
    label: 'Отсутствовал',
    icon: XCircle,
    color: 'bg-red-500',
  },
  LATE: {
    label: 'Опоздал',
    icon: Clock,
    color: 'bg-yellow-500',
  },
  EXCUSED: {
    label: 'Уважительная причина',
    icon: AlertCircle,
    color: 'bg-blue-500',
  },
}

export function AttendanceTracker({
  scheduleId,
  students,
  existingAttendance,
  onSave,
}: AttendanceTrackerProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(
    () => {
      const map = new Map()
      existingAttendance.forEach((att) => {
        map.set(att.userId, {
          userId: att.userId,
          status: att.status,
          notes: att.notes || '',
        })
      })
      return map
    }
  )

  const updateAttendance = (userId: string, status: AttendanceStatus) => {
    const newAttendance = new Map(attendance)
    newAttendance.set(userId, {
      userId,
      status,
      notes: attendance.get(userId)?.notes || '',
    })
    setAttendance(newAttendance)
  }

  const updateNotes = (userId: string, notes: string) => {
    const current = attendance.get(userId)
    if (current) {
      const newAttendance = new Map(attendance)
      newAttendance.set(userId, { ...current, notes })
      setAttendance(newAttendance)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const attendanceRecords = Array.from(attendance.values()).filter(
        (record) => record.status !== undefined
      )

      if (attendanceRecords.length === 0) {
        toast({
          title: 'Ошибка',
          description: 'Отметьте посещаемость хотя бы одного студента',
          variant: 'destructive',
        })
        return
      }

      const response = await fetch('/api/assistant/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId,
          attendanceRecords,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save attendance')
      }

      toast({
        title: 'Успешно',
        description: `Посещаемость отмечена для ${attendanceRecords.length} студентов`,
      })

      onSave?.()
    } catch (error) {
      console.error('Error saving attendance:', error)
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить посещаемость',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const markAll = (status: AttendanceStatus) => {
    const newAttendance = new Map(attendance)
    students.forEach((student) => {
      newAttendance.set(student.id, {
        userId: student.id,
        status,
        notes: attendance.get(student.id)?.notes || '',
      })
    })
    setAttendance(newAttendance)
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Быстрая отметка</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAll('PRESENT')}
              disabled={saving}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Все присутствуют
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAll('ABSENT')}
              disabled={saving}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Все отсутствуют
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <div className="space-y-3">
        {students.map((student) => {
          const studentAttendance = attendance.get(student.id)
          const studentName =
            student.name ||
            `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
            student.email

          return (
            <Card key={student.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{studentName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {student.email}
                      </p>
                    </div>
                  </div>

                  {/* Status Buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(Object.keys(statusConfig) as AttendanceStatus[]).map(
                      (status) => {
                        const config = statusConfig[status]
                        const Icon = config.icon
                        const isSelected = studentAttendance?.status === status

                        return (
                          <Button
                            key={status}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateAttendance(student.id, status)}
                            disabled={saving}
                            className={
                              isSelected
                                ? `${config.color} hover:${config.color} text-white`
                                : ''
                            }
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {config.label}
                          </Button>
                        )
                      }
                    )}
                  </div>

                  {/* Notes */}
                  {studentAttendance && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Заметки (опционально)
                      </label>
                      <Textarea
                        placeholder="Добавьте заметку..."
                        value={studentAttendance.notes || ''}
                        onChange={(e) =>
                          updateNotes(student.id, e.target.value)
                        }
                        disabled={saving}
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? 'Сохранение...' : 'Сохранить посещаемость'}
        </Button>
      </div>
    </div>
  )
}
