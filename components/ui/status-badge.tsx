'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { User, UserCheck, UserX, GraduationCap } from 'lucide-react'

type UserStatus = 'ACTIVE' | 'EXPELLED' | 'ACADEMIC_LEAVE'

interface StatusBadgeProps {
  status: UserStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = useTranslations()
  
  const statusConfig = {
    ACTIVE: {
      label: t('ui.statusBadge.active'),
      icon: UserCheck,
      className: 'bg-green-500 hover:bg-green-600 text-white'
    },
    EXPELLED: {
      label: t('ui.statusBadge.expelled'),
      icon: UserX,
      className: 'bg-red-500 hover:bg-red-600 text-white'
    },
    ACADEMIC_LEAVE: {
      label: t('ui.statusBadge.academicLeave'),
      icon: GraduationCap,
      className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
    }
  }

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
type UserRole = 'admin' | 'student' | 'lector' | 'mentor' | 'assistant' | 'co_lecturer' | 'education_office_head' | 'department_admin'

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const t = useTranslations()
  
  const roleConfig = {
    admin: {
      label: t('ui.statusBadge.roles.admin'),
      className: 'bg-blue-500 hover:bg-blue-600 text-white'
    },
    student: {
      label: t('ui.statusBadge.roles.student'),
      className: 'bg-green-500 hover:bg-green-600 text-white'
    },
    teacher: {
      label: t('ui.statusBadge.roles.teacher'),
      className: 'bg-purple-500 hover:bg-purple-600 text-white'
    },
    lector: {
      label: t('ui.statusBadge.roles.lector'),
      className: 'bg-purple-500 hover:bg-purple-600 text-white'
    },
    mentor: {
      label: t('ui.statusBadge.roles.mentor'),
      className: 'bg-orange-500 hover:bg-orange-600 text-white'
    },
    assistant: {
      label: t('ui.statusBadge.roles.assistant'),
      className: 'bg-indigo-500 hover:bg-indigo-600 text-white'
    },
    co_lecturer: {
      label: t('ui.statusBadge.roles.coLecturer'),
      className: 'bg-violet-500 hover:bg-violet-600 text-white'
    },
    education_office_head: {
      label: t('ui.statusBadge.roles.educationOfficeHead'),
      className: 'bg-cyan-500 hover:bg-cyan-600 text-white'
    },
    department_admin: {
      label: t('ui.statusBadge.roles.departmentAdmin'),
      className: 'bg-teal-500 hover:bg-teal-600 text-white'
    }
  }

  const config = roleConfig[role]

  return (
    <Badge className={cn(config.className, className)}>
      <User className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  )
}


