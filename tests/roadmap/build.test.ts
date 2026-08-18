import { describe, expect, it } from 'vitest'
import { ROADMAP_STAGES, buildRoadmap, explainRoadmap } from '@/lib/roadmap'
import { evaluateFlow } from '@/lib/navigator/flow'
import { voiceFor } from '@/lib/copy/perspective'
import {
  PERSONA_A,
  PERSONA_B,
  PERSONA_C,
  PERSONA_D,
} from '../fixtures/personas'

function roadmapFor(answers: Record<string, string>) {
  const { profile } = evaluateFlow(answers)
  const steps = buildRoadmap(profile)
  return { profile, steps, ids: steps.map((step) => step.id) }
}

describe('the roadmap is built from the person, not from a template', () => {
  it('gives everyone something to do', () => {
    for (const [name, answers] of Object.entries({
      A: PERSONA_A,
      B: PERSONA_B,
      C: PERSONA_C,
      D: PERSONA_D,
    })) {
      expect(roadmapFor(answers).steps.length, name).toBeGreaterThan(3)
    }
  })

  it('gives different people different roadmaps', () => {
    expect(roadmapFor(PERSONA_A).ids).not.toEqual(roadmapFor(PERSONA_C).ids)
  })

  it('is deterministic', () => {
    expect(roadmapFor(PERSONA_B).ids).toEqual(roadmapFor(PERSONA_B).ids)
  })

  it('runs in stage order', () => {
    const { steps } = roadmapFor(PERSONA_C)
    const positions = steps.map((step) => ROADMAP_STAGES.indexOf(step.stage))
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(positions.every((position) => position >= 0)).toBe(true)
  })

  it('never repeats a step', () => {
    const { ids } = roadmapFor(PERSONA_C)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every step something to understand, prepare and do', () => {
    const { steps } = roadmapFor(PERSONA_A)
    for (const step of steps) {
      expect(step.understand.length, step.id).toBeGreaterThan(0)
      expect(step.prepare.length, step.id).toBeGreaterThan(0)
      expect(step.doNow.length, step.id).toBeGreaterThan(0)
    }
  })
})

describe('urgency changes the order, not just the words', () => {
  it('puts finding somewhere safe first when the situation cannot hold', () => {
    const { ids } = roadmapFor(PERSONA_C)
    expect(ids[0]).toBe('somewhere-safe-now')
  })

  it('leaves it out when there is time', () => {
    expect(roadmapFor(PERSONA_A).ids).not.toContain('somewhere-safe-now')
  })
})

describe('the NDIS step matches what is actually happening with the plan', () => {
  it('asks someone with no plan to look at access first', () => {
    const { ids } = roadmapFor({ ...PERSONA_A, 'ndis-context': 'no_ndis_plan' })
    expect(ids).toContain('check-ndis-access')
    expect(ids).not.toContain('review-home-and-living-supports')
  })

  it('asks someone with a plan but no home supports to request them', () => {
    const { ids } = roadmapFor(PERSONA_A)
    expect(ids).toContain('request-home-and-living-supports')
    expect(ids).not.toContain('review-home-and-living-supports')
  })

  it('asks someone who already has home supports to review them', () => {
    const { ids } = roadmapFor(PERSONA_B)
    expect(ids).toContain('review-home-and-living-supports')
    expect(ids).not.toContain('request-home-and-living-supports')
  })

  it('asks someone who does not know to find out what the plan includes', () => {
    const { ids } = roadmapFor(PERSONA_D)
    expect(ids).toContain('find-out-what-the-plan-includes')
  })
})

describe('a person staying put is not sent looking for a home', () => {
  const stayingPut = {
    perspective: 'self',
    'current-living': 'own_rental',
    'desired-change': 'more_support_where_they_are',
    'support-intensity': 'daily_extensive',
    'overnight-support': 'occasional',
    'housing-features': 'small_changes',
    'informal-support': 'some',
    timing: 'planning_ahead',
    'ndis-context': 'plan_without_home_and_living',
  }

  it('leaves out finding a home and moving in', () => {
    const { ids } = roadmapFor(stayingPut)
    expect(ids).not.toContain('find-a-home')
    expect(ids).not.toContain('move-in')
  })

  it('still includes arranging changes to the home', () => {
    expect(roadmapFor(stayingPut).ids).toContain('arrange-home-changes')
  })
})

describe('the roadmap speaks in the right voice', () => {
  it('addresses someone exploring for themselves directly', () => {
    const { profile } = roadmapFor(PERSONA_A)
    const steps = explainRoadmap(profile, voiceFor('self'))
    expect(steps.map((step) => step.title).join(' ')).toContain('your')
  })

  it('speaks about the person for a parent', () => {
    const { profile } = roadmapFor(PERSONA_B)
    const steps = explainRoadmap(profile, voiceFor('parent'))
    const prose = steps.flatMap((step) => [step.title, step.why, ...step.doNow]).join(' ')
    expect(prose).toContain('their')
    expect(prose).not.toContain('the person you support')
  })
})
