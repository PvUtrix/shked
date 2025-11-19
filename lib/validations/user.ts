/**
 * User validation schemas using Zod
 */

import { z } from 'zod'

/**
 * User roles enum
 */
export const UserRoleSchema = z.enum([
  'admin',
  'student',
  'lector',
  'mentor',
  'assistant',
  'co_lecturer',
  'education_office_head',
  'department_admin',
])

export type UserRole = z.infer<typeof UserRoleSchema>

/**
 * User sex enum
 */
export const UserSexSchema = z.enum(['male', 'female']).nullable()

/**
 * SNILS validation (11 digits)
 */
export const SnilsSchema = z
  .string()
  .regex(/^\d{11}$/, 'SNILS must be exactly 11 digits')
  .or(z.literal(''))
  .nullable()
  .optional()

/**
 * Password validation schema
 */
export const PasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  )

/**
 * Email validation schema
 */
export const EmailSchema = z.string().email('Invalid email address').toLowerCase()

/**
 * Birthday validation schema
 */
export const BirthdaySchema = z
  .date()
  .max(new Date(), 'Birthday cannot be in the future')
  .refine(
    (date) => {
      const today = new Date()
      const minDate = new Date(today)
      minDate.setFullYear(today.getFullYear() - 10)
      return date <= minDate
    },
    { message: 'User must be at least 10 years old' }
  )
  .refine(
    (date) => {
      const today = new Date()
      const maxDate = new Date(today)
      maxDate.setFullYear(today.getFullYear() - 150)
      return date >= maxDate
    },
    { message: 'User cannot be more than 150 years old' }
  )
  .nullable()
  .optional()

/**
 * Name validation schema (for first name, last name, middle name)
 */
export const NameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-Zа-яА-ЯёЁ\s-]+$/, 'Name can only contain letters, spaces, and hyphens')
  .trim()

/**
 * Create user schema
 */
export const CreateUserSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  firstName: NameSchema.optional(),
  lastName: NameSchema.optional(),
  middleName: NameSchema.optional(),
  birthday: z
    .string()
    .transform((str) => (str ? new Date(str) : null))
    .pipe(BirthdaySchema)
    .optional(),
  snils: SnilsSchema,
  sex: UserSexSchema.optional(),
  role: UserRoleSchema.default('student'),
  groupId: z.string().cuid().optional(),
  mustChangePassword: z.boolean().default(false),
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>

/**
 * Update user schema (all fields optional except id)
 */
export const UpdateUserSchema = z.object({
  id: z.string().cuid(),
  email: EmailSchema.optional(),
  password: PasswordSchema.optional(),
  firstName: NameSchema.or(z.literal('')).optional(),
  lastName: NameSchema.or(z.literal('')).optional(),
  middleName: NameSchema.or(z.literal('')).optional(),
  birthday: z
    .string()
    .transform((str) => (str ? new Date(str) : null))
    .pipe(BirthdaySchema)
    .optional(),
  snils: SnilsSchema,
  sex: UserSexSchema.optional(),
  role: UserRoleSchema.optional(),
  groupId: z.string().cuid().or(z.literal('')).optional(),
  mustChangePassword: z.boolean().optional(),
})

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>

/**
 * User query parameters schema
 */
export const UserQuerySchema = z.object({
  role: UserRoleSchema.optional(),
  mentor: z.string().transform((val) => val === 'true').optional(),
  groupId: z.string().cuid().optional(),
  includeInactive: z.string().transform((val) => val === 'true').optional(),
  page: z.string().transform((val) => parseInt(val) || 1).optional(),
  limit: z.string().transform((val) => Math.min(parseInt(val) || 10, 100)).optional(),
})

export type UserQueryParams = z.infer<typeof UserQuerySchema>

/**
 * Change password schema
 */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: PasswordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>

/**
 * Login schema
 */
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof LoginSchema>
