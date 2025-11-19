import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const AttendanceSchema = z.object({
  scheduleId: z.string().cuid(),
  attendanceRecords: z.array(
    z.object({
      userId: z.string().cuid(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
      notes: z.string().optional(),
    })
  ),
})

/**
 * POST /api/assistant/attendance
 * Mark attendance for a class session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'assistant') {
      return NextResponse.json(
        { error: 'Unauthorized. Assistant role required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = AttendanceSchema.parse(body)

    const { scheduleId, attendanceRecords } = validatedData
    const assistantId = session.user.id

    // Verify the schedule exists and assistant is assigned to this subject
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        subject: {
          include: {
            assistants: {
              where: {
                userId: assistantId,
                isActive: true,
              },
            },
          },
        },
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    if (schedule.subject.assistants.length === 0) {
      return NextResponse.json(
        { error: 'Not authorized for this subject' },
        { status: 403 }
      )
    }

    // Mark attendance for each student
    const attendancePromises = attendanceRecords.map((record) =>
      prisma.attendance.upsert({
        where: {
          scheduleId_userId: {
            scheduleId,
            userId: record.userId,
          },
        },
        create: {
          scheduleId,
          userId: record.userId,
          status: record.status,
          notes: record.notes || null,
          source: 'MANUAL',
          markedBy: assistantId,
        },
        update: {
          status: record.status,
          notes: record.notes || null,
          markedBy: assistantId,
          markedAt: new Date(),
        },
      })
    )

    const results = await Promise.all(attendancePromises)

    return NextResponse.json({
      success: true,
      recorded: results.length,
      attendance: results,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('[Assistant Attendance API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to mark attendance' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/assistant/attendance?scheduleId={id}
 * Get attendance records for a specific schedule
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'assistant') {
      return NextResponse.json(
        { error: 'Unauthorized. Assistant role required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'scheduleId is required' },
        { status: 400 }
      )
    }

    const assistantId = session.user.id

    // Verify access
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        subject: {
          include: {
            assistants: {
              where: {
                userId: assistantId,
                isActive: true,
              },
            },
          },
        },
        group: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        attendance: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    if (schedule.subject.assistants.length === 0) {
      return NextResponse.json(
        { error: 'Not authorized for this subject' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      schedule: {
        id: schedule.id,
        subject: schedule.subject.name,
        group: schedule.group?.name,
        date: schedule.date.toISOString(),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      },
      students: schedule.group?.users || [],
      attendance: schedule.attendance.map((att) => ({
        id: att.id,
        userId: att.userId,
        studentName: att.student.name,
        status: att.status,
        notes: att.notes,
        markedAt: att.markedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('[Assistant Attendance API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    )
  }
}
