import type { ParticipantProfile } from '@/types/profile'
import { allConditionsHold, anyConditionHolds } from '@/lib/conditions'
import { resolveCopy, type Voice } from '@/lib/copy/perspective'
import type { FieldRegistry } from '@/lib/profile/field'
import { HOME_AND_LIVING } from '@/tracks/home-and-living'
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

function appliesTo(
  profile: ParticipantProfile,
  step: RoadmapStep,
  registry?: FieldRegistry,
): boolean {
  if (step.showWhen && !allConditionsHold(profile, step.showWhen, registry)) return false
  if (step.showWhenAny && !anyConditionHolds(profile, step.showWhenAny, registry)) {
    return false
  }
  return true
}

/** The steps that apply, in stage order. Declaration order breaks ties. */
export function buildRoadmap(
  profile: ParticipantProfile,
  steps: readonly RoadmapStep[] = HOME_AND_LIVING.steps,
  registry?: FieldRegistry,
): readonly RoadmapStep[] {
  return steps.filter((step) => appliesTo(profile, step, registry)).sort(
    (left, right) =>
      ROADMAP_STAGES.indexOf(left.stage) - ROADMAP_STAGES.indexOf(right.stage),
  )
}

/** The same roadmap, resolved into the person's own perspective. */
export function explainRoadmap(
  profile: ParticipantProfile,
  voice: Voice | null,
  steps: readonly RoadmapStep[] = HOME_AND_LIVING.steps,
  registry?: FieldRegistry,
): readonly ExplainedStep[] {
  return buildRoadmap(profile, steps, registry).map((step) => ({
    id: step.id,
    stage: step.stage,
    title: resolveCopy(step.title, voice),
    why: resolveCopy(step.why, voice),
    understand: step.understand.map((item) => resolveCopy(item, voice)),
    prepare: step.prepare.map((item) => resolveCopy(item, voice)),
    doNow: step.doNow.map((item) => resolveCopy(item, voice)),
  }))
}
