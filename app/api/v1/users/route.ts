/**
 * Example API route using new validation, error handling, caching, and versioning
 * This demonstrates best practices for API development
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ApiErrors, handleApiError } from '@/lib/errors'
import { requireAuth, requireRole } from '@/lib/api-helpers'
import { CreateUserSchema, UserQuerySchema } from '@/lib/validations'
import { cache, CacheKeys, CacheTTL } from '@/lib/cache'
import { withApiVersion } from '@/lib/api-version'
import bcryptjs from 'bcryptjs'

/**
 * GET /api/v1/users - Get list of users with caching
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    logger.info('Fetching users', { userId: session.user.id })

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const query = UserQuerySchema.parse(searchParams)

    // Create cache key based on query parameters
    const cacheKey = CacheKeys.users(JSON.stringify(query))

    // Try to get from cache first
    const users = await cache.getOrSet(
      cacheKey,
      async () => {
        logger.debug('Cache miss, fetching from database', { cacheKey })

        const where: any = {}

        if (query.role) {
          where.role = query.role
        }

        if (query.groupId) {
          where.groupId = query.groupId
        }

        if (!query.includeInactive || session.user.role !== 'admin') {
          where.isActive = true
        }

        const users = await prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            middleName: true,
            role: true,
            groupId: true,
            isActive: true,
            createdAt: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            lastName: 'asc',
          },
          take: query.limit || 10,
          skip: ((query.page || 1) - 1) * (query.limit || 10),
        })

        return users
      },
      { ttl: CacheTTL.MEDIUM } // Cache for 5 minutes
    )

    logger.info('Users fetched successfully', {
      userId: session.user.id,
      count: users.length,
      fromCache: cache.has(cacheKey),
    })

    return NextResponse.json({ users })
  } catch (error) {
    return handleApiError(error, request.nextUrl.pathname)
  }
}

/**
 * POST /api/v1/users - Create new user with validation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('admin')
    logger.info('Creating new user', { adminId: session.user.id })

    const body = await request.json()

    // Validate input with Zod
    const validated = CreateUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingUser) {
      throw ApiErrors.conflict('User with this email already exists', {
        email: validated.email,
      })
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(validated.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        firstName: validated.firstName,
        lastName: validated.lastName,
        middleName: validated.middleName,
        role: validated.role,
        mustChangePassword: validated.mustChangePassword,
        ...(validated.groupId && {
          group: {
            connect: { id: validated.groupId },
          },
        }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        groupId: true,
        createdAt: true,
      },
    })

    // Invalidate users cache
    cache.invalidatePattern(/^users/)

    logger.info('User created successfully', {
      adminId: session.user.id,
      userId: user.id,
      email: user.email,
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    logger.error('Failed to create user', error, {
      adminId: (await requireAuth().catch(() => null))?.user.id,
    })
    return handleApiError(error, request.nextUrl.pathname)
  }
}

/**
 * Export with API versioning wrapper
 */
export const GET_V1 = withApiVersion(GET)
export const POST_V1 = withApiVersion(POST)
