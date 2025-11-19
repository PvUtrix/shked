import { z } from 'zod'

/**
 * Common validation schemas
 */
export const idSchema = z.string().cuid('Invalid ID format')

export const emailSchema = z.string().email('Invalid email address')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')

export const dateSchema = z.coerce.date()

export const optionalStringSchema = z.string().optional()

export const booleanSchema = z.boolean()

/**
 * User role validation
 */
export const userRoleSchema = z.enum([
  'admin',
  'student',
  'lector',
  'mentor',
  'assistant',
  'co_lecturer',
  'education_office_head',
  'department_admin',
])

/**
 * User status validation
 */
export const userStatusSchema = z.enum(['ACTIVE', 'EXPELLED', 'ACADEMIC_LEAVE'])

/**
 * User validation schemas
 */
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  middleName: z.string().optional(),
  birthday: dateSchema.optional(),
  snils: z.string().regex(/^\d{11}$/, 'SNILS must be 11 digits').optional(),
  sex: z.enum(['male', 'female']).optional(),
  role: userRoleSchema.default('student'),
  groupId: idSchema.optional(),
  canHelp: z.string().optional(),
  lookingFor: z.string().optional(),
  status: userStatusSchema.default('ACTIVE'),
  mustChangePassword: z.boolean().default(false).optional(),
})

export const updateUserSchema = createUserSchema
  .partial()
  .extend({
    id: idSchema,
  })
  .omit({ password: true })

export const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

/**
 * Group validation schemas
 */
export const createGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  semester: z.string().optional(),
  year: z.string().optional(),
})

export const updateGroupSchema = createGroupSchema.partial().extend({
  id: idSchema,
})

/**
 * Subject validation schemas
 */
export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  instructor: z.string().optional(),
})

export const updateSubjectSchema = createSubjectSchema.partial().extend({
  id: idSchema,
})

/**
 * Schedule validation schemas
 */
export const createScheduleSchema = z.object({
  subjectId: idSchema,
  groupId: idSchema.optional(),
  subgroupId: idSchema.optional(),
  date: dateSchema,
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  location: z.string().optional(),
  eventType: z.string().optional(),
  description: z.string().optional(),
  videoUrl: z.string().url().optional(),
  zoomMeetingId: z.string().optional(),
})

export const updateScheduleSchema = createScheduleSchema.partial().extend({
  id: idSchema,
})

/**
 * Homework validation schemas
 */
export const createHomeworkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content: z.string().optional(),
  taskUrl: z.string().url().optional(),
  deadline: dateSchema,
  materials: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string().optional(),
  })).optional(),
  subjectId: idSchema,
  groupId: idSchema.optional(),
})

export const updateHomeworkSchema = createHomeworkSchema.partial().extend({
  id: idSchema,
})

/**
 * Homework submission validation schemas
 */
export const submitHomeworkSchema = z.object({
  homeworkId: idSchema,
  content: z.string().optional(),
  submissionUrl: z.string().url().optional(),
})

export const reviewHomeworkSchema = z.object({
  submissionId: idSchema,
  grade: z.number().int().min(1).max(100).optional(),
  comment: z.string().optional(),
  feedback: z.string().optional(),
  status: z.enum(['NOT_SUBMITTED', 'SUBMITTED', 'REVIEWED']),
})

/**
 * Homework comment validation schemas
 */
export const createHomeworkCommentSchema = z.object({
  submissionId: idSchema,
  content: z.string().min(1, 'Comment cannot be empty'),
  startOffset: z.number().int().min(0),
  endOffset: z.number().int().min(0),
  selectedText: z.string(),
})

export const updateHomeworkCommentSchema = z.object({
  id: idSchema,
  content: z.string().min(1, 'Comment cannot be empty').optional(),
  resolved: z.boolean().optional(),
})

/**
 * Exam validation schemas
 */
export const createExamSchema = z.object({
  subjectId: idSchema,
  groupId: idSchema,
  type: z.enum(['EXAM', 'CREDIT', 'DIFF_CREDIT']),
  format: z.enum(['ORAL', 'WRITTEN', 'MIXED']),
  date: dateSchema,
  location: z.string().optional(),
  description: z.string().optional(),
})

export const updateExamSchema = createExamSchema.partial().extend({
  id: idSchema,
})

/**
 * Exam result validation schemas
 */
export const createExamResultSchema = z.object({
  examId: idSchema,
  userId: idSchema,
  grade: z.string().optional(),
  status: z.enum(['NOT_TAKEN', 'PASSED', 'FAILED']).default('NOT_TAKEN'),
  notes: z.string().optional(),
})

export const updateExamResultSchema = createExamResultSchema.partial().extend({
  id: idSchema,
})

/**
 * Attendance validation schemas
 */
export const createAttendanceSchema = z.object({
  scheduleId: idSchema,
  userId: idSchema,
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  source: z.enum(['MANUAL', 'ZOOM_AUTO', 'VISUAL']).optional(),
  notes: z.string().optional(),
})

export const updateAttendanceSchema = createAttendanceSchema.partial().extend({
  id: idSchema,
})

/**
 * Mentor meeting validation schemas
 */
export const createMentorMeetingSchema = z.object({
  mentorId: idSchema,
  studentId: idSchema,
  scheduledAt: dateSchema,
  duration: z.number().int().min(15).max(480), // 15 min to 8 hours
  agenda: z.string().optional(),
  location: z.string().optional(),
  meetingType: z.enum(['VKR', 'ACADEMIC', 'PERSONAL', 'OTHER']).optional(),
})

export const updateMentorMeetingSchema = createMentorMeetingSchema
  .partial()
  .extend({
    id: idSchema,
    status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
    notes: z.string().optional(),
  })

/**
 * Forum validation schemas
 */
export const createForumTopicSchema = z.object({
  subjectId: idSchema.optional(),
  groupId: idSchema.optional(),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
})

export const updateForumTopicSchema = z.object({
  id: idSchema,
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  isPinned: z.boolean().optional(),
  isClosed: z.boolean().optional(),
})

export const createForumPostSchema = z.object({
  topicId: idSchema,
  content: z.string().min(1, 'Content is required'),
})

export const updateForumPostSchema = z.object({
  id: idSchema,
  content: z.string().min(1, 'Content is required'),
})

/**
 * Subgroup validation schemas
 */
export const createSubgroupSchema = z.object({
  groupId: idSchema,
  subjectId: idSchema.optional(),
  name: z.string().min(1, 'Name is required'),
  number: z.number().int().min(1),
  description: z.string().optional(),
})

export const updateSubgroupSchema = createSubgroupSchema.partial().extend({
  id: idSchema,
})

/**
 * Document validation schemas
 */
export const createDocumentSchema = z.object({
  subjectId: idSchema,
  type: z.enum(['RPD', 'ANNOTATION', 'MATERIALS']),
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().url('Invalid file URL'),
  fileSize: z.number().int().positive().optional(),
})

/**
 * External resource validation schemas
 */
export const createExternalResourceSchema = z.object({
  subjectId: idSchema.optional(),
  scheduleId: idSchema.optional(),
  type: z.enum(['EOR', 'ZOOM', 'CHAT', 'MIRO', 'EXCEL', 'VIDEO', 'OTHER']),
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Invalid URL'),
  description: z.string().optional(),
})

export const updateExternalResourceSchema = createExternalResourceSchema
  .partial()
  .extend({
    id: idSchema,
  })

/**
 * Query parameter validation schemas
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const filterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  role: userRoleSchema.optional(),
  groupId: idSchema.optional(),
  subjectId: idSchema.optional(),
  isActive: z.coerce.boolean().optional(),
})

/**
 * User query validation schema for API endpoints
 */
export const userQuerySchema = z.object({
  role: userRoleSchema.optional(),
  groupId: idSchema.optional(),
  includeInactive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

// PascalCase exports for backward compatibility
export const CreateUserSchema = createUserSchema
export const UserQuerySchema = userQuerySchema
