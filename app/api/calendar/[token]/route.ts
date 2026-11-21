import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { buildCalendarFeed } from '@/lib/calendar/feed'

export const dynamic = 'force-dynamic'

/**
 * GET /api/calendar/<token>: a user's personal iCal feed. The token in the
 * URL is the only credential (calendar apps cannot sign in), so it is long,
 * random and can be rotated from the profile.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const clean = token.replace(/\.ics$/, '')
  if (!/^[A-Za-z0-9_-]{24,64}$/.test(clean)) return new Response('Not found', { status: 404 })

  const user = await prisma.user.findUnique({ where: { calendarToken: clean }, select: { id: true, isActive: true } })
  if (!user || !user.isActive) return new Response('Not found', { status: 404 })

  const body = await buildCalendarFeed(user.id)
  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'private, max-age=300',
      'Content-Disposition': 'inline; filename="calendar.ics"',
    },
  })
}
