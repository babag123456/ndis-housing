import { describe, expect, it } from 'vitest'
import { FUNDING_SOURCES_CONTENT } from '@content/funding'
import { ORGANISATIONS } from '@content/organisations'
import { PATHWAYS } from '@content/pathways'
import { PROVIDERS, providersForRole } from '@content/providers'
import { providerSchema } from '@/lib/content/schema'

/**
 * Naming real organisations raises risks that describing roles did not, so these
 * are the rules that replace "name nobody": say only what they say about
 * themselves, cite their own site as a provider source, never let a provider
 * stand behind a policy claim, and never read like a recommendation.
 */
describe('provider content', () => {
  it('matches the schema', () => {
    for (const provider of PROVIDERS) {
      expect(providerSchema.safeParse(provider).success, provider.id).toBe(true)
    }
  })

  it('has unique ids', () => {
    const ids = PROVIDERS.map((provider) => provider.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('is ordered alphabetically, so the order implies no ranking', () => {
    const ids = PROVIDERS.map((provider) => provider.id)
    expect(ids).toEqual([...ids].sort())
  })

  it('claims only roles that actually exist', () => {
    const roleIds = new Set(ORGANISATIONS.map((organisation) => organisation.id))
    for (const provider of PROVIDERS) {
      for (const role of provider.roles) {
        expect(roleIds.has(role), `${provider.id} claims unknown role ${role}`).toBe(true)
      }
    }
  })

  it('can be found by role', () => {
    expect(providersForRole('support-provider').map((provider) => provider.id)).toContain(
      'hireup',
    )
    expect(providersForRole('a-role-nobody-plays')).toEqual([])
  })
})

describe('a provider never stands behind a policy claim', () => {
  it('cites only provider-typed sources for itself', () => {
    for (const provider of PROVIDERS) {
      for (const source of provider.sources) {
        expect(source.sourceType, `${provider.id}: ${source.sourceUrl}`).toBe('provider')
      }
    }
  })

  it('never appears as a source for what a pathway is', () => {
    // CLAUDE.md: a provider site describes its own services and is never
    // authority for NDIS policy.
    for (const pathway of PATHWAYS) {
      for (const source of pathway.sources) {
        expect(source.sourceType, `${pathway.id}: ${source.sourceUrl}`).toBe('official')
      }
    }
  })

  it('never appears as a source for how funding works', () => {
    for (const funding of FUNDING_SOURCES_CONTENT) {
      for (const source of funding.sources) {
        expect(source.sourceType, `${funding.id}: ${source.sourceUrl}`).toBe('official')
      }
    }
  })

  it('records when its page was read, and claims no verification', () => {
    for (const provider of PROVIDERS) {
      for (const source of provider.sources) {
        expect(source.retrievedAt, `${provider.id}: ${source.sourceUrl}`).toBeDefined()
        // Retrieved is not verified. Verified means a person confirmed it.
        expect(source.verified, `${provider.id}: ${source.sourceUrl}`).toBe(false)
      }
    }
  })
})

describe('nothing reads like a recommendation', () => {
  const MARKETING = [
    'best',
    'leading',
    'recommended',
    'award-winning',
    'trusted',
    'number one',
    'we recommend',
    'top ',
    'most popular',
  ]

  it('appears nowhere in provider copy', () => {
    for (const provider of PROVIDERS) {
      const prose = [
        provider.describesItselfAs,
        provider.coverage,
        ...provider.worthKnowing,
        ...provider.questionsToAsk,
      ]
        .join(' ')
        .toLowerCase()
      for (const phrase of MARKETING) {
        expect(prose.includes(phrase), `${provider.id}: "${phrase}"`).toBe(false)
      }
    }
  })

  it('does not assert NDIS registration where the site did not say so', () => {
    for (const provider of PROVIDERS) {
      if (provider.ndisRegistration === 'states_registered') continue
      const prose = [provider.describesItselfAs, ...provider.worthKnowing]
        .join(' ')
        .toLowerCase()
      expect(prose.includes('is an ndis-registered'), provider.id).toBe(false)
      expect(prose.includes('is ndis registered'), provider.id).toBe(false)
    }
  })

  it('gives every provider questions to ask it', () => {
    // A named organisation without questions to ask it is an advert.
    for (const provider of PROVIDERS) {
      expect(provider.questionsToAsk.length, provider.id).toBeGreaterThan(1)
    }
  })
})

describe('roles describe jobs, not organisations', () => {
  it('never names a provider', () => {
    const names = PROVIDERS.map((provider) => provider.name.split(' (')[0] as string)
    for (const organisation of ORGANISATIONS) {
      const prose = [
        organisation.plainName,
        organisation.howToFind,
        organisation.description.simple,
        organisation.description.tellMeMore,
        organisation.description.detail,
      ].join(' ')
      for (const name of names) {
        expect(prose.includes(name), `${organisation.id} names ${name}`).toBe(false)
      }
    }
  })
})

describe('funding says how to apply without saying who succeeds', () => {
  it('gives an application route wherever there is something to apply for', () => {
    const applicable = ['ndis', 'disability_support_pension', 'commonwealth_rent_assistance', 'state_housing_assistance']
    for (const id of applicable) {
      const source = FUNDING_SOURCES_CONTENT.find((candidate) => candidate.id === id)
      expect(source?.howToApply, id).toBeDefined()
      expect(source?.howToApply?.steps.length, id).toBeGreaterThan(0)
    }
  })

  it('names who to start with, not just what to do', () => {
    for (const source of FUNDING_SOURCES_CONTENT) {
      if (!source.howToApply) continue
      expect(source.howToApply.startWith.length, source.id).toBeGreaterThan(10)
    }
  })

  it('states no rule about who qualifies and no amount', () => {
    for (const source of FUNDING_SOURCES_CONTENT) {
      if (!source.howToApply) continue
      const prose = [source.howToApply.startWith, ...source.howToApply.steps]
        .join(' ')
        .toLowerCase()
      for (const phrase of ['eligible', 'qualify', 'you will receive', 'guaranteed']) {
        expect(prose.includes(phrase), `${source.id}: "${phrase}"`).toBe(false)
      }
      expect(/\$\s?\d/.test(prose), source.id).toBe(false)
    }
  })
})
