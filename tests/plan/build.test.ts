import { describe, expect, it } from 'vitest'
import { buildPlan, planProgress } from '@/lib/plan'
import { evaluateFlow } from '@/lib/navigator/flow'
import { voiceFor } from '@/lib/copy/perspective'
import { PERSONA_A, PERSONA_C, PERSONA_D } from '../fixtures/personas'

function planFor(answers: Record<string, string>) {
  const { profile, voice, thread } = evaluateFlow(answers)
  return buildPlan({ profile, voice: voice ?? voiceFor('other'), thread })
}

describe('the housing plan gathers everything in one place', () => {
  const plan = planFor(PERSONA_A)

  it('records the situation in the person’s own words', () => {
    expect(plan.situation.length).toBeGreaterThan(0)
    expect(plan.situation.map((entry) => entry.statement)).toContain(
      'You live in the family home.',
    )
  })

  it('separates what looks likely from what looks less relevant', () => {
    expect(plan.likely.length).toBeGreaterThan(0)
    expect(plan.lowerRelevance.length).toBeGreaterThan(0)
    const likelyIds = plan.likely.map((result) => result.pathway.id)
    for (const result of plan.lowerRelevance) {
      expect(likelyIds).not.toContain(result.pathway.id)
    }
  })

  it('leads with strong matches inside what looks likely', () => {
    expect(plan.likely[0]?.state).toBe('strong_match')
  })

  it('builds a roadmap', () => {
    expect(plan.roadmap.length).toBeGreaterThan(3)
  })
})

describe('the evidence checklist comes from the options that may suit', () => {
  const plan = planFor(PERSONA_A)

  it('lists each item once, however many options need it', () => {
    const texts = plan.evidence.map((item) => item.text)
    expect(new Set(texts).size).toBe(texts.length)
  })

  it('says which options each item is for', () => {
    for (const item of plan.evidence) {
      expect(item.neededFor.length, item.text).toBeGreaterThan(0)
    }
  })

  it('does not ask for evidence for options that appear less relevant', () => {
    const lowerNames = planFor(PERSONA_A).lowerRelevance.map(
      (result) => result.pathway.plainName,
    )
    for (const item of plan.evidence) {
      for (const neededFor of item.neededFor) {
        expect(lowerNames).not.toContain(neededFor)
      }
    }
  })

  it('gathers an item shared by two options only once, crediting both', () => {
    const plan = planFor(PERSONA_C)
    const shared = plan.evidence.filter((item) => item.neededFor.length > 1)
    expect(shared.length).toBeGreaterThan(0)
  })
})

describe('the plan is honest about what is not known', () => {
  it('lists the unanswered questions once each', () => {
    const plan = planFor(PERSONA_D)
    const ids = plan.openQuestions.map((open) => open.questionId)
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has nothing left open when everything was answered', () => {
    expect(planFor(PERSONA_A).openQuestions).toEqual([])
  })

  it('puts nothing in "likely" when nothing is known', () => {
    const plan = planFor(PERSONA_D)
    expect(plan.likely).toEqual([])
    expect(plan.needsMoreInformation.length).toBeGreaterThan(0)
  })
})

describe('progress counts only what the person can actually tick', () => {
  const plan = planFor(PERSONA_A)

  it('starts at nothing done', () => {
    const progress = planProgress(plan, { steps: {}, evidence: {} })
    expect(progress.stepsDone).toBe(0)
    expect(progress.stepsTotal).toBe(plan.roadmap.length)
    expect(progress.percentComplete).toBe(0)
  })

  it('counts a completed step', () => {
    const first = plan.roadmap[0]?.id as string
    const progress = planProgress(plan, { steps: { [first]: true }, evidence: {} })
    expect(progress.stepsDone).toBe(1)
    expect(progress.percentComplete).toBeGreaterThan(0)
  })

  it('ignores ticks for things no longer on the plan', () => {
    const progress = planProgress(plan, {
      steps: { 'a-step-that-no-longer-applies': true },
      evidence: { 'evidence-that-no-longer-applies': true },
    })
    expect(progress.stepsDone).toBe(0)
    expect(progress.evidenceDone).toBe(0)
  })

  it('reaches 100 per cent only when everything on the plan is done', () => {
    const steps = Object.fromEntries(plan.roadmap.map((step) => [step.id, true as const]))
    const evidence = Object.fromEntries(plan.evidence.map((item) => [item.id, true as const]))
    expect(planProgress(plan, { steps, evidence }).percentComplete).toBe(100)
  })
})

describe('who may pay is worked out separately from what the option is', () => {
  const plan = planFor(PERSONA_A)

  it('lists the funding sources the likely options draw on', () => {
    expect(plan.funding.length).toBeGreaterThan(1)
    expect(plan.funding.map((item) => item.source.id)).toContain('ndis')
  })

  it('says which options each source is for', () => {
    for (const item of plan.funding) {
      expect(item.forOptions.length, item.source.id).toBeGreaterThan(0)
    }
  })

  it('names each source once, however many options draw on it', () => {
    const ids = plan.funding.map((item) => item.source.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes sources that are nothing to do with the NDIS', () => {
    const ids = plan.funding.map((item) => item.source.id)
    expect(ids).toContain('commonwealth_rent_assistance')
  })

  it('says what each source does not pay for', () => {
    for (const item of plan.funding) {
      expect(item.source.doesNotPay.length, item.source.id).toBeGreaterThan(0)
    }
  })
})

describe('who can help depends on the situation', () => {
  it('offers a support coordinator to someone who has a plan', () => {
    const ids = planFor(PERSONA_A).organisations.map((organisation) => organisation.id)
    expect(ids).toContain('support-coordinator')
    expect(ids).not.toContain('local-area-coordinator')
  })

  it('offers a local contact to someone with no plan yet', () => {
    const ids = planFor({ ...PERSONA_A, 'ndis-context': 'no_ndis_plan' }).organisations.map(
      (organisation) => organisation.id,
    )
    expect(ids).toContain('local-area-coordinator')
    expect(ids).not.toContain('support-coordinator')
  })

  it('offers an occupational therapist when the building may need to change', () => {
    const ids = planFor(PERSONA_C).organisations.map((organisation) => organisation.id)
    expect(ids).toContain('occupational-therapist')
  })

  it('does not send someone staying put to a housing provider', () => {
    const stayingPut = {
      perspective: 'self',
      'current-living': 'own_home',
      'desired-change': 'more_support_where_they_are',
      'support-intensity': 'daily_brief',
      'overnight-support': 'none',
      'housing-features': 'none_known',
      'informal-support': 'some',
      timing: 'planning_ahead',
      'ndis-context': 'plan_with_home_and_living',
    }
    expect(
      planFor(stayingPut).organisations.map((organisation) => organisation.id),
    ).not.toContain('housing-provider')
  })

  it('always offers an advocate, because a decision can always be wrong', () => {
    for (const answers of [PERSONA_A, PERSONA_C, PERSONA_D]) {
      expect(
        planFor(answers).organisations.map((organisation) => organisation.id),
      ).toContain('advocacy-organisation')
    }
  })
})
