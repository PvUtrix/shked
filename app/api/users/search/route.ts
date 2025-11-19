import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')
  const roleFilter = searchParams.get('role')

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] })
  }

  const whereClause: any = {
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
    ],
  }

  if (roleFilter === 'staff') {
    whereClause.role = { in: ['lector', 'co_lecturer', 'assistant', 'mentor'] }
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
    take: 10,
  })

  return NextResponse.json({ users })
}
