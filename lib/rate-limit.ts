import { NextRequest } from 'next/server'
import { ApiErrors } from './api-error'

/**
 * Rate limiter configuration
 */
interface RateLimiterConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  maxRequests: number

  /**
   * Time window in milliseconds
   */
  windowMs: number

  /**
   * Optional message to return when rate limit is exceeded
   */
  message?: string
}

/**
 * Request tracking entry
 */
interface RequestEntry {
  count: number
  resetTime: number
}

/**
 * In-memory store for rate limiting
 * Note: In production, use Redis or another distributed cache
 */
const rateLimitStore = new Map<string, RequestEntry>()

/**
 * Cleanup interval to remove expired entries
 */
let cleanupInterval: ReturnType<typeof setInterval> | null = null

/**
 * Start cleanup interval to prevent memory leaks
 */
function startCleanup() {
  if (cleanupInterval) return

  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }, 60000) // Clean up every minute

  // Ensure cleanup stops when process exits
  if (typeof process !== 'undefined') {
    process.on('exit', () => {
      if (cleanupInterval) {
        clearInterval(cleanupInterval)
      }
    })
  }
}

/**
 * Gets client identifier from request
 * Uses IP address as the identifier
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a generic identifier
  return 'unknown'
}

/**
 * Rate limiter middleware
 * Checks if the client has exceeded the rate limit
 */
export function rateLimit(config: RateLimiterConfig) {
  const { maxRequests, windowMs } = config

  // Start cleanup on first use
  startCleanup()

  return async (request: NextRequest): Promise<void> => {
    const clientId = getClientId(request)
    const now = Date.now()
    const resetTime = now + windowMs

    const entry = rateLimitStore.get(clientId)

    if (!entry || entry.resetTime < now) {
      // No entry or expired entry, create new
      rateLimitStore.set(clientId, {
        count: 1,
        resetTime,
      })
      return
    }

    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      throw ApiErrors.rateLimitExceeded(retryAfter)
    }

    // Increment counter
    entry.count++
    rateLimitStore.set(clientId, entry)
  }
}

/**
 * Pre-configured rate limiters for common scenarios
 */
export const RateLimiters = {
  /**
   * Strict rate limiter for authentication endpoints
   * 5 requests per 15 minutes
   */
  auth: rateLimit({
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
  }),

  /**
   * Rate limiter for general API endpoints
   * 100 requests per minute
   */
  api: rateLimit({
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please slow down.',
  }),

  /**
   * Rate limiter for file upload endpoints
   * 10 requests per hour
   */
  upload: rateLimit({
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many upload attempts. Please try again later.',
  }),

  /**
   * Rate limiter for search endpoints
   * 30 requests per minute
   */
  search: rateLimit({
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many search requests. Please slow down.',
  }),
}

/**
 * Wrapper to apply rate limiting to an API handler
 */
export function withRateLimit<T extends unknown[]>(
  limiter: ReturnType<typeof rateLimit>,
  handler: (request: NextRequest, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    await limiter(request)
    return handler(request, ...args)
  }
}
