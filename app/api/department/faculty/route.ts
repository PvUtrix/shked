import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const addFacultySchema = z.object({
  userIds: z.array(z.string()),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'department_admin') {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    const body = await req.json()
    const { userIds } = addFacultySchema.parse(body)

    // Get admin's department
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { departmentId: true }
    })

    if (!admin?.departmentId) {
      return new NextResponse('Department not found', { status: 404 })
    }

    // Update users to belong to this department
    await prisma.user.updateMany({
      where: {
        id: { in: userIds }
      },
      data: {
        departmentId: admin.departmentId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DEPARTMENT_FACULTY_ADD]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
