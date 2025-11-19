/**
 * Caching layer for the application
 * Provides in-memory caching with TTL support
 *
 * In production, this should be replaced with Redis or similar distributed cache
 */

export interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>>
  private defaultTTL: number

  constructor(defaultTTL = 5 * 60 * 1000) {
    // Default 5 minutes
    this.cache = new Map()
    this.defaultTTL = defaultTTL

    // Clear expired entries every minute
    if (typeof window === 'undefined') {
      // Only in server environment
      setInterval(() => this.clearExpired(), 60 * 1000)
    }
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, value: T, options?: CacheOptions): void {
    const ttl = options?.ttl ?? this.defaultTTL
    const expiresAt = Date.now() + ttl

    this.cache.set(key, {
      value,
      expiresAt,
    })
  }

  /**
   * Get a value from the cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value as T
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key)
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key)
    }

    if (expiredKeys.length > 0) {
      console.log(`[Cache] Cleared ${expiredKeys.length} expired entries`)
    }
  }

  /**
   * Get cache statistics
   */
  stats(): {
    size: number
    expired: number
    active: number
  } {
    const now = Date.now()
    let expired = 0
    let active = 0

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++
      } else {
        active++
      }
    }

    return {
      size: this.cache.size,
      expired,
      active,
    }
  }

  /**
   * Get or set pattern (fetch if not cached)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await fetcher()
    this.set(key, value, options)
    return value
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key)
    }

    return keysToDelete.length
  }
}

// Export singleton instance
export const cache = new CacheManager()

/**
 * Cache key builders for common patterns
 */
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  users: (filters?: string) => `users${filters ? `:${filters}` : ''}`,
  group: (id: string) => `group:${id}`,
  groups: () => 'groups:all',
  subject: (id: string) => `subject:${id}`,
  subjects: () => 'subjects:all',
  schedule: (date: string, groupId?: string) =>
    `schedule:${date}${groupId ? `:${groupId}` : ''}`,
  homework: (id: string) => `homework:${id}`,
  botSettings: () => 'bot:settings',
  session: (userId: string) => `session:${userId}`,
}

/**
 * Common cache TTL values (in milliseconds)
 */
export const CacheTTL = {
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  HOUR: 60 * 60 * 1000, // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 24 hours
}

/**
 * Helper function to create cache-aware API handler
 */
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  return cache.getOrSet(key, fetcher, options)
}
