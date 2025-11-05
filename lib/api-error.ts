import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Custom API Error class for structured error handling
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Common error codes for the API
 */
export const ErrorCode = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  MUST_CHANGE_PASSWORD: 'MUST_CHANGE_PASSWORD',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Business Logic
  INVALID_OPERATION: 'INVALID_OPERATION',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const

/**
 * Sanitizes error data to prevent sensitive information leakage
 */
function sanitizeError(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sanitized = { ...data } as Record<string, unknown>
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken']

  for (const key of Object.keys(sanitized)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeError(sanitized[key])
    }
  }

  return sanitized
}

/**
 * Formats Zod validation errors into a more user-friendly format
 */
function formatZodError(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }))
}

/**
 * Error response interface
 */
interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: unknown
    statusCode: number
  }
}

/**
 * Handles errors and returns a NextResponse with appropriate status and message
 * This provides centralized error handling for all API routes
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  // Handle custom ApiError
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: sanitizeError(error.details),
          statusCode: error.statusCode,
        },
      },
      { status: error.statusCode }
    )
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          details: formatZodError(error),
          statusCode: 400,
        },
      },
      { status: 400 }
    )
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: unknown }

    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        {
          error: {
            code: ErrorCode.ALREADY_EXISTS,
            message: 'A record with this data already exists',
            details: sanitizeError(prismaError.meta),
            statusCode: 409,
          },
        },
        { status: 409 }
      )
    }

    // Foreign key constraint violation
    if (prismaError.code === 'P2003') {
      return NextResponse.json(
        {
          error: {
            code: ErrorCode.INVALID_OPERATION,
            message: 'Referenced record does not exist',
            details: sanitizeError(prismaError.meta),
            statusCode: 400,
          },
        },
        { status: 400 }
      )
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        {
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Record not found',
            statusCode: 404,
          },
        },
        { status: 404 }
      )
    }
  }

  // Log unexpected errors
  console.error('[API Error]:', error)

  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: process.env.NODE_ENV === 'development'
            ? error.message
            : 'An unexpected error occurred',
          statusCode: 500,
        },
      },
      { status: 500 }
    )
  }

  // Fallback for unknown errors
  return NextResponse.json(
    {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        statusCode: 500,
      },
    },
    { status: 500 }
  )
}

/**
 * Async error handler wrapper for API routes
 * Wraps an async handler and automatically catches and handles errors
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

/**
 * Common API error constructors for convenience
 */
export const ApiErrors = {
  unauthorized: (message = 'Not authenticated') =>
    new ApiError(401, ErrorCode.UNAUTHORIZED, message),

  forbidden: (message = 'Access denied') =>
    new ApiError(403, ErrorCode.FORBIDDEN, message),

  notFound: (resource: string, id?: string) =>
    new ApiError(
      404,
      ErrorCode.NOT_FOUND,
      `${resource} not found`,
      id ? { id } : undefined
    ),

  alreadyExists: (resource: string) =>
    new ApiError(409, ErrorCode.ALREADY_EXISTS, `${resource} already exists`),

  validationError: (message: string, details?: unknown) =>
    new ApiError(400, ErrorCode.VALIDATION_ERROR, message, details),

  invalidInput: (field: string, message: string) =>
    new ApiError(400, ErrorCode.INVALID_INPUT, message, { field }),

  rateLimitExceeded: (retryAfter?: number) =>
    new ApiError(
      429,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests',
      retryAfter ? { retryAfter } : undefined
    ),

  internalError: (message = 'Internal server error') =>
    new ApiError(500, ErrorCode.INTERNAL_ERROR, message),

  mustChangePassword: () =>
    new ApiError(
      403,
      ErrorCode.MUST_CHANGE_PASSWORD,
      'Password change required'
    ),
}
