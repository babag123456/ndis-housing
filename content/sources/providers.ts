import type { Source } from '@/lib/content/schema'

/**
 * Provider sources.
 *
 * Each is an organisation's own website, typed `provider` rather than `official`.
 * That typing carries a rule from CLAUDE.md: a provider's site describes its own
 * services, and is never authority for NDIS policy. A test stops any of these
 * being cited for a policy claim.
 *
 * `retrievedAt` records the date the page was read. `verified` stays false,
 * because verified means a person has read the source and confirmed it supports
 * what we say — and that has not happened yet. Retrieved is not verified.
 */
function providerSource(sourceUrl: string, sourceName: string, retrievedAt: string): Source {
  return {
    sourceUrl,
    sourceName,
    sourceType: 'provider',
    jurisdiction: 'Australia',
    retrievedAt,
    verified: false,
  }
}

const READ_ON = '2026-08-18'

export const SILC_SITE = providerSource(
  'https://www.silc.coop/',
  'Supporting Independent Living Co-operative — silc.coop',
  READ_ON,
)

export const HIREUP_SITE = providerSource(
  'https://hireup.com.au/',
  'Hireup — hireup.com.au',
  READ_ON,
)

/**
 * Hireup's own pages are rendered in the browser and could not be read directly.
 * The employment model below was taken from this submission to the Joint Standing
 * Committee on the NDIS, which is a public record rather than marketing.
 */
export const HIREUP_SUBMISSION: Source = {
  sourceUrl:
    'https://www.aph.gov.au/DocumentStore.ashx?id=aa5e6b20-13be-413e-9767-6b6efe325ae8&subId=732391',
  sourceName: 'Hireup — submission to the Joint Standing Committee on the NDIS (2022)',
  sourceType: 'provider',
  jurisdiction: 'Australia',
  retrievedAt: READ_ON,
  verified: false,
}

export const MABLE_SITE = providerSource(
  'https://mable.com.au/',
  'Mable — mable.com.au',
  READ_ON,
)

export const HOUSING_HUB_SITE = providerSource(
  'https://www.housinghub.org.au/',
  'Housing Hub — housinghub.org.au',
  READ_ON,
)
