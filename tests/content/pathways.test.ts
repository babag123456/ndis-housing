import { describe, expect, it } from 'vitest'
import { PATHWAYS } from '@content/pathways'
import { pathwaySchema, type Pathway } from '@/lib/content/schema'
import { PATHWAY_RULES, pathwayRulesSchema } from '@/lib/decision-engine'

/** Every string a person could read about a pathway. */
function allProse(pathway: Pathway): string[] {
  return [
    pathway.plainName,
    pathway.formalName ?? '',
    pathway.description.simple,
    pathway.description.tellMeMore,
    pathway.description.detail,
    pathway.nextStep,
    ...pathway.mayNotFit,
    ...pathway.questionsToAsk,
    ...pathway.evidence,
    ...pathway.fundingNotes,
  ]
}

describe('pathway content', () => {
  it('matches the schema', () => {
    for (const pathway of PATHWAYS) {
      expect(pathwaySchema.safeParse(pathway).success, pathway.id).toBe(true)
    }
  })

  it('has unique ids', () => {
    const ids = PATHWAYS.map((pathway) => pathway.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('covers the pathways the specification requires', () => {
    const ids = PATHWAYS.map((pathway) => pathway.id)
    for (const required of [
      'assistance-with-daily-life',
      'individualised-living-options',
      'supported-independent-living',
      'specialist-disability-accommodation',
      'home-modifications',
      'medium-term-accommodation',
    ]) {
      expect(ids, required).toContain(required)
    }
  })

  it('keeps mainstream housing separate from NDIS-funded support', () => {
    const mainstream = PATHWAYS.filter(
      (pathway) => !pathway.fundingSources.includes('ndis'),
    )
    expect(mainstream.length).toBeGreaterThan(0)
    for (const pathway of mainstream) {
      expect(pathway.dimension, pathway.id).toBe('housing')
    }
  })
})

describe('nothing claims eligibility', () => {
  // The product is a navigator, not an assessor. These words would make it one.
  const FORBIDDEN = [
    'you qualify',
    'they qualify',
    'qualifies for',
    'eligible',
    'eligibility',
    'is approved',
    'will be funded',
    'will receive',
    'guaranteed',
    'entitled to',
  ]

  it('appears nowhere in pathway content', () => {
    for (const pathway of PATHWAYS) {
      const prose = allProse(pathway).join(' ').toLowerCase()
      for (const phrase of FORBIDDEN) {
        expect(prose.includes(phrase), `${pathway.id}: "${phrase}"`).toBe(false)
      }
    }
  })

  it('appears nowhere in the reasons the engine gives', () => {
    for (const rules of PATHWAY_RULES) {
      const prose = [
        ...rules.supports.flatMap((signal) => [signal.reason.self, signal.reason.other]),
        ...rules.against.flatMap((signal) => [signal.reason.self, signal.reason.other]),
      ]
        .join(' ')
        .toLowerCase()
      for (const phrase of FORBIDDEN) {
        expect(prose.includes(phrase), `${rules.pathwayId}: "${phrase}"`).toBe(false)
      }
    }
  })

  /*
   * A funding note is allowed to take one of three shapes, and nothing else:
   * a hedged possibility, an explicit statement that something is NOT funded, or
   * a description of what the person pays themselves. An unhedged "this is
   * funded" is the thing that would mislead someone.
   */
  const HEDGED = /\b(may|can|usually|generally|often|sometimes)\b/i
  const NEGATIVE_CLAIM = /\bnot funded\b/i
  const PAID_PRIVATELY =
    /\b(paid privately|contribut\w*|everyday living costs|proportion of income)\b/i

  it('never states funding as a promise', () => {
    for (const pathway of PATHWAYS) {
      for (const note of pathway.fundingNotes) {
        const acceptable =
          HEDGED.test(note) || NEGATIVE_CLAIM.test(note) || PAID_PRIVATELY.test(note)
        expect(acceptable, `${pathway.id}: "${note}"`).toBe(true)
      }
    }
  })

  it('catches an unhedged funding promise', () => {
    // Guards the guard: the rule above has to reject the thing it exists to reject.
    const promise = 'The NDIS funds this and you will receive support from July.'
    const acceptable =
      HEDGED.test(promise) || NEGATIVE_CLAIM.test(promise) || PAID_PRIVATELY.test(promise)
    expect(acceptable).toBe(false)
  })
})

describe('acronyms wait for their full term', () => {
  it('never appears before the full name it stands for', () => {
    for (const pathway of PATHWAYS) {
      if (pathway.acronym === undefined) continue
      const { acronym, formalName } = pathway
      expect(formalName, `${pathway.id} has an acronym but no full name`).toBeDefined()

      for (const prose of allProse(pathway)) {
        const acronymAt = prose.indexOf(acronym)
        if (acronymAt === -1) continue
        const fullNameAt = prose.indexOf(formalName as string)
        expect(
          fullNameAt !== -1 && fullNameAt < acronymAt,
          `${pathway.id}: "${prose}" uses ${acronym} before ${formalName}`,
        ).toBe(true)
      }
    }
  })
})

describe('every factual claim carries a source', () => {
  it('gives each pathway at least one official source', () => {
    for (const pathway of PATHWAYS) {
      expect(pathway.sources.length, pathway.id).toBeGreaterThan(0)
      expect(
        pathway.sources.some((source) => source.sourceType === 'official'),
        pathway.id,
      ).toBe(true)
    }
  })

  it('refuses to mark a source verified without the dates that prove it', () => {
    const claimed = pathwaySchema.shape.sources.element.safeParse({
      sourceUrl: 'https://www.ndis.gov.au/participants/home-and-living',
      sourceName: 'NDIS — Home and living supports',
      sourceType: 'official',
      verified: true,
    })
    expect(claimed.success).toBe(false)
  })

  it('has no source claiming to be verified yet', () => {
    // Nobody has opened these pages and confirmed them. The interface says so.
    for (const pathway of PATHWAYS) {
      for (const source of pathway.sources) {
        expect(source.verified, `${pathway.id}: ${source.sourceUrl}`).toBe(false)
      }
    }
  })
})

describe('rules and content stay in step', () => {
  it('every rule set matches the schema', () => {
    for (const rules of PATHWAY_RULES) {
      expect(pathwayRulesSchema.safeParse(rules).success, rules.pathwayId).toBe(true)
    }
  })

  it('every pathway has rules, and every rule set has a pathway', () => {
    const pathwayIds = new Set(PATHWAYS.map((pathway) => pathway.id))
    const ruleIds = new Set(PATHWAY_RULES.map((rules) => rules.pathwayId))
    expect([...ruleIds].filter((id) => !pathwayIds.has(id))).toEqual([])
    expect([...pathwayIds].filter((id) => !ruleIds.has(id))).toEqual([])
  })

  it('never needs more supporting signals than it has', () => {
    for (const rules of PATHWAY_RULES) {
      expect(rules.strongWhenAtLeast, rules.pathwayId).toBeLessThanOrEqual(
        rules.supports.length,
      )
    }
  })
})

describe('the writing keeps its distance out of it', () => {
  /*
   * "The person" is the same distancing register as "the consumer" or "the case".
   * The plain names of options may use it — "around the person" describes the
   * option itself — but nothing a reader is told about their own situation should.
   */
  it('never calls someone "the person" in prose', () => {
    for (const pathway of PATHWAYS) {
      const prose = [
        pathway.description.simple,
        pathway.description.tellMeMore,
        pathway.description.detail,
        pathway.nextStep,
        ...pathway.mayNotFit,
        ...pathway.questionsToAsk,
        ...pathway.evidence,
        ...pathway.fundingNotes,
      ]
      for (const line of prose) {
        expect(line.toLowerCase().includes('the person'), `${pathway.id}: "${line}"`).toBe(
          false,
        )
      }
    }
  })

  it('never uses the words the specification rules out', () => {
    const banned = ['consumer', 'sufferer', 'special needs', 'the subject', 'wheelchair-bound']
    for (const pathway of PATHWAYS) {
      const prose = allProse(pathway).join(' ').toLowerCase()
      for (const word of banned) {
        expect(prose.includes(word), `${pathway.id}: "${word}"`).toBe(false)
      }
    }
  })
})
