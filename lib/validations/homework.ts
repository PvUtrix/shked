/**
 * Homework validation schemas using Zod
 */

import { z } from 'zod'

/**
 * Homework status enum
 */
export const HomeworkStatusSchema = z.enum(['NOT_SUBMITTED', 'SUBMITTED', 'REVIEWED'])

export type HomeworkStatus = z.infer<typeof HomeworkStatusSchema>

/**
 * Material schema
 */
export const MaterialSchema = z.object({
  name: z.string().min(1, 'Material name is required'),
  url: z.string().url('Material URL must be a valid URL'),
  type: z.enum(['document', 'link', 'video', 'other']),
})

/**
 * Create homework schema
 */
export const CreateHomeworkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(5000, 'Description too long').optional(),
  content: z.string().max(50000, 'Content too long').optional(),
  taskUrl: z.string().url('Task URL must be valid').or(z.literal('')).optional(),
  deadline: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val))
    .refine((date) => date > new Date(), {
      message: 'Deadline must be in the future',
    }),
  materials: z.array(MaterialSchema).optional(),
  subjectId: z.string().cuid('Invalid subject ID'),
  groupId: z.string().cuid('Invalid group ID').optional(),
})

export type CreateHomeworkInput = z.infer<typeof CreateHomeworkSchema>

/**
 * Update homework schema
 */
export const UpdateHomeworkSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  content: z.string().max(50000).optional(),
  taskUrl: z.string().url().or(z.literal('')).optional(),
  deadline: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val))
    .optional(),
  materials: z.array(MaterialSchema).optional(),
  subjectId: z.string().cuid().optional(),
  groupId: z.string().cuid().or(z.literal('')).optional(),
  isActive: z.boolean().optional(),
})

export type UpdateHomeworkInput = z.infer<typeof UpdateHomeworkSchema>

/**
 * Submit homework schema
 */
export const SubmitHomeworkSchema = z.object({
  homeworkId: z.string().cuid('Invalid homework ID'),
  content: z.string().max(100000, 'Content too long').optional(),
  submissionUrl: z.string().url('Submission URL must be valid').or(z.literal('')).optional(),
})

export type SubmitHomeworkInput = z.infer<typeof SubmitHomeworkSchema>

/**
 * Review homework schema
 */
export const ReviewHomeworkSchema = z.object({
  submissionId: z.string().cuid('Invalid submission ID'),
  grade: z.number().int().min(1).max(100),
  comment: z.string().max(5000, 'Comment too long').optional(),
  feedback: z.string().max(50000, 'Feedback too long').optional(),
})

export type ReviewHomeworkInput = z.infer<typeof ReviewHomeworkSchema>

/**
 * Homework comment schema
 */
export const HomeworkCommentSchema = z.object({
  submissionId: z.string().cuid('Invalid submission ID'),
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
  startOffset: z.number().int().min(0),
  endOffset: z.number().int().min(0),
  selectedText: z.string().max(500, 'Selected text too long'),
})

export type HomeworkCommentInput = z.infer<typeof HomeworkCommentSchema>
