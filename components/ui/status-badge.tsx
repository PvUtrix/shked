'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { User, UserCheck, UserX, GraduationCap } from 'lucide-react'

type UserStatus = 'ACTIVE' | 'EXPELLED' | 'ACADEMIC_LEAVE'

interface StatusBadgeProps {
  status: UserStatus
  className?: string
}

const statusConfig = {
  ACTIVE: {
    label: 'Активен',
    icon: UserCheck,
    className: 'bg-green-500 hover:bg-green-600 text-white'
  },
  EXPELLED: {
    label: 'Отчислен',
    icon: UserX,
    className: 'bg-red-500 hover:bg-red-600 text-white'
  },
  ACADEMIC_LEAVE: {
    label: 'Академ. отпуск',
    icon: GraduationCap,
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
  }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge className={cn(config.className, className)}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  )
}

// Компонент для отображения роли пользователя
type UserRole = 'admin' | 'student' | 'teacher' | 'mentor' | 'assistant' | 'co_teacher' | 'education_office_head' | 'department_admin'

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

const roleConfig = {
  admin: {
    label: 'Администратор',
    className: 'bg-blue-500 hover:bg-blue-600 text-white'
  },
  student: {
    label: 'Студент',
    className: 'bg-green-500 hover:bg-green-600 text-white'
  },
  teacher: {
    label: 'Преподаватель',
    className: 'bg-purple-500 hover:bg-purple-600 text-white'
  },
  mentor: {
    label: 'Ментор',
    className: 'bg-orange-500 hover:bg-orange-600 text-white'
  },
  assistant: {
    label: 'Ассистент',
    className: 'bg-indigo-500 hover:bg-indigo-600 text-white'
  },
  co_teacher: {
    label: 'Со-преподаватель',
    className: 'bg-violet-500 hover:bg-violet-600 text-white'
  },
  education_office_head: {
    label: 'Учебный отдел',
    className: 'bg-cyan-500 hover:bg-cyan-600 text-white'
  },
  department_admin: {
    label: 'Админ кафедры',
    className: 'bg-teal-500 hover:bg-teal-600 text-white'
  }
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role]

  return (
    <Badge className={cn(config.className, className)}>
      <User className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  )
}


