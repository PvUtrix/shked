import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logActivity } from '@/lib/activity-log'
import {
  requireAuth,
  requireRole,
  parsePagination,
  createPaginatedResponse,
} from '@/lib/api-helpers'
import { handleApiError, ApiErrors } from '@/lib/api-error'
import { createGroupSchema, updateGroupSchema, idSchema } from '@/lib/validations'

/**
 * GET /api/groups - Get list of groups with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePagination(searchParams)
    const mentor = searchParams.get('mentor') === 'true'

    // Build where clause based on role
    let where = {}

    if (session.user.role === 'mentor' || mentor) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { mentorGroupIds: true },
      })

      if (user?.mentorGroupIds && Array.isArray(user.mentorGroupIds)) {
        where = {
          id: {
            in: user.mentorGroupIds as string[],
          },
        }
      }
    }

    // Get total count for pagination
    const total = await prisma.group.count({ where })

    // Fetch groups with pagination
    const groups = await prisma.group.findMany({
      where,
      include: {
        users: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            users: true,
            schedules: true,
            homework: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    })

    return NextResponse.json(
      createPaginatedResponse(groups, page, limit, total),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/groups - Create a new group
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('admin')

    const body = await request.json()
    const validatedData = createGroupSchema.parse(body)

    const group = await prisma.group.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        semester: validatedData.semester,
        year: validatedData.year,
      },
      include: {
        _count: {
          select: {
            users: true,
            schedules: true,
            homework: true,
          },
        },
      },
    })

    await logActivity({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Group',
      entityId: group.id,
      request,
      details: {
        after: {
          id: group.id,
          name: group.name,
          description: group.description,
          semester: group.semester,
          year: group.year,
        },
      },
      result: 'SUCCESS',
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    const session = await requireAuth()
    await logActivity({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Group',
      request,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      result: 'FAILURE',
    }).catch(() => {}) // Don't fail if logging fails

    return handleApiError(error)
  }
}

/**
 * PUT /api/groups - Update a group
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireRole('admin')

    const body = await request.json()
    const validatedData = updateGroupSchema.parse(body)

    // Check if group exists
    const existingGroup = await prisma.group.findUnique({
      where: { id: validatedData.id },
    })

    if (!existingGroup) {
      throw ApiErrors.notFound('Group', validatedData.id)
    }

    const group = await prisma.group.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        semester: validatedData.semester,
        year: validatedData.year,
      },
      include: {
        _count: {
          select: {
            users: true,
            schedules: true,
            homework: true,
          },
        },
      },
    })

    await logActivity({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'Group',
      entityId: group.id,
      request,
      details: {
        before: {
          name: existingGroup.name,
          description: existingGroup.description,
          semester: existingGroup.semester,
          year: existingGroup.year,
        },
        after: {
          name: group.name,
          description: group.description,
          semester: group.semester,
          year: group.year,
        },
      },
      result: 'SUCCESS',
    })

    return NextResponse.json(group)
  } catch (error) {
    const session = await requireAuth()
    const body = await request.json().catch(() => ({}))
    await logActivity({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'Group',
      entityId: body.id,
      request,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      result: 'FAILURE',
    }).catch(() => {})

    return handleApiError(error)
  }
}

/**
 * DELETE /api/groups - Soft delete a group
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireRole('admin')

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      throw ApiErrors.validationError('ID parameter is required')
    }

    // Validate ID format
    idSchema.parse(id)

    // Check if group exists
    const existingGroup = await prisma.group.findUnique({
      where: { id },
    })

    if (!existingGroup) {
      throw ApiErrors.notFound('Group', id)
    }

    // Soft delete
    await prisma.group.update({
      where: { id },
      data: { isActive: false },
    })

    await logActivity({
      userId: session.user.id,
      action: 'DELETE',
      entityType: 'Group',
      entityId: id,
      request,
      details: {
        before: {
          id: existingGroup.id,
          name: existingGroup.name,
          isActive: existingGroup.isActive,
        },
      },
      result: 'SUCCESS',
    })

    return NextResponse.json({ message: 'Group deleted successfully' })
  } catch (error) {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      await logActivity({
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'Group',
        entityId: id,
        request,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        result: 'FAILURE',
      }).catch(() => {})
    }

    return handleApiError(error)
  }
}
