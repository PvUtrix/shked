/**
 * Standardized error handling for the application
 * Provides consistent error responses across all API routes
 */

import { NextResponse } from 'next/server'
import { logger } from './logger'

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'MUST_CHANGE_PASSWORD'
  | 'INVALID_CREDENTIALS'

export interface ErrorDetails {
  [key: string]: any
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public readonly statusCode: number
  public readonly code: ErrorCode
  public readonly details?: ErrorDetails
  public readonly isOperational: boolean

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: ErrorDetails,
    isOperational = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = isOperational

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Pre-defined error factory functions
 */
export class ApiErrors {
  static unauthorized(message = 'Unauthorized', details?: ErrorDetails): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message, details)
  }

  static forbidden(message = 'Forbidden', details?: ErrorDetails): ApiError {
    return new ApiError(403, 'FORBIDDEN', message, details)
  }

  static notFound(message = 'Not found', details?: ErrorDetails): ApiError {
    return new ApiError(404, 'NOT_FOUND', message, details)
  }

  static badRequest(message = 'Bad request', details?: ErrorDetails): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, details)
  }

  static validationError(
    message = 'Validation error',
    details?: ErrorDetails
  ): ApiError {
    return new ApiError(400, 'VALIDATION_ERROR', message, details)
  }

  static conflict(message = 'Conflict', details?: ErrorDetails): ApiError {
    return new ApiError(409, 'CONFLICT', message, details)
  }

  static internal(message = 'Internal server error', details?: ErrorDetails): ApiError {
    return new ApiError(500, 'INTERNAL_ERROR', message, details, false)
  }

  static rateLimitExceeded(
    message = 'Rate limit exceeded',
    details?: ErrorDetails
  ): ApiError {
    return new ApiError(429, 'RATE_LIMIT_EXCEEDED', message, details)
  }

  static mustChangePassword(
    message = 'You must change your password before continuing',
    details?: ErrorDetails
  ): ApiError {
    return new ApiError(403, 'MUST_CHANGE_PASSWORD', message, details)
  }

  static invalidCredentials(
    message = 'Invalid credentials',
    details?: ErrorDetails
  ): ApiError {
    return new ApiError(401, 'INVALID_CREDENTIALS', message, details)
  }
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  error: {
    code: ErrorCode
    message: string
    details?: ErrorDetails
    timestamp: string
    path?: string
  }
}

/**
 * Convert error to NextResponse
 */
export function handleApiError(
  error: unknown,
  requestPath?: string
): NextResponse<ErrorResponse> {
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Handle known ApiError instances
  if (error instanceof ApiError) {
    logger.error(`API Error: ${error.message}`, error, {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      path: requestPath,
    })

    const response: ErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
        ...(requestPath && { path: requestPath }),
        ...(isDevelopment && error.details && { details: error.details }),
      },
    }

    return NextResponse.json(response, { status: error.statusCode })
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: any }

    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        return handleApiError(
          ApiErrors.conflict('A record with this value already exists', {
            fields: prismaError.meta?.target,
          }),
          requestPath
        )
      case 'P2025': // Record not found
        return handleApiError(ApiErrors.notFound('Record not found'), requestPath)
      case 'P2003': // Foreign key constraint violation
        return handleApiError(
          ApiErrors.badRequest('Invalid reference to related record'),
          requestPath
        )
      default:
        logger.error('Prisma error', error, { code: prismaError.code })
    }
  }

  // Handle validation errors (Zod, Yup, etc.)
  if (error && typeof error === 'object' && 'name' in error) {
    if ((error as { name: string }).name === 'ZodError') {
      const zodError = error as { issues?: Array<{ path: string[]; message: string }> }
      return handleApiError(
        ApiErrors.validationError('Validation failed', {
          issues: zodError.issues,
        }),
        requestPath
      )
    }
  }

  // Handle generic errors
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  logger.error('Unhandled error', error instanceof Error ? error : new Error(errorMessage), {
    path: requestPath,
  })

  // Never expose internal error details in production
  const response: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: isDevelopment ? errorMessage : 'Internal server error',
      timestamp: new Date().toISOString(),
      ...(requestPath && { path: requestPath }),
      ...(isDevelopment &&
        error instanceof Error &&
        error.stack && { details: { stack: error.stack } }),
    },
  }

  return NextResponse.json(response, { status: 500 })
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R | NextResponse<ErrorResponse>> {
  return async (...args: T) => {
    try {
      return await handler(...args)
    } catch (error) {
      // Extract request path if available
      const request = args.find((arg) => arg && typeof arg === 'object' && 'url' in arg)
      const requestPath = request ? new URL(request.url).pathname : undefined

      return handleApiError(error, requestPath)
    }
  }
}
