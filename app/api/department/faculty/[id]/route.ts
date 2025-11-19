import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'department_admin') {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    const userIdToRemove = params.id

    // Get admin's department
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { departmentId: true }
    })

    if (!admin?.departmentId) {
      return new NextResponse('Department not found', { status: 404 })
    }

    // Verify the user belongs to this department before removing
    const userToRemove = await prisma.user.findUnique({
      where: { id: userIdToRemove },
      select: { departmentId: true }
    })

    if (userToRemove?.departmentId !== admin.departmentId) {
      return new NextResponse('User not in your department', { status: 400 })
    }

    // Remove from department
    await prisma.user.update({
      where: { id: userIdToRemove },
      data: { departmentId: null }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DEPARTMENT_FACULTY_REMOVE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
