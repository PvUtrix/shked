/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { scheduleVisibilityWhere } from '@/lib/schedule/visibility'

const db = {
  group: { findUnique: jest.fn<(...a: unknown[]) => Promise<unknown>>() },
  user: { findUnique: jest.fn<(...a: unknown[]) => Promise<unknown>>() },
  subgroup: { findMany: jest.fn<(...a: unknown[]) => Promise<unknown>>() },
  subgroupStudent: {
    deleteMany: jest.fn((args: unknown) => ({ op: 'deleteMany', args })),
    create: jest.fn((args: unknown) => ({ op: 'create', args })),
  },
  $transaction: jest.fn<(...a: unknown[]) => Promise<unknown>>(),
}

jest.mock('@/lib/db', () => ({ prisma: db }))
jest.mock('@/lib/auth', () => ({ authOptions: {} }))
jest.mock('next-auth/next', () => ({ getServerSession: jest.fn(async () => ({ user: { id: 'admin', role: 'admin' } })) }))

const { PUT } = require('@/app/api/groups/[id]/students/[studentId]/subgroups/route') as typeof import('@/app/api/groups/[id]/students/[studentId]/subgroups/route')

const call = (body: unknown) =>
  PUT(
    new Request('https://example.test', { method: 'PUT', body: JSON.stringify(body) }) as unknown as Parameters<typeof PUT>[0],
    { params: Promise.resolve({ id: 'g1', studentId: 's1' }) }
  )

describe('scheduleVisibilityWhere', () => {
  it('shows group-wide classes plus the student subgroups', () => {
    expect(scheduleVisibilityWhere('g1', ['a', 'b'])).toEqual({
      OR: [{ groupId: 'g1', subgroupId: null }, { subgroupId: { in: ['a', 'b'] } }],
    })
  })

  it('shows nothing to a user with neither group nor subgroups', () => {
    expect(scheduleVisibilityWhere(null, [])).toEqual({ id: { in: [] } })
  })
})

describe('PUT /api/groups/[id]/students/[studentId]/subgroups', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    db.group.findUnique.mockResolvedValue({ id: 'g1' })
    db.user.findUnique.mockResolvedValue({ id: 's1', groupId: 'g1' })
    db.subgroup.findMany.mockResolvedValue([
      { id: 'fin-1', subjectId: 'finance' },
      { id: 'fin-2', subjectId: 'finance' },
      { id: 'stat-3', subjectId: 'stats' },
    ])
    db.$transaction.mockResolvedValue([])
  })

  it('moves the student within one subject and leaves other subjects alone', async () => {
    const res = await call({ assignments: { finance: 'fin-2' } })
    expect(res.status).toBe(200)
    expect(db.subgroupStudent.deleteMany).toHaveBeenCalledWith({
      where: { userId: 's1', subgroupId: { in: ['fin-1', 'fin-2'] } },
    })
    expect(db.subgroupStudent.create).toHaveBeenCalledWith({ data: { userId: 's1', subgroupId: 'fin-2' } })
  })

  it('removes the membership when the value is null', async () => {
    await call({ assignments: { stats: null } })
    expect(db.subgroupStudent.deleteMany).toHaveBeenCalledWith({ where: { userId: 's1', subgroupId: { in: ['stat-3'] } } })
    expect(db.subgroupStudent.create).not.toHaveBeenCalled()
  })

  it('rejects a subgroup from another subject', async () => {
    const res = await call({ assignments: { finance: 'stat-3' } })
    expect(res.status).toBe(400)
    expect(db.$transaction).not.toHaveBeenCalled()
  })
})
