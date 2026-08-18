import { z } from 'zod'
import { profileFieldSchema, type ProfileField } from '@/lib/navigator/question-schema'
import type { CopyVariants } from '@/lib/copy/perspective'

/**
 * The rules.
 *
 * Explicit configuration rather than nested conditionals: each clause names a
 * profile field and the values that trigger it, and carries the sentence shown
 * to the person when it does. A reason and the condition that produced it cannot
 * drift apart, because they are the same object.
 *
 * No rule reads a diagnosis, and there is no diagnosis in the profile to read.
 * Every clause below is about function, preference, timing or the building.
 */

const copyVariantsSchema = z.object({
  self: z.string().min(1),
  other: z.string().min(1),
})

/** A condition on one profile field. All clauses in a signal must hold. */
export const clauseSchema = z.object({
  field: profileFieldSchema,
  oneOf: z.array(z.string().min(1)).min(1),
})
export type Clause = z.infer<typeof clauseSchema>

/** A reason this pathway may suit, and the answers that say so. */
export const signalSchema = z.object({
  when: z.array(clauseSchema).min(1),
  reason: copyVariantsSchema,
})

/** A reason this pathway may not suit. */
export const counterSignalSchema = z.object({
  when: z.array(clauseSchema).min(1),
  reason: copyVariantsSchema,
  /**
   * A blocking counter-signal drops the pathway to lower relevance on its own.
   * Reserve it for cases where the option genuinely does not do what the person
   * asked for — never for a hunch about how likely funding is.
   */
  blocking: z.boolean(),
})

export const pathwayRulesSchema = z.object({
  pathwayId: z.string().min(1),
  /**
   * Fields that have to be known before this pathway can be assessed. Any that
   * are missing or answered "I'm not sure" become open questions, and the
   * pathway can go no higher than "more information needed".
   */
  requires: z.array(profileFieldSchema).min(1),
  /** How many supporting signals make this a strong match. */
  strongWhenAtLeast: z.number().int().min(1),
  supports: z.array(signalSchema).min(1),
  against: z.array(counterSignalSchema),
})
export type PathwayRules = z.infer<typeof pathwayRulesSchema>

const field = (name: ProfileField, ...oneOf: string[]): Clause => ({ field: name, oneOf })

const NEEDS_HELP_MOST_DAYS = ['daily_brief', 'daily_extensive', 'several_times_daily']
const OWN_PLACE = ['own_place_alone', 'own_place_with_chosen_people']

export const PATHWAY_RULES: readonly PathwayRules[] = [
  {
    pathwayId: 'assistance-with-daily-life',
    requires: ['support.dailyIntensity', 'housing.desired'],
    strongWhenAtLeast: 2,
    supports: [
      {
        when: [field('support.dailyIntensity', ...NEEDS_HELP_MOST_DAYS)],
        reason: {
          self: 'You need help most days.',
          other: 'They need help most days.',
        },
      },
      {
        when: [field('housing.desired', ...OWN_PLACE, 'stay_where_they_are')],
        reason: {
          self: 'You want to live in your own home rather than a shared supported home.',
          other:
            'They want to live in their own home rather than a shared supported home.',
        },
      },
      {
        when: [field('goals.change', 'more_independence', 'more_support_where_they_are')],
        reason: {
          self: 'You want to change the support around you, not where you live.',
          other: 'They want to change the support around them, not where they live.',
        },
      },
    ],
    against: [
      {
        when: [field('support.overnight', 'someone_always_available')],
        reason: {
          self: 'Someone needs to be available to you at all times, which usually takes more than workers dropping in.',
          other:
            'Someone needs to be available to them at all times, which usually takes more than workers dropping in.',
        },
        blocking: false,
      },
    ],
  },
  {
    pathwayId: 'individualised-living-options',
    requires: ['context.lifeStage', 'housing.desired', 'support.dailyIntensity'],
    strongWhenAtLeast: 3,
    supports: [
      {
        when: [field('housing.desired', ...OWN_PLACE)],
        reason: {
          self: 'You want your own place.',
          other: 'They want their own place.',
        },
      },
      {
        when: [
          field(
            'goals.change',
            'move_out_of_family_home',
            'change_who_they_live_with',
            'more_independence',
          ),
        ],
        reason: {
          self: 'You want more say over how and with whom you live.',
          other: 'They want more say over how and with whom they live.',
        },
      },
      {
        when: [field('support.dailyIntensity', ...NEEDS_HELP_MOST_DAYS)],
        reason: {
          self: 'You need regular help, which this arrangement is built around.',
          other: 'They need regular help, which this arrangement is built around.',
        },
      },
      {
        when: [field('support.informal', 'strong_and_ongoing', 'some')],
        reason: {
          self: 'Family or friends already help, and this option can be designed around that.',
          other:
            'Family or friends already help, and this option can be designed around that.',
        },
      },
    ],
    against: [
      {
        when: [field('context.lifeStage', 'under_18')],
        reason: {
          self: 'This option is for adults.',
          other: 'This option is for adults.',
        },
        blocking: true,
      },
      {
        when: [field('housing.desired', 'shared_home_with_support')],
        reason: {
          self: 'You want a shared home with support always on hand, which is a different arrangement to this one.',
          other:
            'They want a shared home with support always on hand, which is a different arrangement to this one.',
        },
        blocking: true,
      },
    ],
  },
  {
    pathwayId: 'supported-independent-living',
    requires: ['context.lifeStage', 'housing.desired', 'support.overnight'],
    strongWhenAtLeast: 2,
    supports: [
      {
        when: [field('housing.desired', 'shared_home_with_support')],
        reason: {
          self: 'You want a shared home where support is always on hand.',
          other: 'They want a shared home where support is always on hand.',
        },
      },
      {
        when: [field('support.overnight', 'most_nights', 'someone_always_available')],
        reason: {
          self: 'You need help overnight.',
          other: 'They need help overnight.',
        },
      },
      {
        when: [field('support.dailyIntensity', 'daily_extensive', 'several_times_daily')],
        reason: {
          self: 'You need a lot of help through the day.',
          other: 'They need a lot of help through the day.',
        },
      },
      {
        when: [field('support.informal', 'very_little', 'none')],
        reason: {
          self: 'There is little help from family or friends to build on.',
          other: 'There is little help from family or friends to build on.',
        },
      },
    ],
    against: [
      {
        when: [field('context.lifeStage', 'under_18')],
        reason: {
          self: 'This option is generally for adults.',
          other: 'This option is generally for adults.',
        },
        blocking: true,
      },
      {
        when: [field('housing.desired', 'own_place_alone')],
        reason: {
          self: 'You want to live on your own, and this option means sharing a home.',
          other: 'They want to live on their own, and this option means sharing a home.',
        },
        blocking: true,
      },
      {
        when: [field('housing.desired', 'own_place_with_chosen_people')],
        reason: {
          self: 'You want to choose who you live with, and this option means sharing a home with people chosen by a provider.',
          other:
            'They want to choose who they live with, and this option means sharing a home with people chosen by a provider.',
        },
        blocking: true,
      },
    ],
  },
  {
    pathwayId: 'specialist-disability-accommodation',
    requires: ['housing.featureNeeds'],
    strongWhenAtLeast: 2,
    supports: [
      {
        when: [field('housing.featureNeeds', 'purpose_built')],
        reason: {
          self: 'You may need a home designed for high physical support needs.',
          other: 'They may need a home designed for high physical support needs.',
        },
      },
      {
        when: [field('support.overnight', 'someone_always_available')],
        reason: {
          self: 'Someone needs to be available to you at all times.',
          other: 'Someone needs to be available to them at all times.',
        },
      },
      {
        when: [field('support.dailyIntensity', 'several_times_daily')],
        reason: {
          self: 'You need help at several points through the day.',
          other: 'They need help at several points through the day.',
        },
      },
    ],
    against: [
      {
        when: [field('housing.featureNeeds', 'none_known', 'small_changes')],
        reason: {
          self: 'The home does not need major building work as far as you know, and this option is about the building.',
          other:
            'The home does not need major building work as far as you know, and this option is about the building.',
        },
        blocking: true,
      },
    ],
  },
  {
    pathwayId: 'home-modifications',
    requires: ['housing.featureNeeds'],
    strongWhenAtLeast: 2,
    supports: [
      {
        when: [field('housing.featureNeeds', 'small_changes', 'substantial_changes')],
        reason: {
          self: 'The home needs physical changes.',
          other: 'The home needs physical changes.',
        },
      },
      {
        when: [field('housing.desired', 'stay_where_they_are')],
        reason: {
          self: 'You want to stay where you are.',
          other: 'They want to stay where they are.',
        },
      },
      {
        when: [
          field(
            'housing.current',
            'own_home',
            'family_home',
            'social_housing',
            'own_rental',
          ),
        ],
        reason: {
          self: 'There is already a home that could be changed.',
          other: 'There is already a home that could be changed.',
        },
      },
    ],
    against: [
      {
        when: [field('housing.featureNeeds', 'none_known')],
        reason: {
          self: 'No changes to the building are needed as far as you know.',
          other: 'No changes to the building are needed as far as you know.',
        },
        blocking: true,
      },
    ],
  },
  {
    pathwayId: 'medium-term-accommodation',
    requires: ['context.timing', 'housing.current'],
    // A bridge to a home that has already been found. Since the navigator does
    // not yet ask whether a longer-term home exists, this stays short of a strong
    // match unless everything points at an immediate gap in housing.
    strongWhenAtLeast: 3,
    supports: [
      {
        when: [field('housing.current', 'no_stable_home')],
        reason: {
          self: 'You have no stable home at the moment.',
          other: 'They have no stable home at the moment.',
        },
      },
      {
        when: [field('context.timing', 'urgent')],
        reason: {
          self: 'The current situation cannot hold for long.',
          other: 'The current situation cannot hold for long.',
        },
      },
      {
        when: [field('goals.change', 'leave_unsuitable_arrangement')],
        reason: {
          self: 'You want to leave an arrangement that is not working.',
          other: 'They want to leave an arrangement that is not working.',
        },
      },
    ],
    against: [
      {
        when: [field('context.timing', 'planning_ahead')],
        reason: {
          self: 'There is no time pressure, and this option only covers a short gap.',
          other: 'There is no time pressure, and this option only covers a short gap.',
        },
        blocking: true,
      },
    ],
  },
  {
    pathwayId: 'private-rental',
    requires: ['housing.desired'],
    strongWhenAtLeast: 3,
    supports: [
      {
        when: [field('housing.desired', ...OWN_PLACE)],
        reason: {
          self: 'You want your own place.',
          other: 'They want their own place.',
        },
      },
      {
        when: [
          field(
            'housing.current',
            'family_home',
            'no_stable_home',
            'shared_with_support',
            'specialist_housing',
          ),
        ],
        reason: {
          self: 'A move away from where you live now is on the cards.',
          other: 'A move away from where they live now is on the cards.',
        },
      },
      {
        when: [
          field(
            'goals.change',
            'move_out_of_family_home',
            'change_who_they_live_with',
            'more_independence',
            'leave_unsuitable_arrangement',
          ),
        ],
        reason: {
          self: 'You want a change of home, and renting keeps the most choice about where.',
          other:
            'They want a change of home, and renting keeps the most choice about where.',
        },
      },
    ],
    against: [
      {
        when: [field('housing.desired', 'stay_where_they_are')],
        reason: {
          self: 'You want to stay where you are.',
          other: 'They want to stay where they are.',
        },
        blocking: true,
      },
      {
        when: [field('housing.desired', 'shared_home_with_support')],
        reason: {
          self: 'A shared home with support on hand is usually arranged by a provider rather than rented directly.',
          other:
            'A shared home with support on hand is usually arranged by a provider rather than rented directly.',
        },
        blocking: false,
      },
    ],
  },
  {
    pathwayId: 'social-and-community-housing',
    requires: ['housing.desired'],
    strongWhenAtLeast: 3,
    supports: [
      {
        when: [field('housing.current', 'no_stable_home')],
        reason: {
          self: 'You have no stable home at the moment, which is often given priority.',
          other:
            'They have no stable home at the moment, which is often given priority.',
        },
      },
      {
        when: [field('context.timing', 'urgent', 'within_a_year')],
        reason: {
          self: 'Waiting lists are long, so applying early matters when there is a deadline.',
          other:
            'Waiting lists are long, so applying early matters when there is a deadline.',
        },
      },
      {
        when: [field('housing.desired', ...OWN_PLACE)],
        reason: {
          self: 'You want your own place.',
          other: 'They want their own place.',
        },
      },
      {
        when: [field('support.informal', 'very_little', 'none')],
        reason: {
          self: 'There is little informal help to fall back on if housing falls through.',
          other:
            'There is little informal help to fall back on if housing falls through.',
        },
      },
    ],
    against: [
      {
        when: [field('housing.desired', 'stay_where_they_are')],
        reason: {
          self: 'You want to stay where you are.',
          other: 'They want to stay where they are.',
        },
        blocking: true,
      },
    ],
  },
]

export const RULES_BY_PATHWAY: ReadonlyMap<string, PathwayRules> = new Map(
  PATHWAY_RULES.map((rules) => [rules.pathwayId, rules]),
)

export type { CopyVariants }
