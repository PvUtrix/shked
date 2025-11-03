'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Award, XCircle } from 'lucide-react'

type ExamStatus = 'NOT_TAKEN' | 'PASSED' | 'FAILED'

interface ExamGradeBadgeProps {
  grade?: string | null
  status: ExamStatus
  className?: string
}

const gradeColors = {
  '5': 'bg-green-600 hover:bg-green-700',
  '4': 'bg-green-500 hover:bg-green-600',
  '3': 'bg-yellow-500 hover:bg-yellow-600',
  '2': 'bg-red-500 hover:bg-red-600',
  'ЗАЧЕТ': 'bg-green-500 hover:bg-green-600',
  'НЕ ЗАЧЕТ': 'bg-red-500 hover:bg-red-600'
}

export function ExamGradeBadge({ grade, status, className }: ExamGradeBadgeProps) {
  const t = useTranslations()
  
  if (status === 'NOT_TAKEN') {
    return (
      <Badge variant="outline" className={cn('text-muted-foreground', className)}>
        {t('ui.examGradeBadge.notTaken')}
      </Badge>
    )
  }

  if (status === 'FAILED' || grade === '2' || grade === 'НЕ ЗАЧЕТ') {
    return (
      <Badge className={cn('bg-red-500 hover:bg-red-600 text-white', className)}>
        <XCircle className="mr-1 h-3 w-3" />
        {grade || t('ui.examGradeBadge.failed')}
      </Badge>
    )
  }

  const colorClass = grade ? gradeColors[grade as keyof typeof gradeColors] : 'bg-green-500'

  return (
    <Badge className={cn(colorClass, 'text-white', className)}>
      <Award className="mr-1 h-3 w-3" />
      {grade}
    </Badge>
  )
}

// Компонент для отображения средней оценки
interface AverageGradeProps {
  grades: (string | null)[]
  className?: string
}

export function AverageGrade({ grades, className }: AverageGradeProps) {
  const t = useTranslations()
  
  const numericGrades = grades
    .filter((g) => g && !isNaN(Number(g)))
    .map((g) => Number(g))

  if (numericGrades.length === 0) {
    return (
      <div className={cn('text-muted-foreground', className)}>
        {t('ui.examGradeBadge.noGrades')}
      </div>
    )
  }

  const average = numericGrades.reduce((sum, g) => sum + g, 0) / numericGrades.length
  const rounded = Math.round(average * 100) / 100

  const colorClass = 
    rounded >= 4.5 ? 'text-green-600' :
    rounded >= 3.5 ? 'text-green-500' :
    rounded >= 3.0 ? 'text-yellow-500' :
    'text-red-500'

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <span className="text-sm text-muted-foreground">{t('ui.examGradeBadge.averageGrade')}</span>
      <span className={cn('text-2xl font-bold', colorClass)}>
        {rounded.toFixed(2)}
      </span>
    </div>
  )
}


