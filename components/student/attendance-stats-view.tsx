'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AttendanceStats, AttendanceBadge } from '@/components/ui/attendance-badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

interface AttendanceRecord {
  id: string
  status: AttendanceStatus
  markedAt: string
  notes?: string | null
  schedule: {
    id: string
    date: string
    startTime: string
    subject: {
      id: string
      name: string
    }
    group: {
      id: string
      name: string
    }
  }
}

interface SubjectStats {
  subjectId: string
  subjectName: string
  total: number
  present: number
  absent: number
  late: number
  excused: number
  percentage: number
}

interface AttendanceStatsViewProps {
  attendance: AttendanceRecord[]
  className?: string
}

export function AttendanceStatsView({ attendance, className }: AttendanceStatsViewProps) {
  // Общая статистика
  const totalStats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'PRESENT').length,
    absent: attendance.filter(a => a.status === 'ABSENT').length,
    late: attendance.filter(a => a.status === 'LATE').length,
    excused: attendance.filter(a => a.status === 'EXCUSED').length,
  }

  // Статистика по предметам
  const subjectStatsMap = new Map<string, SubjectStats>()
  
  attendance.forEach(record => {
    const subjectId = record.schedule.subject.id
    const subjectName = record.schedule.subject.name
    
    if (!subjectStatsMap.has(subjectId)) {
      subjectStatsMap.set(subjectId, {
        subjectId,
        subjectName,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        percentage: 0,
      })
    }
    
    const stats = subjectStatsMap.get(subjectId)!
    stats.total++
    
    if (record.status === 'PRESENT') stats.present++
    if (record.status === 'ABSENT') stats.absent++
    if (record.status === 'LATE') stats.late++
    if (record.status === 'EXCUSED') stats.excused++
    
    stats.percentage = Math.round((stats.present / stats.total) * 100)
  })
  
  const subjectStats = Array.from(subjectStatsMap.values()).sort(
    (a, b) => b.percentage - a.percentage
  )

  // Последние занятия
  const recentAttendance = [...attendance]
    .sort((a, b) => new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime())
    .slice(0, 10)

  return (
    <div className={className}>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="by-subject">По предметам</TabsTrigger>
          <TabsTrigger value="recent">Последние занятия</TabsTrigger>
        </TabsList>

        {/* Обзор */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Общая посещаемость</CardTitle>
              <CardDescription>
                Статистика за весь период
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceStats stats={totalStats} />
            </CardContent>
          </Card>

          {subjectStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Топ предметов по посещаемости</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subjectStats.slice(0, 5).map((subject) => (
                  <div key={subject.subjectId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{subject.subjectName}</span>
                      <span className="text-muted-foreground">
                        {subject.percentage}% ({subject.present}/{subject.total})
                      </span>
                    </div>
                    <Progress value={subject.percentage} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* По предметам */}
        <TabsContent value="by-subject">
          <Card>
            <CardHeader>
              <CardTitle>Посещаемость по предметам</CardTitle>
              <CardDescription>
                Детальная статистика по каждому предмету
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Предмет</TableHead>
                    <TableHead className="text-center">Присутствовал</TableHead>
                    <TableHead className="text-center">Отсутствовал</TableHead>
                    <TableHead className="text-center">Опоздал</TableHead>
                    <TableHead className="text-center">Уважит.</TableHead>
                    <TableHead className="text-right">Процент</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectStats.map((subject) => (
                    <TableRow key={subject.subjectId}>
                      <TableCell className="font-medium">
                        {subject.subjectName}
                      </TableCell>
                      <TableCell className="text-center">
                        {subject.present}
                      </TableCell>
                      <TableCell className="text-center">
                        {subject.absent}
                      </TableCell>
                      <TableCell className="text-center">
                        {subject.late}
                      </TableCell>
                      <TableCell className="text-center">
                        {subject.excused}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={
                          subject.percentage >= 80 ? 'text-green-600 font-semibold' :
                          subject.percentage >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }>
                          {subject.percentage}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Последние занятия */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Последние занятия</CardTitle>
              <CardDescription>
                История посещаемости
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Предмет</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Примечание</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {format(new Date(record.schedule.date), 'dd MMM yyyy', { locale: ru })}
                        <div className="text-xs text-muted-foreground">
                          {record.schedule.startTime}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.schedule.subject.name}
                      </TableCell>
                      <TableCell>
                        <AttendanceBadge status={record.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


