import { describe, it, expect } from '@jest/globals'
import { z } from 'zod'
import { zodResolver } from '@/lib/forms/zod-resolver'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  number: z.coerce.number().min(1, 'Must be positive'),
})

const options = { fields: {}, shouldUseNativeValidation: false } as Parameters<ReturnType<typeof zodResolver>>[2]

describe('lib/forms/zod-resolver', () => {
  it('returns field errors instead of throwing (Zod 4)', async () => {
    const result = await zodResolver(schema)({ name: '', number: 0 }, undefined, options)
    expect(result.values).toEqual({})
    expect(result.errors).toMatchObject({
      name: { message: 'Name is required' },
      number: { message: 'Must be positive' },
    })
  })

  it('returns the parsed values when valid', async () => {
    const result = await zodResolver(schema)({ name: 'Group 1', number: '2' }, undefined, options)
    expect(result.errors).toEqual({})
    expect(result.values).toEqual({ name: 'Group 1', number: 2 })
  })
})
