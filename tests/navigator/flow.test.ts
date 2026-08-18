import { describe, expect, it } from 'vitest'
import { evaluateFlow } from '@/lib/navigator/flow'
import type { AnswerMap } from '@/lib/navigator/question-schema'

function ids(answers: AnswerMap): string[] {
  return evaluateFlow(answers).visible.map((question) => question.id)
}

describe('conditional flow', () => {
  it('starts at the perspective question with nothing answered', () => {
    const flow = evaluateFlow({})
    expect(flow.current?.id).toBe('perspective')
    expect(flow.thread).toHaveLength(0)
    expect(flow.answeredCount).toBe(0)
    // The three conditional questions are not yet known to apply, so the total
    // is an estimate that happens to equal the full set.
    expect(flow.visible).toHaveLength(8)
    expect(flow.estimatedTotal).toBe(11)
  })

  it('reveals later questions as earlier ones are answered', () => {
    const early = ids({ perspective: 'self' })
    const later = ids({
      perspective: 'self',
      'current-living': 'family_home',
      'desired-change': 'more_independence',
    })
    expect(later.length).toBeGreaterThan(early.length)
  })

  it('skips "how would you like to live" when the person wants to stay put', () => {
    const answers = {
      perspective: 'parent',
      'current-living': 'family_home',
      'desired-change': 'more_support_where_they_are',
    }
    expect(ids(answers)).not.toContain('desired-living')
    // The answer already settled it, so the profile is not left empty.
    expect(evaluateFlow(answers).profile.housing.desired).toBe('stay_where_they_are')
  })

  it('asks "how would you like to live" for every other kind of change', () => {
    expect(
      ids({
        perspective: 'parent',
        'current-living': 'family_home',
        'desired-change': 'move_out_of_family_home',
      }),
    ).toContain('desired-living')
  })

  it('skips the informal support question when help is only needed now and then', () => {
    const base = {
      perspective: 'self',
      'current-living': 'own_rental',
      'desired-change': 'more_independence',
      'desired-living': 'own_place_alone',
    }
    expect(ids({ ...base, 'support-intensity': 'occasional' })).not.toContain(
      'informal-support',
    )
    expect(ids({ ...base, 'support-intensity': 'daily_extensive' })).toContain(
      'informal-support',
    )
  })

  it('still asks about informal support when the support question is unsure', () => {
    expect(
      ids({
        perspective: 'self',
        'current-living': 'own_rental',
        'desired-change': 'unsure',
        'desired-living': 'unsure',
        'support-intensity': 'unsure',
      }),
    ).toContain('informal-support')
  })

  it('keeps an answer that no longer applies instead of losing it', () => {
    const answers = {
      perspective: 'parent',
      'current-living': 'family_home',
      'desired-change': 'more_support_where_they_are',
      // Given before the change answer was revised. Still stored, not applied.
      'desired-living': 'own_place_alone',
    }
    const flow = evaluateFlow(answers)
    expect(flow.inactiveAnswerIds).toContain('desired-living')
    expect(flow.profile.housing.desired).toBe('stay_where_they_are')
    expect(answers['desired-living']).toBe('own_place_alone')
  })

  it('ignores a stored answer that is not an offered option', () => {
    const flow = evaluateFlow({ perspective: 'self', 'current-living': 'a_castle' })
    expect(flow.profile.housing.current).toBeNull()
    expect(flow.inactiveAnswerIds).toContain('current-living')
    expect(flow.current?.id).toBe('current-living')
  })

  it('records which questions were answered "I\'m not sure"', () => {
    const flow = evaluateFlow({
      perspective: 'self',
      'current-living': 'family_home',
      'desired-change': 'unsure',
      'desired-living': 'unsure',
    })
    expect(flow.profile.uncertainties).toEqual(['desired-change', 'desired-living'])
    expect(flow.thread.filter((entry) => entry.unsure)).toHaveLength(2)
  })
})

describe('the thread', () => {
  it('writes answers back in the second person for someone exploring for themselves', () => {
    const flow = evaluateFlow({ perspective: 'self', 'current-living': 'family_home' })
    expect(flow.thread.map((entry) => entry.statement)).toEqual([
      "You're exploring options for yourself.",
      'You live in the family home.',
    ])
  })

  it('writes the same answers back in the third person for a parent', () => {
    const flow = evaluateFlow({ perspective: 'parent', 'current-living': 'family_home' })
    expect(flow.thread.map((entry) => entry.statement)).toEqual([
      "You're exploring options for your child.",
      'They live in the family home.',
    ])
  })

  it('keeps the thread in the order the questions were asked', () => {
    const flow = evaluateFlow({
      perspective: 'carer',
      'current-living': 'no_stable_home',
      'desired-change': 'leave_unsuitable_arrangement',
    })
    expect(flow.thread.map((entry) => entry.questionId)).toEqual([
      'perspective',
      'current-living',
      'desired-change',
    ])
  })
})

describe('life stage', () => {
  it('asks whether the person is an adult when a change of arrangement is in play', () => {
    const answers = {
      perspective: 'parent',
      'current-living': 'family_home',
      'desired-change': 'move_out_of_family_home',
      'desired-living': 'shared_home_with_support',
    }
    expect(ids(answers)).toContain('life-stage')
  })

  it('does not ask about age when the person is staying where they are', () => {
    const answers = {
      perspective: 'parent',
      'current-living': 'family_home',
      'desired-change': 'more_support_where_they_are',
    }
    expect(ids(answers)).not.toContain('life-stage')
  })

  it('records the answer on the profile and the thread', () => {
    const flow = evaluateFlow({
      perspective: 'parent',
      'current-living': 'family_home',
      'desired-change': 'move_out_of_family_home',
      'desired-living': 'own_place_alone',
      'life-stage': 'under_18',
    })
    expect(flow.profile.context.lifeStage).toBe('under_18')
    expect(flow.thread.map((entry) => entry.statement)).toContain('They are under 18.')
  })

  it('allows not knowing the age', () => {
    const flow = evaluateFlow({
      perspective: 'professional',
      'current-living': 'no_stable_home',
      'desired-change': 'leave_unsuitable_arrangement',
      'desired-living': 'unsure',
      'life-stage': 'unsure',
    })
    expect(flow.profile.context.lifeStage).toBe('unsure')
    expect(flow.profile.uncertainties).toContain('life-stage')
  })
})

