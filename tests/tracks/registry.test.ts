import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { FIELDS, readField, writeField } from '@/lib/profile/fields'
import { createEmptyProfile } from '@/types/profile'

describe('the field registry', () => {
  it('covers every field the profile can hold', () => {
    expect(Object.keys(FIELDS).sort()).toEqual([
      'context.lifeStage',
      'context.ndis',
      'context.state',
      'context.timing',
      'goals.change',
      'housing.current',
      'housing.desired',
      'housing.featureNeeds',
      'perspective',
      'support.dailyIntensity',
      'support.informal',
      'support.overnight',
    ])
  })

  it('round-trips every field, so read and write cannot disagree', () => {
    for (const [id, def] of Object.entries(FIELDS)) {
      const profile = createEmptyProfile()
      expect(readField(profile, id), `${id} should start unanswered`).toBeNull()

      // Every field's schema is a Zod enum, so its first option is a valid
      // value. `AnyFieldDef.schema` is the general `z.ZodType`, which has no
      // `.options`, so this needs a two-step cast.
      const options = (def.schema as unknown as z.ZodEnum<Record<string, string>>).options
      const value = options[0]
      expect(value, `${id} should have at least one option`).toBeDefined()
      if (value === undefined) continue

      expect(writeField(profile, id, value), `${id} should accept ${value}`).toBe(true)
      expect(readField(profile, id), `${id} should read back what was written`).toBe(value)
    }
  })

  it('refuses a value that is not valid for the field', () => {
    const profile = createEmptyProfile()
    expect(writeField(profile, 'housing.current', 'a_castle')).toBe(false)
    expect(profile.housing.current).toBeNull()
  })
})
