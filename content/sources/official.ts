import type { Source } from '@/lib/content/schema'

/**
 * Official sources.
 *
 * Every entry is `verified: false`. These URLs are the canonical pages for the
 * topics they cover, but nobody has yet opened them and confirmed that they
 * support the wording in this repository — and an automated check cannot do that
 * job. Until a person does, the interface says so rather than implying authority
 * it has not earned.
 *
 * To verify one: open it, confirm it supports the claim, set `verified: true`
 * and fill in `retrievedAt` and `reviewedAt`. The schema refuses a verified
 * source without both dates.
 */

function official(sourceUrl: string, sourceName: string): Source {
  return {
    sourceUrl,
    sourceName,
    sourceType: 'official',
    jurisdiction: 'Australia',
    verified: false,
  }
}

export const NDIS_HOME_AND_LIVING = official(
  'https://www.ndis.gov.au/participants/home-and-living',
  'NDIS — Home and living supports',
)

export const NDIS_SUPPORTED_INDEPENDENT_LIVING = official(
  'https://www.ndis.gov.au/participants/home-and-living/supported-independent-living',
  'NDIS — Supported Independent Living',
)

export const NDIS_INDIVIDUALISED_LIVING_OPTIONS = official(
  'https://www.ndis.gov.au/participants/home-and-living/individualised-living-options',
  'NDIS — Individualised Living Options',
)

export const NDIS_SPECIALIST_DISABILITY_ACCOMMODATION = official(
  'https://www.ndis.gov.au/participants/home-and-living/specialist-disability-accommodation',
  'NDIS — Specialist Disability Accommodation',
)

export const NDIS_MEDIUM_TERM_ACCOMMODATION = official(
  'https://www.ndis.gov.au/participants/home-and-living/medium-term-accommodation',
  'NDIS — Medium Term Accommodation',
)

export const NDIS_HOME_MODIFICATIONS = official(
  'https://www.ndis.gov.au/participants/home-and-living/home-modifications',
  'NDIS — Home modifications',
)

export const RENT_ASSISTANCE = official(
  'https://www.servicesaustralia.gov.au/rent-assistance',
  'Services Australia — Rent Assistance',
)

export const DISABILITY_SUPPORT_PENSION = official(
  'https://www.servicesaustralia.gov.au/disability-support-pension',
  'Services Australia — Disability Support Pension',
)

export const SOCIAL_HOUSING = official(
  'https://www.dss.gov.au/housing-support',
  'Department of Social Services — Housing support',
)
