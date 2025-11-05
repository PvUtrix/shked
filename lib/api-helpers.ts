import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ApiErrors } from '@/lib/api-error'
import { Session } from 'next-auth'

/**
 * User roles in the system
 */
export type UserRole =
  | 'admin'
  | 'student'
  | 'lector'
  | 'mentor'
  | 'assistant'
  | 'co_lecturer'
  | 'education_office_head'
  | 'department_admin'

/**
 * Role hierarchy for permission checking
 * Higher numbers = more permissions
 */
const roleHierarchy: Record<UserRole, number> = {
  admin: 100,
  education_office_head: 90,
  department_admin: 80,
  lector: 50,
  co_lecturer: 45,
  assistant: 40,
  mentor: 30,
  student: 10,
}

/**
 * Check if user has required role or higher
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

/**
 * Extended session type with user information
 */
export type AuthSession = Session & {
  user: {
    id: string
    email?: string | null
    name?: string | null
    role: UserRole
    groupId?: string
    mustChangePassword?: boolean
  }
}

/**
 * Gets the current user session
 * Throws ApiError if not authenticated
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    throw ApiErrors.unauthorized()
  }

  return session as AuthSession
}

/**
 * Gets the current user session and checks for required role
 * Throws ApiError if not authenticated or insufficient permissions
 */
export async function requireRole(requiredRole: UserRole): Promise<AuthSession> {
  const session = await requireAuth()

  if (!hasRole(session.user.role, requiredRole)) {
    throw ApiErrors.forbidden(
      `This action requires ${requiredRole} role or higher`
    )
  }

  return session
}

/**
 * Gets the current user session and checks if user has any of the allowed roles
 * Throws ApiError if not authenticated or insufficient permissions
 */
export async function requireAnyRole(allowedRoles: UserRole[]): Promise<AuthSession> {
  const session = await requireAuth()

  if (!hasAnyRole(session.user.role, allowedRoles)) {
    throw ApiErrors.forbidden(
      `This action requires one of these roles: ${allowedRoles.join(', ')}`
    )
  }

  return session
}

/**
 * Gets the current user session if available, returns null if not authenticated
 * Does not throw an error
 */
export async function getAuth(): Promise<AuthSession | null> {
  const session = await getServerSession(authOptions)
  return session?.user ? (session as AuthSession) : null
}

/**
 * Checks if the current user must change their password
 * Throws ApiError if password change is required
 */
export async function checkPasswordChangeRequired(): Promise<AuthSession> {
  const session = await requireAuth()

  if (session.user.mustChangePassword) {
    throw ApiErrors.mustChangePassword()
  }

  return session
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

/**
 * Pagination response metadata
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Default pagination limits
 */
export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 10
export const MAX_LIMIT = 100

/**
 * Parses pagination parameters from URL search params
 */
export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || String(DEFAULT_PAGE)))
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT)))
  )
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

/**
 * Creates pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

/**
 * Creates a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: createPaginationMeta(page, limit, total),
  }
}
