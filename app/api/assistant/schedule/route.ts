import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/assistant/schedule
 * Get the schedule for classes where the user is assigned as an assistant
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

    const userId = session.user.id

    // Get subjects where user is assigned as assistant
    const assistantAssignments = await prisma.subjectAssistant.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        subject: true,
      },
    })

    const subjectIds = assistantAssignments.map((assignment) => assignment.subjectId)

    // Get upcoming schedule for these subjects
    const now = new Date()
    const schedules = await prisma.schedule.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
        date: {
          gte: now,
        },
        isActive: true,
      },
      include: {
        subject: true,
        group: true,
        subgroup: true,
        attendance: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
      take: 50, // Limit to next 50 sessions
    })

    return NextResponse.json({
      schedules: schedules.map((schedule) => ({
        id: schedule.id,
        subjectId: schedule.subjectId,
        subjectName: schedule.subject.name,
        groupId: schedule.groupId,
        groupName: schedule.group?.name || null,
        subgroupId: schedule.subgroupId,
        subgroupName: schedule.subgroup?.name || null,
        date: schedule.date.toISOString(),
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        location: schedule.location,
        eventType: schedule.eventType,
        description: schedule.description,
        videoUrl: schedule.videoUrl,
        attendanceCount: schedule.attendance.length,
        attendanceMarked: schedule.attendance.length > 0,
      })),
      assignments: assistantAssignments.map((assignment) => ({
        id: assignment.id,
        subjectId: assignment.subjectId,
        subjectName: assignment.subject.name,
        assignedAt: assignment.assignedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('[Assistant Schedule API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}
