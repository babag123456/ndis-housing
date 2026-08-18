import { describe, expect, it } from 'vitest'
import { PATHWAYS } from '@content/pathways'
import { evaluatePathways } from '@/lib/decision-engine'
import { evaluateFlow } from '@/lib/navigator/flow'
import { HOME_AND_LIVING } from '@/tracks/home-and-living'
import type { AnswerMap } from '@/lib/navigator/question-schema'
import type { MatchState } from '@/types/domain'
import {
  PERSONA_A,
  PERSONA_B,
  PERSONA_C,
  PERSONA_D,
} from '../fixtures/personas'

function assess(answers: AnswerMap) {
  const { profile } = evaluateFlow(answers)
  const results = evaluatePathways(
    profile,
    HOME_AND_LIVING.rules ?? [],
    HOME_AND_LIVING.questions,
  )
  return {
    results,
    stateOf(pathwayId: string): MatchState {
      const result = results.find((candidate) => candidate.pathwayId === pathwayId)
      if (!result) throw new Error(`no assessment for ${pathwayId}`)
      return result.state
    },
    resultFor(pathwayId: string) {
      const result = results.find((candidate) => candidate.pathwayId === pathwayId)
      if (!result) throw new Error(`no assessment for ${pathwayId}`)
      return result
    },
  }
}

describe('the engine assesses every pathway', () => {
  it('returns exactly one assessment per pathway', () => {
    const { results } = assess(PERSONA_A)
    expect(results.map((result) => result.pathwayId).sort()).toEqual(
      PATHWAYS.map((pathway) => pathway.id).sort(),
    )
  })

  it('is deterministic: the same profile gives the same answer', () => {
    const first = assess(PERSONA_C).results
    const second = assess(PERSONA_C).results
    expect(second).toEqual(first)
  })

  it('gives a reason for anything it puts forward', () => {
    const { results } = assess(PERSONA_A)
    for (const result of results) {
      if (result.state === 'strong_match' || result.state === 'worth_exploring') {
        expect(result.reasons.length, result.pathwayId).toBeGreaterThan(0)
      }
    }
  })
})

describe('persona A — wants their own place, needs a little help most days', () => {
  const { stateOf, resultFor } = assess(PERSONA_A)

  it('puts building an arrangement around the person forward strongly', () => {
    expect(stateOf('individualised-living-options')).toBe('strong_match')
  })

  it('puts regular help at home forward strongly', () => {
    expect(stateOf('assistance-with-daily-life')).toBe('strong_match')
  })

  it('does not put a shared supported home forward', () => {
    expect(stateOf('supported-independent-living')).toBe('lower_relevance')
  })

  it('does not suggest specialist housing when no building need was reported', () => {
    expect(stateOf('specialist-disability-accommodation')).toBe('lower_relevance')
  })

  it('explains itself using the answers the person actually gave', () => {
    const result = resultFor('individualised-living-options')
    const reasons = result.reasons.map((reason) => reason.self)
    expect(reasons.join(' ')).toContain('own place')
  })

  it('has nothing left to ask about, so nothing is marked uncertain', () => {
    expect(resultFor('individualised-living-options').openQuestions).toEqual([])
  })
})

describe('persona B — a parent, adult child, someone needed at all times', () => {
  const { stateOf, resultFor } = assess(PERSONA_B)

  it('puts a shared supported home forward strongly', () => {
    expect(stateOf('supported-independent-living')).toBe('strong_match')
  })

  it('rules out building an arrangement around the person, and says why', () => {
    const result = resultFor('individualised-living-options')
    expect(result.state).toBe('lower_relevance')
    expect(result.cautions.map((caution) => caution.other).join(' ')).toContain('shared home')
  })

  it('does not infer a specialist building need from a high support need', () => {
    expect(stateOf('specialist-disability-accommodation')).toBe('lower_relevance')
  })
})

describe('persona C — high physical access needs, urgent', () => {
  const { stateOf } = assess(PERSONA_C)

  it('puts a purpose-built home forward strongly', () => {
    expect(stateOf('specialist-disability-accommodation')).toBe('strong_match')
  })

  it('raises a temporary place to stay, but not as a strong match', () => {
    // Revised deliberately: this option is a bridge to a home that has already
    // been found, and this persona has not found one. Calling it a strong match
    // would contradict the option's own "may not fit" content.
    expect(stateOf('medium-term-accommodation')).toBe('worth_exploring')
  })

  it('keeps mainstream housing on the table alongside NDIS support', () => {
    expect(stateOf('private-rental')).toBe('strong_match')
  })
})

describe('persona D — unsure of everything', () => {
  const { results, resultFor } = assess(PERSONA_D)

  it('assumes nothing: every pathway needs more information', () => {
    for (const result of results) {
      expect(result.state, result.pathwayId).toBe('needs_more_information')
    }
  })

  it('never claims a pathway is a strong match', () => {
    expect(results.some((result) => result.state === 'strong_match')).toBe(false)
  })

  it('names the questions that would settle it', () => {
    const result = resultFor('specialist-disability-accommodation')
    expect(result.openQuestions.map((open) => open.questionId)).toContain(
      'housing-features',
    )
  })
})

describe('an adults-only option is never put forward for a child', () => {
  const childAnswers: AnswerMap = {
    perspective: 'parent',
    'current-living': 'family_home',
    'desired-change': 'move_out_of_family_home',
    'desired-living': 'own_place_with_chosen_people',
    'life-stage': 'under_18',
    'support-intensity': 'daily_extensive',
    'overnight-support': 'most_nights',
    'housing-features': 'none_known',
    'informal-support': 'strong_and_ongoing',
    timing: 'planning_ahead',
    'ndis-context': 'plan_with_home_and_living',
  }

  it('marks it lower relevance and explains that it is for adults', () => {
    const { resultFor } = assess(childAnswers)
    const result = resultFor('individualised-living-options')
    expect(result.state).toBe('lower_relevance')
    expect(result.cautions.map((caution) => caution.other).join(' ')).toContain('adults')
  })

  it('does not put a shared supported home forward for a child either', () => {
    const { stateOf } = assess(childAnswers)
    expect(stateOf('supported-independent-living')).toBe('lower_relevance')
  })
})

describe('a pathway that does not do what was asked for is not put forward', () => {
  it('does not offer a shared home to someone who wants to choose who they live with', () => {
    const { resultFor } = assess(PERSONA_C)
    const result = resultFor('supported-independent-living')
    expect(result.state).toBe('lower_relevance')
    expect(result.cautions.map((caution) => caution.other).join(' ')).toContain(
      'sharing a home',
    )
  })

  it('does not offer a shared home to someone who wants to live alone', () => {
    const { resultFor } = assess(PERSONA_A)
    expect(resultFor('supported-independent-living').state).toBe('lower_relevance')
  })

  it('still offers a shared home to someone who asked for one', () => {
    const { stateOf } = assess(PERSONA_B)
    expect(stateOf('supported-independent-living')).toBe('strong_match')
  })
})

