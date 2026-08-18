import { PATHWAYS_BY_ID } from '@content/pathways'
import type { Pathway } from '@/lib/content/schema'
import type { MatchState } from '@/types/domain'
import type { ParticipantProfile } from '@/types/profile'
import { resolveCopy, type Voice } from '@/lib/copy/perspective'
import { HOME_AND_LIVING } from '@/tracks/home-and-living'
import type { Track } from '@/tracks/track'
import { evaluatePathways, type PathwayAssessment } from './evaluate-pathways'

/**
 * The explain layer.
 *
 * Turns an assessment into something a person can read: the pathway content, the
 * reasons in their own perspective, and the questions still open. This is the
 * only place a voice is applied, so the engine itself stays perspective-free.
 */

export type ExplainedPathway = {
  pathway: Pathway
  state: MatchState
  /** Answers to "Why am I seeing this?" */
  reasons: readonly string[]
  /** Answers to "What may not fit?" and "What could change this?" */
  cautions: readonly string[]
  openQuestions: readonly { questionId: string; question: string }[]
}

/**
 * The order results are shown in. Strongest first, and least relevant last so a
 * person is not led with what does not apply.
 */
export const MATCH_STATE_ORDER: readonly MatchState[] = [
  'strong_match',
  'worth_exploring',
  'needs_more_information',
  'lower_relevance',
]

export type MatchStateGroup = {
  state: MatchState
  pathways: readonly ExplainedPathway[]
}

function explain(assessment: PathwayAssessment, voice: Voice | null): ExplainedPathway | null {
  const pathway = PATHWAYS_BY_ID.get(assessment.pathwayId)
  // A rule without matching content has nothing to say, so it says nothing
  // rather than rendering an empty result.
  if (pathway === undefined) return null

  return {
    pathway,
    state: assessment.state,
    reasons: assessment.reasons.map((reason) => resolveCopy(reason, voice)),
    cautions: assessment.cautions.map((caution) => resolveCopy(caution, voice)),
    openQuestions: assessment.openQuestions.map((open) => ({
      questionId: open.questionId,
      question: resolveCopy(open.question, voice),
    })),
  }
}

/** Assessments grouped by state, in display order. Empty groups are omitted. */
export function explainPathways(
  profile: ParticipantProfile,
  voice: Voice | null,
  track: Track = HOME_AND_LIVING,
): readonly MatchStateGroup[] {
  const explained = evaluatePathways(profile, track.rules ?? [], track.questions)
    .map((assessment) => explain(assessment, voice))
    .filter((result): result is ExplainedPathway => result !== null)

  return MATCH_STATE_ORDER.map((state) => ({
    state,
    pathways: explained.filter((result) => result.state === state),
  })).filter((group) => group.pathways.length > 0)
}
