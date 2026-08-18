import { describe, expect, it } from 'vitest'
import { FUNDING_SOURCES_CONTENT } from '@content/funding'
import { ORGANISATIONS } from '@content/organisations'
import { PATHWAYS } from '@content/pathways'
import { fundingSourceContentSchema, organisationSchema } from '@/lib/content/schema'
import { FUNDING_SOURCES } from '@/types/domain'

describe('funding content', () => {
  it('matches the schema', () => {
    for (const source of FUNDING_SOURCES_CONTENT) {
      expect(fundingSourceContentSchema.safeParse(source).success, source.id).toBe(true)
    }
  })

  it('covers every funding source the domain model knows about', () => {
    const ids = FUNDING_SOURCES_CONTENT.map((source) => source.id)
    for (const source of FUNDING_SOURCES) {
      expect(ids, source).toContain(source)
    }
  })

  it('covers every source the pathways draw on', () => {
    const ids = new Set(FUNDING_SOURCES_CONTENT.map((source) => source.id))
    for (const pathway of PATHWAYS) {
      for (const source of pathway.fundingSources) {
        expect(ids.has(source), `${pathway.id} needs ${source}`).toBe(true)
      }
    }
  })

  it('says what each source does not pay for', () => {
    // The gaps between sources are where people get caught out, so no source is
    // allowed to describe only what it covers.
    for (const source of FUNDING_SOURCES_CONTENT) {
      expect(source.doesNotPay.length, source.id).toBeGreaterThan(0)
    }
  })

  it('is explicit that the NDIS does not pay rent', () => {
    const ndis = FUNDING_SOURCES_CONTENT.find((source) => source.id === 'ndis')
    expect(ndis?.doesNotPay.join(' ').toLowerCase()).toContain('rent')
  })

  it('never promises an amount', () => {
    for (const source of FUNDING_SOURCES_CONTENT) {
      const prose = [
        source.description.simple,
        source.description.tellMeMore,
        source.description.detail,
        ...source.pays,
        ...source.doesNotPay,
      ].join(' ')
      expect(/\$\s?\d/.test(prose), source.id).toBe(false)
      expect(prose.toLowerCase().includes('you will receive'), source.id).toBe(false)
    }
  })
})

describe('organisation content', () => {
  it('matches the schema', () => {
    for (const organisation of ORGANISATIONS) {
      expect(organisationSchema.safeParse(organisation).success, organisation.id).toBe(true)
    }
  })

  it('has unique ids', () => {
    const ids = ORGANISATIONS.map((organisation) => organisation.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('tells a person how to find one', () => {
    for (const organisation of ORGANISATIONS) {
      expect(organisation.howToFind.length, organisation.id).toBeGreaterThan(10)
    }
  })

  it('names no specific organisation, because none has been verified', () => {
    // Inventing a named service would be worse than describing the role. If a
    // real directory is added, it needs verified sources and this test changes.
    const invented = ['pty ltd', 'incorporated', 'foundation of', '.com.au']
    for (const organisation of ORGANISATIONS) {
      const prose = [organisation.plainName, organisation.howToFind].join(' ').toLowerCase()
      for (const marker of invented) {
        expect(prose.includes(marker), `${organisation.id}: "${marker}"`).toBe(false)
      }
    }
  })

  it('carries a source for each entry', () => {
    for (const organisation of ORGANISATIONS) {
      expect(organisation.sources.length, organisation.id).toBeGreaterThan(0)
    }
  })
})
