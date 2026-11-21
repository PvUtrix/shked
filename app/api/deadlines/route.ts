import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { deadlinesForUser } from '@/lib/calendar/feed'
import { getUserScheduleScope } from '@/lib/schedule/visibility'

export const dynamic = 'force-dynamic'

const RECENT_DAYS = 14

/**
 * GET /api/deadlines: the signed-in user's open deadlines (with where to
 * submit) and the recent changes to their timetable and deadlines.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const startOfToday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const deadlines = await deadlinesForUser(session.user.id, startOfToday)

  const scope = await getUserScheduleScope(session.user.id)
  const announcements = scope.groupId
    ? await prisma.announcement.findMany({
        where: {
          groupId: scope.groupId,
          createdAt: { gte: new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000) },
          OR: [{ subgroupId: null }, { subgroupId: { in: scope.subgroupIds } }],
        },
        include: { subject: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    : []

  return NextResponse.json({
    deadlines: deadlines.map((d) => ({
      id: d.id,
      title: d.title,
      details: d.details,
      subject: d.subject?.name ?? null,
      dueAt: d.dueAt.toISOString(),
      allDay: d.allDay,
      kind: d.kind,
      submissionChannel: d.submissionChannel,
      submissionTarget: d.submissionTarget,
      namingRule: d.namingRule,
      links: (d.links as Array<{ url: string }> | null) ?? [],
      source: d.sourceType,
    })),
    announcements: announcements.map((a) => ({
      id: a.id,
      kind: a.kind,
      title: a.title,
      subject: a.subject?.name ?? null,
      details: a.details,
      source: a.sourceType,
      createdAt: a.createdAt.toISOString(),
    })),
  })
}
