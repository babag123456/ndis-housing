import { UNSURE, type ParticipantProfile } from '@/types/profile'
import type { MatchState } from '@/types/domain'
import {
  readProfileField,
  type ProfileField,
} from '@/lib/navigator/question-schema'
import { QUESTIONS } from '@/lib/navigator/questions'
import type { CopyVariants } from '@/lib/copy/perspective'
import { allConditionsHold } from '@/lib/conditions'
import { PATHWAY_RULES } from './rules'

/**
 * The decision engine.
 *
 * A pure function from the participant profile to an assessment per pathway.
 * There is no model here and no randomness: the same answers always produce the
 * same states, reasons and open questions, which is what makes the results
 * explainable and testable.
 *
 * It deliberately does not resolve copy into a voice — that belongs to the
 * explain layer — so the engine can be tested without a perspective.
 */

/** A question that would settle something the assessment currently cannot. */
export type OpenQuestion = {
  questionId: string
  question: CopyVariants
}

export type PathwayAssessment = {
  pathwayId: string
  state: MatchState
  /** Why this is being shown: the answers that support it. */
  reasons: readonly CopyVariants[]
  /** What may not fit, and what could change the picture. */
  cautions: readonly CopyVariants[]
  /** What is still unknown, and which question would resolve it. */
  openQuestions: readonly OpenQuestion[]
}

/** Which question fills each profile field, so an unknown can name its question. */
const QUESTION_FOR_FIELD: ReadonlyMap<ProfileField, (typeof QUESTIONS)[number]> = new Map(
  QUESTIONS.map((question) => [question.profileField, question]),
)

/** A field is unknown when it was never answered, or answered "I'm not sure". */
function isUnknown(profile: ParticipantProfile, field: ProfileField): boolean {
  const value = readProfileField(profile, field)
  return value === null || value === UNSURE
}

/**
 * Turns the counted signals into one of the four states.
 *
 * The order of these branches is the whole policy, so it is written as a single
 * readable sequence rather than spread across the rules:
 *
 * 1. An option that does not do what the person asked for is lower relevance,
 *    however much else lines up.
 * 2. Where something needed is unknown, the honest answer is that more
 *    information is needed — including when nothing yet supports the pathway.
 * 3. With everything known and nothing supporting it, the option is less
 *    relevant.
 * 4. Otherwise it is a strong match only when enough signals agree.
 */
function resolveState(
  supportCount: number,
  blockerCount: number,
  unknownCount: number,
  strongWhenAtLeast: number,
): MatchState {
  if (blockerCount > 0) return 'lower_relevance'
  if (unknownCount > 0 && supportCount === 0) return 'needs_more_information'
  if (supportCount === 0) return 'lower_relevance'
  if (unknownCount > 0) return 'needs_more_information'
  if (supportCount >= strongWhenAtLeast) return 'strong_match'
  return 'worth_exploring'
}

export function evaluatePathways(
  profile: ParticipantProfile,
): readonly PathwayAssessment[] {
  return PATHWAY_RULES.map((rules) => {
    const reasons = rules.supports
      .filter((signal) => allConditionsHold(profile, signal.when))
      .map((signal) => signal.reason)

    const matchedAgainst = rules.against.filter((signal) =>
      allConditionsHold(profile, signal.when),
    )
    const blockers = matchedAgainst.filter((signal) => signal.blocking)

    const openQuestions = rules.requires
      .filter((field) => isUnknown(profile, field))
      .flatMap((field) => {
        const question = QUESTION_FOR_FIELD.get(field)
        return question === undefined
          ? []
          : [{ questionId: question.id, question: question.question }]
      })

    return {
      pathwayId: rules.pathwayId,
      state: resolveState(
        reasons.length,
        blockers.length,
        openQuestions.length,
        rules.strongWhenAtLeast,
      ),
      reasons,
      cautions: matchedAgainst.map((signal) => signal.reason),
      openQuestions,
    }
  })
}
