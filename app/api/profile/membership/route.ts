import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserScheduleScope, scheduleVisibilityWhere } from '@/lib/schedule/visibility'

export const dynamic = 'force-dynamic'

/**
 * GET /api/profile/membership: the signed-in user's group, their subgroups
 * (per subject) and how many classes they see.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      group: { select: { id: true, name: true, description: true, semester: true, year: true } },
      subgroupMemberships: {
        select: {
          subgroup: {
            select: { id: true, name: true, subject: { select: { name: true } } },
          },
        },
      },
    },
  })

  const scope = await getUserScheduleScope(session.user.id)
  const classCount = await prisma.schedule.count({
    where: { isActive: true, ...scheduleVisibilityWhere(scope.groupId, scope.subgroupIds) },
  })

  return NextResponse.json({
    group: user?.group ?? null,
    subgroups: (user?.subgroupMemberships ?? [])
      .map((m) => ({ id: m.subgroup.id, name: m.subgroup.name, subject: m.subgroup.subject?.name ?? null }))
      .sort((a, b) => (a.subject ?? '').localeCompare(b.subject ?? '')),
    classCount,
  })
}
