/**
 * The four dimensions of a home and living arrangement.
 *
 * CLAUDE.md requires these stay independent: where someone lives, how they are
 * supported, who provides that support, and how each part is paid for are four
 * separate questions. Collapsing them is what makes the NDIS confusing in the
 * first place, so the domain model refuses to collapse them.
 */

/** Dimension 1 — where the person lives. */
export const HOUSING_KINDS = [
  'family_home',
  'private_rental',
  'owned_home',
  'social_housing',
  'specialist_disability_accommodation',
  'group_arrangement',
  'medium_term_accommodation',
  'other',
] as const
export type HousingKind = (typeof HOUSING_KINDS)[number]

/** Dimension 2 — how the person is supported. */
export const SUPPORT_KINDS = [
  'informal_support',
  'assistance_with_daily_life',
  'individualised_living_options',
  'supported_independent_living',
  'home_modifications',
  'other_supports',
] as const
export type SupportKind = (typeof SUPPORT_KINDS)[number]

/** Dimension 3 — who delivers a service. */
export const PROVIDER_KINDS = [
  'registered_provider',
  'unregistered_provider',
  'support_platform',
  'independent_worker',
  'housing_provider',
  'advocate',
  'allied_health',
] as const
export type ProviderKind = (typeof PROVIDER_KINDS)[number]

/** Dimension 4 — who pays for what. */
export const FUNDING_SOURCES = [
  'ndis',
  'disability_support_pension',
  'commonwealth_rent_assistance',
  'state_housing_assistance',
  'personal_income',
  'other_mainstream',
] as const
export type FundingSource = (typeof FUNDING_SOURCES)[number]

/**
 * How relevant a pathway appears, given what the person has told us.
 *
 * Deliberately never expresses eligibility. The NDIS makes that decision.
 */
export const MATCH_STATES = [
  'strong_match',
  'worth_exploring',
  'needs_more_information',
  'lower_relevance',
] as const
export type MatchState = (typeof MATCH_STATES)[number]
