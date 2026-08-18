import { z } from 'zod'
import { profileConditionSchema } from '@/lib/conditions'

/**
 * The roadmap model.
 *
 * Steps are data with declarative conditions, so two people get different
 * roadmaps rather than the same list with different words. Order comes from the
 * stage a step belongs to, which is what lets an urgent situation put finding
 * somewhere safe ahead of understanding the options — a reordering, not a
 * relabelling.
 */

/** Stages in the order they are shown. A step's stage decides where it lands. */
export const ROADMAP_STAGES = [
  'now',
  'understand',
  'decide',
  'talk',
  'evidence',
  'request',
  'decision',
  'find',
  'setup',
  'move',
  'review',
] as const
export const roadmapStageSchema = z.enum(ROADMAP_STAGES)
export type RoadmapStage = z.infer<typeof roadmapStageSchema>

const copyVariantsSchema = z.object({
  self: z.string().min(1),
  other: z.string().min(1),
})

export const roadmapStepSchema = z.object({
  id: z.string().min(1),
  stage: roadmapStageSchema,
  title: copyVariantsSchema,
  /** One line on why this step is worth doing. Never a policy claim. */
  why: copyVariantsSchema,
  /** What to understand before acting. */
  understand: z.array(copyVariantsSchema).min(1),
  /** What to gather or write down first. */
  prepare: z.array(copyVariantsSchema).min(1),
  /** The concrete action. One or two things, not a programme of work. */
  doNow: z.array(copyVariantsSchema).min(1),
  /** Shown when every condition holds. */
  showWhen: z.array(profileConditionSchema).min(1).optional(),
  /** Shown when at least one condition holds. */
  showWhenAny: z.array(profileConditionSchema).min(1).optional(),
})
export type RoadmapStep = z.infer<typeof roadmapStepSchema>
