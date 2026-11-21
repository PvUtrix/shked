import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calendarFeedUrl, newCalendarToken } from '@/lib/calendar/feed'

export const dynamic = 'force-dynamic'

/** GET: the signed-in user's calendar feed URL, or null when none exists yet. */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { calendarToken: true } })
  return NextResponse.json({ url: user?.calendarToken ? calendarFeedUrl(user.calendarToken) : null })
}

/** POST: create the feed URL, or replace it (the old URL stops working). */
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = newCalendarToken()
  await prisma.user.update({ where: { id: session.user.id }, data: { calendarToken: token } })
  return NextResponse.json({ url: calendarFeedUrl(token) })
}
