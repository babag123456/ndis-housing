/**
 * The four personas from the specification, shared by the flow, persona and
 * decision-engine suites so that all three describe the same people.
 *
 * Typed as a plain record rather than through a path alias so the Playwright
 * suite can import the same fixtures as the unit tests.
 */
type Answers = Record<string, string>

/** Exploring for themselves: at home, wants to move out, daily but not constant help. */
export const PERSONA_A: Answers = {
  perspective: 'self',
  'current-living': 'family_home',
  'desired-change': 'move_out_of_family_home',
  'desired-living': 'own_place_alone',
  'life-stage': 'adult',
  'support-intensity': 'daily_brief',
  'overnight-support': 'none',
  'housing-features': 'none_known',
  'informal-support': 'some',
  timing: 'within_a_year',
  'ndis-context': 'plan_without_home_and_living',
}

/** A parent, for their adult child: shared arrangement, overnight availability. */
export const PERSONA_B: Answers = {
  perspective: 'parent',
  'current-living': 'family_home',
  'desired-change': 'move_out_of_family_home',
  'desired-living': 'shared_home_with_support',
  'life-stage': 'adult',
  'support-intensity': 'daily_extensive',
  'overnight-support': 'someone_always_available',
  'housing-features': 'none_known',
  'informal-support': 'strong_and_ongoing',
  timing: 'urgent',
  'ndis-context': 'plan_with_home_and_living',
}

/** A carer: high physical access needs, specialist housing features likely. */
export const PERSONA_C: Answers = {
  perspective: 'carer',
  'current-living': 'family_home',
  'desired-change': 'leave_unsuitable_arrangement',
  'desired-living': 'own_place_with_chosen_people',
  'life-stage': 'adult',
  'support-intensity': 'several_times_daily',
  'overnight-support': 'most_nights',
  'housing-features': 'purpose_built',
  'informal-support': 'very_little',
  timing: 'urgent',
  'ndis-context': 'plan_under_review',
}

/** Unsure of everything that can be answered "I'm not sure". */
export const PERSONA_D: Answers = {
  perspective: 'other',
  'current-living': 'other',
  'desired-change': 'unsure',
  'desired-living': 'unsure',
  'life-stage': 'unsure',
  'support-intensity': 'unsure',
  'overnight-support': 'unsure',
  'housing-features': 'unsure',
  'informal-support': 'unsure',
  timing: 'unsure',
  'ndis-context': 'unsure',
}
