/**
 * Common validation schemas used across the application
 */

import { z } from 'zod'

/**
 * CUID schema
 */
export const CuidSchema = z.string().cuid('Invalid ID format')

/**
 * Pagination schema
 */
export const PaginationSchema = z.object({
  page: z
    .string()
    .or(z.number())
    .transform((val) => (typeof val === 'string' ? parseInt(val) : val))
    .refine((val) => val >= 1, 'Page must be at least 1')
    .default(1),
  limit: z
    .string()
    .or(z.number())
    .transform((val) => (typeof val === 'string' ? parseInt(val) : val))
    .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
    .default(10),
})

export type PaginationParams = z.infer<typeof PaginationSchema>

/**
 * Search schema
 */
export const SearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  fields: z.array(z.string()).optional(),
})

export type SearchParams = z.infer<typeof SearchSchema>

/**
 * Date range schema
 */
export const DateRangeSchema = z
  .object({
    from: z
      .string()
      .or(z.date())
      .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
    to: z
      .string()
      .or(z.date())
      .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  })
  .refine((data) => data.from <= data.to, {
    message: 'From date must be before or equal to To date',
    path: ['to'],
  })

export type DateRange = z.infer<typeof DateRangeSchema>

/**
 * URL schema with optional http/https
 */
export const UrlSchema = z
  .string()
  .url('Must be a valid URL')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      } catch {
        return false
      }
    },
    { message: 'URL must use HTTP or HTTPS protocol' }
  )

/**
 * Boolean string schema (converts "true"/"false" strings to boolean)
 */
export const BooleanStringSchema = z
  .string()
  .transform((val) => val === 'true')
  .or(z.boolean())

/**
 * ID array schema (for multiple IDs in query params)
 */
export const IdArraySchema = z
  .string()
  .transform((val) => val.split(',').map((id) => id.trim()))
  .pipe(z.array(CuidSchema))
  .or(z.array(CuidSchema))
