import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay, addDays } from 'date-fns'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'education_office_head') {
    return new NextResponse('Unauthorized', { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get('date')
  
  const date = dateParam ? new Date(dateParam) : new Date()
  const startDate = startOfDay(date)
  const endDate = endOfDay(date)

  const schedules = await prisma.schedule.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      isActive: true,
    },
    include: {
      subject: {
        select: {
          name: true,
          lectors: {
            where: { role: 'LECTOR' },
            include: {
              lector: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      group: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  })

  // Basic conflict detection
  const conflicts = []
  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const s1 = schedules[i]
      const s2 = schedules[j]

      // Check time overlap
      if (s1.startTime < s2.endTime && s2.startTime < s1.endTime) {
        // Check location conflict
        if (s1.location && s2.location && s1.location === s2.location) {
          conflicts.push({
            type: 'Location',
            scheduleIds: [s1.id, s2.id],
            details: `Room ${s1.location} double booked`,
          })
        }
        
        // Check lector conflict (simplified - assumes first lector is main)
        const l1 = s1.subject.lectors[0]?.lector.name
        const l2 = s2.subject.lectors[0]?.lector.name
        if (l1 && l2 && l1 === l2) {
           conflicts.push({
            type: 'Lector',
            scheduleIds: [s1.id, s2.id],
            details: `Lector ${l1} double booked`,
          })
        }
      }
    }
  }

  return NextResponse.json({ schedules, conflicts })
}
