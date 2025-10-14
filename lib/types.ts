export type Expense = {
  id: string
  amount: number
  category: string
  description: string
  date: Date
}

export type ExpenseFormData = Omit<Expense, 'id' | 'date'> & {
  date: string
}

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Education',
  'Other'
] as const

export type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

// Типы для модуля домашних заданий
export type Homework = {
  id: string
  title: string
  description?: string
  taskUrl?: string
  deadline: Date
  materials?: any[] // Дополнительные материалы
  subjectId: string
  groupId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  subject?: {
    id: string
    name: string
    instructor?: string
  }
  group?: {
    id: string
    name: string
  }
  submissions?: HomeworkSubmission[]
}

export type HomeworkSubmission = {
  id: string
  homeworkId: string
  userId: string
  submissionUrl?: string
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'REVIEWED'
  grade?: number
  comment?: string
  submittedAt?: Date
  reviewedAt?: Date
  createdAt: Date
  updatedAt: Date
  homework?: Homework
  user?: {
    id: string
    name?: string
    firstName?: string
    lastName?: string
    email: string
  }
}

export type HomeworkFormData = {
  title: string
  description?: string
  taskUrl?: string
  deadline: string
  materials?: Array<{
    name: string
    url: string
    type: 'document' | 'video' | 'link' | 'other'
  }>
  subjectId: string
  groupId?: string
}

export type HomeworkSubmissionFormData = {
  submissionUrl: string
}

export type HomeworkReviewFormData = {
  grade?: number
  comment?: string
}

export const HOMEWORK_STATUSES = {
  NOT_SUBMITTED: 'Не сдано',
  SUBMITTED: 'Сдано',
  REVIEWED: 'Проверено'
} as const

export const HOMEWORK_MATERIAL_TYPES = {
  document: 'Документ',
  video: 'Видео',
  link: 'Ссылка',
  other: 'Другое'
} as const

// Типы для предметов и групп
export type Subject = {
  id: string
  name: string
  instructor?: string
  description?: string
  lectorId?: string
  createdAt: Date
  updatedAt: Date
  _count?: {
    schedules?: number
    homework?: number
  }
  lector?: {
    id: string
    name?: string
    firstName?: string
    lastName?: string
    email: string
  }
}

export type Group = {
  id: string
  name: string
  description?: string
  semester?: string
  year?: string
  createdAt: Date
  updatedAt: Date
  _count?: {
    users?: number
    schedules?: number
    homework?: number
  }
}