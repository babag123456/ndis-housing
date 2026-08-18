import { z } from 'zod'
import type { ParticipantProfile } from '@/types/profile'
import { profileFieldSchema, readProfileField } from '@/lib/navigator/question-schema'

/**
 * One shared way of asking a question of the profile.
 *
 * The navigator, the decision engine and the roadmap all need to test a profile
 * field against a set of values. They share this so that "which values count"
 * cannot mean one thing in the rules and another in the roadmap.
 *
 * The navigator's own flow needs a third answer beyond true and false — a
 * condition can be undetermined while an earlier question is unanswered — so it
 * keeps its own tri-state evaluation on top of the same field reader.
 */
export const profileConditionSchema = z.object({
  field: profileFieldSchema,
  /** Holds when the field's value is one of these. */
  oneOf: z.array(z.string().min(1)).min(1).optional(),
  /** Holds when the field's value is none of these. */
  notOneOf: z.array(z.string().min(1)).min(1).optional(),
})
export type ProfileCondition = z.infer<typeof profileConditionSchema>

/**
 * An unanswered field never satisfies a condition. Silence is not agreement:
 * treating a missing answer as a match is how a navigator starts inventing
 * things about people.
 */
export function conditionHolds(
  profile: ParticipantProfile,
  condition: ProfileCondition,
): boolean {
  const value = readProfileField(profile, condition.field)
  if (value === null) return false
  if (condition.oneOf && !condition.oneOf.includes(value)) return false
  if (condition.notOneOf && condition.notOneOf.includes(value)) return false
  return true
}

export function allConditionsHold(
  profile: ParticipantProfile,
  conditions: readonly ProfileCondition[],
): boolean {
  return conditions.every((condition) => conditionHolds(profile, condition))
}

export function anyConditionHolds(
  profile: ParticipantProfile,
  conditions: readonly ProfileCondition[],
): boolean {
  return conditions.some((condition) => conditionHolds(profile, condition))
}
