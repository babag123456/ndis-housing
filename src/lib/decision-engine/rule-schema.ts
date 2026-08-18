import { z } from 'zod'
import type { FieldId } from '@/lib/profile/fields'
import type { CopyVariants } from '@/lib/copy/perspective'

/**
 * The shape of a rule.
 *
 * Separate from the rules themselves so a track can define rules without the
 * engine having to import from `src/tracks`, which would be a cycle. Explicit
 * configuration rather than nested conditionals: each clause names a profile
 * field and the values that trigger it, and carries the sentence shown to the
 * person when it does. A reason and the condition that produced it cannot drift
 * apart, because they are the same object.
 */

const copyVariantsSchema = z.object({
  self: z.string().min(1),
  other: z.string().min(1),
})

/** A condition on one profile field. All clauses in a signal must hold. */
export const clauseSchema = z.object({
  field: z.string().min(1),
  oneOf: z.array(z.string().min(1)).min(1),
})

/**
 * The runtime schema is structural; the field name is constrained at compile
 * time by `FieldId`, which is derived from the composed field registry. So a
 * clause naming a field that does not exist still fails to typecheck.
 */
export type Clause = { field: FieldId; oneOf: readonly string[] }

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
  requires: z.array(z.string().min(1)).min(1),
  /** How many supporting signals make this a strong match. */
  strongWhenAtLeast: z.number().int().min(1),
  supports: z.array(signalSchema).min(1),
  against: z.array(counterSignalSchema),
})
/**
 * Declared rather than inferred from the schema.
 *
 * `z.infer` would type each clause's field as a plain string, losing the whole
 * point of `Clause`: that a rule naming a field which does not exist fails to
 * typecheck. The schema validates shape at runtime; this declares meaning at
 * compile time, and a test asserts the two agree.
 */
export type Signal = { when: readonly Clause[]; reason: CopyVariants }

export type CounterSignal = Signal & { blocking: boolean }

export type PathwayRules = {
  pathwayId: string
  requires: readonly FieldId[]
  strongWhenAtLeast: number
  supports: readonly Signal[]
  against: readonly CounterSignal[]
}
