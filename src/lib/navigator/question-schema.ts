import { z } from 'zod'
import type { FieldId } from '@/lib/profile/fields'

/**
 * A question is data, not code.
 *
 * Conditions and profile mapping are declarative so they can be validated,
 * tested and moved between tracks without rewriting the flow. Nothing here
 * decides which pathway suits anyone — that is the decision engine's job.
 *
 * Each schema below validates *shape* at runtime and names its field as a plain
 * string, because the set of valid fields is composed from every track's field
 * group and is not known to this module. The exported types then narrow that
 * field to `FieldId`, so a question or condition naming a field which does not
 * exist still fails to typecheck. Structure is checked at runtime; meaning is
 * checked at compile time.
 */

const copyVariantsSchema = z.object({
  self: z.string().min(1),
  other: z.string().min(1),
})

export const questionOptionSchema = z.object({
  /** Must be valid for the question's profile field. */
  value: z.string().min(1),
  label: copyVariantsSchema,
  /** Optional one-line clarification shown under the label. */
  hint: copyVariantsSchema.optional(),
  /**
   * How this answer reads back on the thread, e.g. "They live in the family
   * home." Written beside the option so the answer and its plain-English
   * restatement can never drift apart.
   */
  statement: copyVariantsSchema,
  /** Marks the "I'm not sure" answer so uncertainty can be tracked honestly. */
  unsure: z.boolean().optional(),
  /**
   * Other profile fields this answer already settles, so the navigator does not
   * ask a question the person has effectively just answered.
   */
  implies: z
    .array(z.object({ field: z.string().min(1), value: z.string().min(1) }))
    .optional(),
})

/** A question appears only when every clause holds. */
export const conditionSchema = z.object({
  field: z.string().min(1),
  /** Shown when the field's value is one of these. */
  oneOf: z.array(z.string().min(1)).min(1).optional(),
  /** Shown when the field's value is none of these. */
  notOneOf: z.array(z.string().min(1)).min(1).optional(),
  /** Shown when the field has no value yet. */
  isUnanswered: z.boolean().optional(),
})

export const questionSchema = z.object({
  id: z.string().min(1),
  /** Why this question is worth a screen. Shown to the user on request. */
  purpose: z.string().min(1),
  type: z.literal('single-select'),
  profileField: z.string().min(1),
  question: copyVariantsSchema,
  /** Optional plain-English framing above the options. */
  help: copyVariantsSchema.optional(),
  /** Short label for the thread and for revisit links. */
  threadLabel: copyVariantsSchema,
  options: z.array(questionOptionSchema).min(2),
  showWhen: z.array(conditionSchema).optional(),
})

export type CopyVariantsShape = z.infer<typeof copyVariantsSchema>

export type Condition = {
  field: FieldId
  oneOf?: readonly string[]
  notOneOf?: readonly string[]
  isUnanswered?: boolean
}

export type QuestionOption = Omit<z.infer<typeof questionOptionSchema>, 'implies'> & {
  implies?: readonly { field: FieldId; value: string }[]
}

export type Question = Omit<
  z.infer<typeof questionSchema>,
  'profileField' | 'options' | 'showWhen'
> & {
  profileField: FieldId
  options: readonly QuestionOption[]
  showWhen?: readonly Condition[]
}

/** Answers keyed by question id. The single source of truth for the journey. */
export type AnswerMap = Readonly<Record<string, string>>
