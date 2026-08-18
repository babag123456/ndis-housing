import { describe, expect, it } from 'vitest'
import { ROADMAP_STEPS } from '@/tracks/home-and-living/steps'
import { ROADMAP_STAGES, roadmapStepSchema } from '@/lib/roadmap'

describe('roadmap step content', () => {
  it('matches the schema', () => {
    for (const step of ROADMAP_STEPS) {
      expect(roadmapStepSchema.safeParse(step).success, step.id).toBe(true)
    }
  })

  it('has unique ids', () => {
    const ids = ROADMAP_STEPS.map((step) => step.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('is authored in stage order, so ties break sensibly', () => {
    const positions = ROADMAP_STEPS.map((step) => ROADMAP_STAGES.indexOf(step.stage))
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it('never promises an outcome', () => {
    const forbidden = ['will be funded', 'will receive', 'eligible', 'guaranteed', 'approved']
    for (const step of ROADMAP_STEPS) {
      const prose = [
        step.title.self,
        step.title.other,
        step.why.self,
        step.why.other,
        ...step.understand.flatMap((item) => [item.self, item.other]),
        ...step.prepare.flatMap((item) => [item.self, item.other]),
        ...step.doNow.flatMap((item) => [item.self, item.other]),
      ]
        .join(' ')
        .toLowerCase()
      for (const phrase of forbidden) {
        expect(prose.includes(phrase), `${step.id}: "${phrase}"`).toBe(false)
      }
    }
  })

  it('never says "the person you support"', () => {
    for (const step of ROADMAP_STEPS) {
      const prose = [step.title.other, step.why.other, ...step.doNow.map((i) => i.other)].join(' ')
      expect(prose.includes('the person you support'), step.id).toBe(false)
    }
  })
})
