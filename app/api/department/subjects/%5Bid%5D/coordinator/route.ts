import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const assignCoordinatorSchema = z.object({
  userId: z.string(),
})

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'department_admin') {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    const subjectId = params.id
    const body = await req.json()
    const { userId } = assignCoordinatorSchema.parse(body)

    // Get admin's department
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { departmentId: true }
    })

    if (!admin?.departmentId) {
      return new NextResponse('Department not found', { status: 404 })
    }

    // Verify subject belongs to department
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { departmentId: true }
    })

    if (subject?.departmentId !== admin.departmentId) {
      return new NextResponse('Subject not in your department', { status: 400 })
    }

    // Verify user belongs to department
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true }
    })

    if (user?.departmentId !== admin.departmentId) {
      return new NextResponse('User not in your department', { status: 400 })
    }

    // Transaction to update coordinator
    await prisma.$transaction(async (tx) => {
      // Remove existing coordinator(s)
      await tx.subjectLector.deleteMany({
        where: {
          subjectId: subjectId,
          role: 'LECTOR'
        }
      })

      // Add new coordinator
      await tx.subjectLector.create({
        data: {
          subjectId: subjectId,
          userId: userId,
          role: 'LECTOR'
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DEPARTMENT_SUBJECT_COORDINATOR]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
