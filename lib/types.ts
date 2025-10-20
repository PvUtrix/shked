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
  content?: string  // MDX контент задания
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
  content?: string  // MDX контент работы студента
  submissionUrl?: string
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'REVIEWED'
  grade?: number
  comment?: string  // Комментарий преподавателя (MDX)
  feedback?: string // Развернутая обратная связь (MDX)
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
  content?: string  // MDX контент задания
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
  content?: string  // MDX контент работы студента
  submissionUrl?: string
}

export type HomeworkReviewFormData = {
  grade?: number
  comment?: string  // Комментарий преподавателя (MDX)
  feedback?: string  // Развернутая обратная связь (MDX)
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

// Типы для форм CRUD операций
export type GroupFormData = {
  name: string
  description?: string
  semester?: string
  year?: string
}

export type SubjectFormData = {
  name: string
  description?: string
  instructor?: string
  lectorId?: string
}

export type UserFormData = {
  email: string
  password?: string // Только для создания
  name?: string
  firstName?: string
  lastName?: string
  role: 'admin' | 'student' | 'lector' | 'mentor'
  groupId?: string
}

export type ScheduleFormData = {
  subjectId: string
  groupId?: string
  subgroupId?: string
  date: string // ISO date string
  startTime: string
  endTime: string
  location?: string
  eventType?: string
  description?: string
}

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