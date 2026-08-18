import type { ParticipantProfile } from '@/types/profile'
import { allConditionsHold, anyConditionHolds } from '@/lib/conditions'
import { resolveCopy, type Voice } from '@/lib/copy/perspective'
import { ROADMAP_STEPS } from '@content/journeys/roadmap-steps'
import { ROADMAP_STAGES, type RoadmapStage, type RoadmapStep } from './schema'

/**
 * Builds the roadmap.
 *
 * Pure and deterministic, like the decision engine, and for the same reason: a
 * person should be able to ask why a step is on their list and get the same
 * answer every time.
 */

export type ExplainedStep = {
  id: string
  stage: RoadmapStage
  title: string
  why: string
  understand: readonly string[]
  prepare: readonly string[]
  doNow: readonly string[]
}

function appliesTo(profile: ParticipantProfile, step: RoadmapStep): boolean {
  if (step.showWhen && !allConditionsHold(profile, step.showWhen)) return false
  if (step.showWhenAny && !anyConditionHolds(profile, step.showWhenAny)) return false
  return true
}

/** The steps that apply, in stage order. Declaration order breaks ties. */
export function buildRoadmap(profile: ParticipantProfile): readonly RoadmapStep[] {
  return ROADMAP_STEPS.filter((step) => appliesTo(profile, step)).sort(
    (left, right) =>
      ROADMAP_STAGES.indexOf(left.stage) - ROADMAP_STAGES.indexOf(right.stage),
  )
}

/** The same roadmap, resolved into the person's own perspective. */
export function explainRoadmap(
  profile: ParticipantProfile,
  voice: Voice | null,
): readonly ExplainedStep[] {
  return buildRoadmap(profile).map((step) => ({
    id: step.id,
    stage: step.stage,
    title: resolveCopy(step.title, voice),
    why: resolveCopy(step.why, voice),
    understand: step.understand.map((item) => resolveCopy(item, voice)),
    prepare: step.prepare.map((item) => resolveCopy(item, voice)),
    doNow: step.doNow.map((item) => resolveCopy(item, voice)),
  }))
}
