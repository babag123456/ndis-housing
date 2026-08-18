import { describe, expect, it } from 'vitest'
import { evaluateFlow } from '@/lib/navigator/flow'
import {
  PERSONA_A,
  PERSONA_B,
  PERSONA_C,
  PERSONA_D,
} from '../fixtures/personas'

/**
 * The four personas from the specification.
 *
 * Phase 1 has no decision engine, so these assert the structured profile the
 * engine will read, and the language each persona is spoken to in. Pathway
 * states, reasons and uncertainties get asserted against the same personas when
 * the engine lands in Phase 2.
 */

describe('persona A — exploring for themselves', () => {
  const flow = evaluateFlow(PERSONA_A)

  it('completes the journey', () => {
    expect(flow.current).toBeNull()
    expect(flow.answeredCount).toBe(11)
  })

  it('separates where they live from how they are supported', () => {
    expect(flow.profile.housing.current).toBe('family_home')
    expect(flow.profile.housing.desired).toBe('own_place_alone')
    expect(flow.profile.support.dailyIntensity).toBe('daily_brief')
    expect(flow.profile.support.overnight).toBe('none')
  })

  it('records no specialist building requirement', () => {
    expect(flow.profile.housing.featureNeeds).toBe('none_known')
  })

  it('speaks to them in the second person', () => {
    expect(flow.voice?.isSelf).toBe(true)
    expect(flow.thread.map((entry) => entry.statement)).toContain(
      'You live in the family home.',
    )
    expect(flow.thread.map((entry) => entry.statement)).toContain(
      'You need a little help most days.',
    )
  })

  it('carries no uncertainty', () => {
    expect(flow.profile.uncertainties).toEqual([])
  })
})

describe('persona B — a parent, for their adult child', () => {
  const flow = evaluateFlow(PERSONA_B)

  it('records the need for someone to be available at all times', () => {
    expect(flow.profile.support.overnight).toBe('someone_always_available')
    expect(flow.profile.support.dailyIntensity).toBe('daily_extensive')
  })

  it('does not turn high support needs into a building requirement', () => {
    expect(flow.profile.housing.featureNeeds).toBe('none_known')
  })

  it('speaks about the child in the third person', () => {
    expect(flow.voice?.isSelf).toBe(false)
    expect(flow.voice?.personLabel).toBe('your child')
    expect(flow.thread.map((entry) => entry.statement)).toContain(
      'They live in the family home.',
    )
    expect(flow.thread.map((entry) => entry.statement)).toContain(
      'Someone needs to be available to them at all times.',
    )
  })
})

describe('persona C — a carer, high physical access needs', () => {
  const flow = evaluateFlow(PERSONA_C)

  it('records the building requirement separately from the support need', () => {
    expect(flow.profile.housing.featureNeeds).toBe('purpose_built')
    expect(flow.profile.support.dailyIntensity).toBe('several_times_daily')
    expect(flow.profile.support.informal).toBe('very_little')
  })

  it('records urgency', () => {
    expect(flow.profile.context.timing).toBe('urgent')
    expect(flow.profile.context.ndis).toBe('plan_under_review')
  })

  it('speaks about the person in the third person', () => {
    expect(flow.voice?.personLabel).toBe('the person you care for')
    expect(flow.thread.map((entry) => entry.statement)).toContain(
      'They need help at several points through the day.',
    )
  })
})

describe('persona D — unsure throughout', () => {
  const flow = evaluateFlow(PERSONA_D)

  it('still reaches the end of the journey', () => {
    expect(flow.current).toBeNull()
  })

  it('records uncertainty rather than assuming an answer', () => {
    expect(flow.profile.uncertainties).toEqual([
      'desired-change',
      'desired-living',
      'life-stage',
      'support-intensity',
      'overnight-support',
      'housing-features',
      'informal-support',
      'timing',
      'ndis-context',
    ])
  })

  it('does not infer a support level or a housing need', () => {
    expect(flow.profile.support.dailyIntensity).toBe('unsure')
    expect(flow.profile.housing.featureNeeds).toBe('unsure')
    expect(flow.profile.housing.desired).toBe('unsure')
  })

  it('says out loud that the answer is not known', () => {
    const unsureEntries = flow.thread.filter((entry) => entry.unsure)
    expect(unsureEntries).toHaveLength(9)
    expect(unsureEntries[0]?.statement).toContain('not sure')
  })
})
