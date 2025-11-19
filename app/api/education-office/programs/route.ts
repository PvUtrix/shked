import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createProgramSchema = z.object({
  name: z.string().min(3),
  degreeType: z.enum(['Bachelor', 'Master', 'PhD']),
  departmentId: z.string(),
  requiredCredits: z.number().min(1),
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'education_office_head') {
    return new NextResponse('Unauthorized', { status: 403 })
  }

  const programs = await prisma.academicProgram.findMany({
    include: {
      department: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          courses: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return NextResponse.json({ programs })
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'education_office_head') {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    const body = await req.json()
    const { name, degreeType, departmentId, requiredCredits } = createProgramSchema.parse(body)

    const program = await prisma.academicProgram.create({
      data: {
        name,
        degreeType,
        departmentId,
        requiredCredits,
      },
    })

    return NextResponse.json(program)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 422 })
    }
    console.error('[PROGRAMS_CREATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
