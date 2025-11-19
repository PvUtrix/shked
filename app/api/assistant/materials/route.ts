import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/assistant/materials
 * Get all materials for subjects where user is assigned as assistant
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'assistant') {
      return NextResponse.json(
        { error: 'Unauthorized. Assistant role required.' },
        { status: 403 }
      )
    }

    const userId = session.user.id

    // Get subjects where user is assigned as assistant
    const assignments = await prisma.subjectAssistant.findMany({
      where: {
        userId,
        isActive: true,
      },
    })

    const subjectIds = assignments.map((a) => a.subjectId)

    // Get documents for these subjects
    const documents = await prisma.subjectDocument.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
        isActive: true,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    })

    // Get external resources
    const resources = await prisma.externalResource.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
        isActive: true,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      documents: documents.map((doc) => ({
        id: doc.id,
        type: doc.type,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        subjectId: doc.subjectId,
        subjectName: doc.subject.name,
        uploadedBy: doc.uploader.name || doc.uploader.email,
        uploadedAt: doc.uploadedAt.toISOString(),
      })),
      resources: resources.map((res) => ({
        id: res.id,
        type: res.type,
        title: res.title,
        url: res.url,
        description: res.description,
        subjectId: res.subjectId,
        subjectName: res.subject?.name || null,
        createdAt: res.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('[Assistant Materials API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    )
  }
}
