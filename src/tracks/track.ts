import type { CopyVariants } from '@/lib/copy/perspective'
import type { ProfileCondition } from '@/lib/conditions'
import type { PathwayRules } from '@/lib/decision-engine/rule-schema'
import type { Question } from '@/lib/navigator/question-schema'
import type { RoadmapStep } from '@/lib/roadmap/schema'

/**
 * One area of a person's life the navigator can help with.
 *
 * A track owns questions, optionally rules, and roadmap steps. It owns no logic:
 * the flow, engine, roadmap and plan are shared and take a track as a parameter.
 *
 * `rules` is optional on purpose. Not every track compares options — a track can
 * exist to tell someone who and what they may need, with nothing to score.
 */
export type Track = {
  id: string
  plainName: string
  /** Why this track exists, in the person's terms. Shown on request. */
  purpose: string
  /** How the track offers itself on the chooser. */
  chooser: CopyVariants
  questions: readonly Question[]
  rules?: readonly PathwayRules[]
  steps: readonly RoadmapStep[]
  /** When offering this track makes sense at all. Always offered when absent. */
  entryWhen?: readonly ProfileCondition[]
}
