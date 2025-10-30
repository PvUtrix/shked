'use client'

import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

interface AttendanceBadgeProps {
  status: AttendanceStatus
  className?: string
  showIcon?: boolean
}

const statusConfig = {
  PRESENT: {
    label: 'Присутствовал',
    shortLabel: 'П',
    icon: CheckCircle2,
    variant: 'default' as const,
    className: 'bg-green-500 hover:bg-green-600 text-white'
  },
  ABSENT: {
    label: 'Отсутствовал',
    shortLabel: 'О',
    icon: XCircle,
    variant: 'destructive' as const,
    className: 'bg-red-500 hover:bg-red-600 text-white'
  },
  LATE: {
    label: 'Опоздал',
    shortLabel: 'Оп',
    icon: Clock,
    variant: 'secondary' as const,
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
  },
  EXCUSED: {
    label: 'Уважительная причина',
    shortLabel: 'У',
    icon: AlertCircle,
    variant: 'outline' as const,
    className: 'bg-blue-500 hover:bg-blue-600 text-white'
  }
}

export function AttendanceBadge({
  status,
  className,
  showIcon = true
}: AttendanceBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.shortLabel}
    </Badge>
  )
}

// Компонент для полного отображения с описанием
export function AttendanceBadgeFull({
  status,
  className,
}: AttendanceBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, 'px-3 py-1', className)}
    >
      <Icon className="mr-2 h-4 w-4" />
      {config.label}
    </Badge>
  )
}

// Статистика посещаемости
interface AttendanceStatsProps {
  stats: {
    present: number
    absent: number
    late: number
    excused: number
    total: number
  }
  className?: string
}

export function AttendanceStats({ stats, className }: AttendanceStatsProps) {
  const percentage = stats.total > 0
    ? Math.round((stats.present / stats.total) * 100)
    : 0

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Посещаемость</span>
        <span className="text-2xl font-bold">{percentage}%</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm">{stats.present}</span>
        </div>
        <div className="flex items-center space-x-1">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm">{stats.absent}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4 text-yellow-500" />
          <span className="text-sm">{stats.late}</span>
        </div>
        <div className="flex items-center space-x-1">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <span className="text-sm">{stats.excused}</span>
        </div>
      </div>

      {/* Прогресс бар */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}


