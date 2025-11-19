'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { AttendanceStats } from '@/components/ui/attendance-badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { ExamGradeBadge, AverageGrade } from '@/components/ui/exam-grade-badge'
import { Mail, Calendar, Users, BookOpen, Award, TrendingUp } from 'lucide-react'

type UserStatus = 'ACTIVE' | 'EXPELLED' | 'ACADEMIC_LEAVE'

interface Student {
  id: string
  name: string
  email: string
  status: UserStatus
  group?: {
    id: string
    name: string
  }
  attendance?: {
    total: number
    present: number
    absent: number
    late: number
    excused: number
  }
  exams?: Array<{
    id: string
    subject: {
      name: string
    }
    grade?: string | null
    status: string
  }>
  meetings?: Array<{
    id: string
    scheduledAt: string
    status: string
  }>
}

interface StudentProfileViewProps {
  student: Student
  mentorId: string
}

export function StudentProfileView({ student, _mentorId }: StudentProfileViewProps) {
  const initials = student.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  const scheduledMeetings = student.meetings?.filter(m => m.status === 'SCHEDULED').length || 0
  const completedMeetings = student.meetings?.filter(m => m.status === 'COMPLETED').length || 0

  const grades = student.exams?.map(e => e.grade).filter((g): g is string => g !== null && g !== undefined) || []
  const passedExams = student.exams?.filter(e => e.status === 'PASSED').length || 0
  const totalExams = student.exams?.length || 0

  return (
    <div className="space-y-6">
      {/* Основная информация */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{student.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {student.email}
                </CardDescription>
                {student.group && (
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Users className="h-4 w-4" />
                    {student.group.name}
                  </CardDescription>
                )}
              </div>
            </div>
            <StatusBadge status={student.status} />
          </div>
        </CardHeader>
      </Card>

      {/* Быстрая статистика */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Встречи</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedMeetings}</div>
            <p className="text-xs text-muted-foreground">
              Запланировано: {scheduledMeetings}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Посещаемость</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {student.attendance
                ? Math.round((student.attendance.present / student.attendance.total) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {student.attendance?.present || 0} из {student.attendance?.total || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Экзамены</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passedExams}</div>
            <p className="text-xs text-muted-foreground">
              Сдано из {totalExams}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Детальная информация */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendance">Посещаемость</TabsTrigger>
          <TabsTrigger value="exams">Экзамены</TabsTrigger>
          <TabsTrigger value="meetings">История встреч</TabsTrigger>
        </TabsList>

        {/* Посещаемость */}
        <TabsContent value="attendance">
          {student.attendance ? (
            <Card>
              <CardHeader>
                <CardTitle>Статистика посещаемости</CardTitle>
                <CardDescription>
                  Общая посещаемость за период
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceStats stats={student.attendance} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Нет данных о посещаемости
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Экзамены */}
        <TabsContent value="exams">
          <Card>
            <CardHeader>
              <CardTitle>Результаты экзаменов</CardTitle>
              <CardDescription>
                Оценки и статусы сдачи
              </CardDescription>
            </CardHeader>
            <CardContent>
              {student.exams && student.exams.length > 0 ? (
                <div className="space-y-4">
                  <AverageGrade grades={grades} />
                  <div className="space-y-2">
                    {student.exams.map((exam) => (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{exam.subject.name}</span>
                        </div>
                        <ExamGradeBadge
                          grade={exam.grade}
                          status={exam.status as any}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  Нет данных об экзаменах
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* История встреч */}
        <TabsContent value="meetings">
          <Card>
            <CardHeader>
              <CardTitle>История встреч</CardTitle>
              <CardDescription>
                Проведенные встречи с ментором
              </CardDescription>
            </CardHeader>
            <CardContent>
              {student.meetings && student.meetings.length > 0 ? (
                <div className="space-y-2">
                  {student.meetings
                    .filter(m => m.status === 'COMPLETED')
                    .map((meeting) => (
                      <div
                        key={meeting.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(meeting.scheduledAt).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <Badge variant="outline">Проведена</Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  Нет проведенных встреч
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


