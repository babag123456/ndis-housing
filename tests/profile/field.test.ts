import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { composeFields, defineField, readFrom, writeTo } from '@/lib/profile/field'
import { createEmptyProfile } from '@/types/profile'

const colourSchema = z.enum(['red', 'blue'])

const colour = defineField({
  schema: colourSchema,
  read: () => null,
  write: () => {},
})

describe('defineField', () => {
  it('returns the definition unchanged, so it is only a typing helper', () => {
    expect(colour.schema).toBe(colourSchema)
  })
})

describe('composeFields', () => {
  it('merges field groups into one registry', () => {
    const registry = composeFields({ a: colour }, { b: colour })
    expect(Object.keys(registry).sort()).toEqual(['a', 'b'])
  })

  it('rejects two groups claiming the same field id', () => {
    expect(() => composeFields({ a: colour }, { a: colour })).toThrow(/already defined/i)
  })
})

describe('readFrom', () => {
  it('returns null for a field the registry does not have', () => {
    expect(readFrom({}, createEmptyProfile(), 'nope')).toBeNull()
  })
})

describe('writeTo', () => {
  const registry = {
    'goals.change': defineField({
      schema: z.enum(['more_independence', 'unsure']),
      read: (profile) => profile.goals.change,
      write: (profile, value) => {
        profile.goals.change = value
      },
    }),
  }

  it('writes a valid value and reports success', () => {
    const profile = createEmptyProfile()
    expect(writeTo(registry, profile, 'goals.change', 'more_independence')).toBe(true)
    expect(profile.goals.change).toBe('more_independence')
  })

  it('refuses an invalid value and leaves the profile untouched', () => {
    const profile = createEmptyProfile()
    expect(writeTo(registry, profile, 'goals.change', 'nonsense')).toBe(false)
    expect(profile.goals.change).toBeNull()
  })

  it('refuses a field the registry does not have', () => {
    expect(writeTo({}, createEmptyProfile(), 'nope', 'x')).toBe(false)
  })
})
