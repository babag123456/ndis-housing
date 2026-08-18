import { z } from 'zod'

/**
 * The structured participant profile.
 *
 * The navigator stores this, not a list of question answers. Questions are one
 * way to fill the profile in; the decision engine (Phase 2) reads only the
 * profile, so the question set can change without touching the rules.
 */

/** Who the user is exploring for. Establishes the voice of every later screen. */
export const userPerspectiveSchema = z.enum([
  'self',
  'parent',
  'carer',
  'family',
  'professional',
  'other',
])
export type UserPerspective = z.infer<typeof userPerspectiveSchema>

/**
 * Every answer may be "I'm not sure". Uncertainty is a real answer that the
 * decision engine must be able to act on, not missing data to be guessed at.
 */
export const UNSURE = 'unsure' as const

export const currentLivingSchema = z.enum([
  'family_home',
  'own_rental',
  'own_home',
  'social_housing',
  'shared_with_support',
  'specialist_housing',
  'no_stable_home',
  'other',
  UNSURE,
])
export type CurrentLiving = z.infer<typeof currentLivingSchema>

export const desiredLivingSchema = z.enum([
  'stay_where_they_are',
  'own_place_alone',
  'own_place_with_chosen_people',
  'shared_home_with_support',
  'stay_with_family_adjusted',
  UNSURE,
])
export type DesiredLiving = z.infer<typeof desiredLivingSchema>

export const desiredChangeSchema = z.enum([
  'move_out_of_family_home',
  'more_independence',
  'more_support_where_they_are',
  'change_who_they_live_with',
  'leave_unsuitable_arrangement',
  'plan_for_the_future',
  UNSURE,
])
export type DesiredChange = z.infer<typeof desiredChangeSchema>

export const supportIntensitySchema = z.enum([
  'occasional',
  'daily_brief',
  'daily_extensive',
  'several_times_daily',
  UNSURE,
])
export type SupportIntensity = z.infer<typeof supportIntensitySchema>

export const overnightSupportSchema = z.enum([
  'none',
  'occasional',
  'most_nights',
  'someone_always_available',
  UNSURE,
])
export type OvernightSupport = z.infer<typeof overnightSupportSchema>

export const housingFeatureNeedSchema = z.enum([
  'none_known',
  'small_changes',
  'substantial_changes',
  'purpose_built',
  UNSURE,
])
export type HousingFeatureNeed = z.infer<typeof housingFeatureNeedSchema>

export const informalSupportSchema = z.enum([
  'strong_and_ongoing',
  'some',
  'very_little',
  'none',
  UNSURE,
])
export type InformalSupport = z.infer<typeof informalSupportSchema>

export const timingSchema = z.enum([
  'urgent',
  'within_a_year',
  'planning_ahead',
  UNSURE,
])
export type Timing = z.infer<typeof timingSchema>

/**
 * Deliberately coarse. Some options are only open to adults, which is the only
 * thing the rules need to know, so the navigator asks for the least it can.
 */
export const lifeStageSchema = z.enum(['under_18', 'adult', UNSURE])
export type LifeStage = z.infer<typeof lifeStageSchema>

export const ndisContextSchema = z.enum([
  'no_ndis_plan',
  'plan_without_home_and_living',
  'plan_with_home_and_living',
  'plan_under_review',
  UNSURE,
])
export type NdisContext = z.infer<typeof ndisContextSchema>

/**
 * Where the person lives, only as far as the content needs.
 *
 * State-specific bodies differ — a New South Wales tribunal has no standing
 * elsewhere — so jurisdiction-tagged content is filtered on this. Only New South
 * Wales is written, and everyone else is told so plainly rather than shown
 * nothing.
 */
export const stateSchema = z.enum(['nsw', 'other', UNSURE])
export type AustralianState = z.infer<typeof stateSchema>

/**
 * Housing, support and context stay in separate branches so that a change to
 * how someone is supported never implies a change to where they live.
 */
export const participantProfileSchema = z.object({
  perspective: userPerspectiveSchema.nullable(),
  housing: z.object({
    current: currentLivingSchema.nullable(),
    desired: desiredLivingSchema.nullable(),
    featureNeeds: housingFeatureNeedSchema.nullable(),
  }),
  support: z.object({
    dailyIntensity: supportIntensitySchema.nullable(),
    overnight: overnightSupportSchema.nullable(),
    informal: informalSupportSchema.nullable(),
  }),
  goals: z.object({
    change: desiredChangeSchema.nullable(),
  }),
  context: z.object({
    lifeStage: lifeStageSchema.nullable(),
    timing: timingSchema.nullable(),
    ndis: ndisContextSchema.nullable(),
    state: stateSchema.nullable(),
  }),
  /** Question ids the person answered "I'm not sure". Drives honest results. */
  uncertainties: z.array(z.string()),
})
export type ParticipantProfile = z.infer<typeof participantProfileSchema>

export function createEmptyProfile(): ParticipantProfile {
  return {
    perspective: null,
    housing: { current: null, desired: null, featureNeeds: null },
    support: { dailyIntensity: null, overnight: null, informal: null },
    goals: { change: null },
    context: { lifeStage: null, timing: null, ndis: null, state: null },
    uncertainties: [],
  }
}
