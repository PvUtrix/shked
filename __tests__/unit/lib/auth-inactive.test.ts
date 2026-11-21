/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import bcryptjs from 'bcryptjs'

const findUnique = jest.fn<(...a: unknown[]) => Promise<unknown>>()
jest.mock('@/lib/db', () => ({ prisma: { user: { findUnique: (...a: unknown[]) => findUnique(...a) } } }))

const { authOptions } = require('@/lib/auth') as typeof import('@/lib/auth')
const authorize = (authOptions.providers[0] as unknown as { options: { authorize: (c: unknown) => Promise<unknown> } }).options.authorize

describe('credentials sign-in', () => {
  let password: string
  beforeEach(async () => {
    password = await bcryptjs.hash('correct-horse-battery', 4)
  })

  const user = (isActive: boolean) => ({
    id: 'u1', email: 'a@example.test', password, role: 'student', isActive,
    name: null, firstName: 'A', lastName: 'B', groupId: null, mustChangePassword: false, group: null,
  })

  it('signs in an active user with the right password', async () => {
    findUnique.mockResolvedValue(user(true))
    expect(await authorize({ email: 'a@example.test', password: 'correct-horse-battery' })).toMatchObject({ id: 'u1' })
  })

  it('refuses a deactivated user even with the right password', async () => {
    findUnique.mockResolvedValue(user(false))
    expect(await authorize({ email: 'a@example.test', password: 'correct-horse-battery' })).toBeNull()
  })
})
