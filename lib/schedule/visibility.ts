import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

/**
 * Which schedule entries a student sees: the classes of their group that
 * are not split by subgroup, plus the classes of every subgroup they are in.
 * The web export, the bot and the calendar feed all use this one rule.
 */
export function scheduleVisibilityWhere(
  groupId: string | null,
  subgroupIds: string[]
): Prisma.ScheduleWhereInput {
  const branches: Prisma.ScheduleWhereInput[] = []
  if (groupId) branches.push({ groupId, subgroupId: null })
  if (subgroupIds.length > 0) branches.push({ subgroupId: { in: subgroupIds } })
  // A user with neither a group nor subgroups sees nothing.
  return branches.length > 0 ? { OR: branches } : { id: { in: [] } }
}

/** The user's group and subgroup memberships, for scheduleVisibilityWhere. */
export async function getUserScheduleScope(userId: string): Promise<{
  groupId: string | null
  subgroupIds: string[]
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      groupId: true,
      subgroupMemberships: { select: { subgroupId: true } },
    },
  })
  return {
    groupId: user?.groupId ?? null,
    subgroupIds: user?.subgroupMemberships.map((m) => m.subgroupId) ?? [],
  }
}
