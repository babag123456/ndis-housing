import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { FIELD_IDS, FIELDS, readField, writeField } from '@/lib/profile/fields'
import { SHARED_FIELDS } from '@/lib/profile/shared-fields'
import { HOME_AND_LIVING_FIELDS } from '@/tracks/home-and-living/fields'
import { TRACKS, trackById } from '@/tracks'
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

describe('the track registry', () => {
  it('has the home and living track', () => {
    expect(trackById('home-and-living')?.plainName).toBe('Home and living')
  })

  it('gives every question a globally unique id', () => {
    const seen = new Map<string, string>()
    for (const track of TRACKS) {
      for (const question of track.questions) {
        const owner = seen.get(question.id)
        expect(
          owner,
          `"${question.id}" is claimed by ${owner} and ${track.id}`,
        ).toBeUndefined()
        seen.set(question.id, track.id)
      }
    }
  })

  it('only lets a track write to its own fields or shared ones', () => {
    const shared: readonly string[] = Object.keys(SHARED_FIELDS)
    const ownership = new Map<string, string>(
      Object.keys(HOME_AND_LIVING_FIELDS).map((id) => [id, 'home-and-living']),
    )

    for (const track of TRACKS) {
      for (const question of track.questions) {
        const written = [
          question.profileField,
          ...question.options.flatMap((option) =>
            (option.implies ?? []).map((implied) => implied.field),
          ),
        ]
        for (const field of written) {
          if (shared.includes(field)) continue
          expect(
            ownership.get(field),
            `${track.id} writes to ${field}, which it does not own`,
          ).toBe(track.id)
        }
      }
    }
  })

  it('references only fields that exist', () => {
    for (const track of TRACKS) {
      for (const question of track.questions) {
        expect(FIELD_IDS, `question ${question.id}`).toContain(question.profileField)
        for (const condition of question.showWhen ?? []) {
          expect(FIELD_IDS, `condition on ${question.id}`).toContain(condition.field)
        }
      }
      for (const rule of track.rules ?? []) {
        const clauses = [
          ...rule.supports.flatMap((signal) => signal.when),
          ...rule.against.flatMap((signal) => signal.when),
        ]
        for (const clause of clauses) {
          expect(FIELD_IDS, `rule ${rule.pathwayId}`).toContain(clause.field)
        }
        for (const required of rule.requires) {
          expect(FIELD_IDS, `rule ${rule.pathwayId} requires`).toContain(required)
        }
      }
      for (const step of track.steps) {
        const conditions = [...(step.showWhen ?? []), ...(step.showWhenAny ?? [])]
        for (const condition of conditions) {
          expect(FIELD_IDS, `step ${step.id}`).toContain(condition.field)
        }
      }
    }
  })

  it('asks about every registered field, so none is dead weight', () => {
    const asked = new Set(
      TRACKS.flatMap((track) => track.questions.map((question) => question.profileField)),
    )
    // context.state is registered ahead of the question that fills it, which
    // arrives with the jurisdiction content in Phase 2.
    const unasked = FIELD_IDS.filter((id) => !asked.has(id))
    expect(unasked.sort()).toEqual(['context.state'])
  })
})
