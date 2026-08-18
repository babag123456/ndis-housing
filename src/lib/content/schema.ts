import { z } from 'zod'
import { profileConditionSchema } from '@/lib/conditions'
import { FUNDING_SOURCES, PROVIDER_KINDS } from '@/types/domain'

/**
 * Content schemas.
 *
 * Everything a user reads about a pathway is validated data carrying its own
 * source. The point is not tidiness: it is that a factual claim about the NDIS
 * cannot exist in this codebase without saying where it came from and whether
 * anyone has checked it.
 */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date as YYYY-MM-DD')

export const sourceTypeSchema = z.enum(['official', 'provider', 'advocacy', 'other'])

export const sourceSchema = z
  .object({
    sourceUrl: z.string().url(),
    sourceName: z.string().min(1),
    sourceType: sourceTypeSchema,
    jurisdiction: z.string().min(1).optional(),
    /** When someone last opened the page. Absent until that has happened. */
    retrievedAt: isoDate.optional(),
    /** When someone last confirmed the page still supports the claim. */
    reviewedAt: isoDate.optional(),
    /**
     * "verified" means a person has read the source and confirmed it supports
     * what we say. Nothing else counts — not a link that returns 200, and not a
     * model's recollection of policy.
     */
    verified: z.boolean(),
  })
  .refine(
    (source) =>
      !source.verified || (source.retrievedAt !== undefined && source.reviewedAt !== undefined),
    {
      message:
        'A source cannot be marked verified without a retrieved and reviewed date',
      path: ['verified'],
    },
  )
export type Source = z.infer<typeof sourceSchema>

/**
 * Which of the four dimensions a pathway belongs to. A pathway is never allowed
 * to be a bundle of "housing plus support plus funding" — that conflation is the
 * thing this product exists to undo.
 */
export const pathwayDimensionSchema = z.enum(['support', 'housing', 'home_modification'])
export type PathwayDimension = z.infer<typeof pathwayDimensionSchema>

export const threeLevelSchema = z.object({
  /** One or two sentences of plain English. Always shown. */
  simple: z.string().min(1),
  /** Enough to understand the practical implications. Shown on request. */
  tellMeMore: z.string().min(1),
  /** Formal terminology, conditions and exceptions. Shown on request. */
  detail: z.string().min(1),
})

export const pathwaySchema = z.object({
  id: z.string().min(1),
  dimension: pathwayDimensionSchema,
  /**
   * The primary user-facing name, in plain English. This is what a person sees
   * first; the formal name is an explanation of it, not the other way round.
   */
  plainName: z.string().min(1),
  /** The formal NDIS or mainstream name, if the option has one. */
  formalName: z.string().min(1).optional(),
  /** Only ever shown in brackets after the formal name's first mention. */
  acronym: z.string().min(1).optional(),
  /** Who may pay for this. Kept separate from what it is. */
  fundingSources: z.array(z.enum(FUNDING_SOURCES)).min(1),
  description: threeLevelSchema,
  /** Honest limits: what this option is not, and who it tends not to suit. */
  mayNotFit: z.array(z.string().min(1)).min(1),
  /** Questions worth asking a planner, coordinator or provider. */
  questionsToAsk: z.array(z.string().min(1)).min(1),
  /** Information or evidence that may be needed. Never stated as a guarantee. */
  evidence: z.array(z.string().min(1)).min(1),
  fundingNotes: z.array(z.string().min(1)).min(1),
  /** The single most useful next action. */
  nextStep: z.string().min(1),
  sources: z.array(sourceSchema).min(1),
})
export type Pathway = z.infer<typeof pathwaySchema>

/**
 * A source of money.
 *
 * Modelled separately from the options it pays for, because "who pays" is its own
 * question: one option can draw on several, and one source pays towards several
 * options. Collapsing them is what leaves people thinking the NDIS pays rent.
 */
export const fundingSourceContentSchema = z.object({
  id: z.enum(FUNDING_SOURCES),
  /** Plain-English name. The formal name follows if there is one. */
  plainName: z.string().min(1),
  formalName: z.string().min(1).optional(),
  description: threeLevelSchema,
  /** What this money is generally for. */
  pays: z.array(z.string().min(1)).min(1),
  /** What it does not cover. As important as what it does. */
  doesNotPay: z.array(z.string().min(1)).min(1),
  sources: z.array(sourceSchema).min(1),
})
export type FundingSourceContent = z.infer<typeof fundingSourceContentSchema>

/**
 * A kind of organisation or worker who can help.
 *
 * Deliberately kinds rather than named services: a directory of real
 * organisations needs verified, current, state-by-state data, and inventing one
 * would be worse than not having it. Each kind carries the conditions that make
 * it worth mentioning, so a person is not handed a list of everyone.
 */
export const organisationSchema = z.object({
  id: z.string().min(1),
  plainName: z.string().min(1),
  kind: z.enum(PROVIDER_KINDS),
  description: threeLevelSchema,
  /** What this kind of help is good for. */
  helpsWith: z.array(z.string().min(1)).min(1),
  /** Questions worth asking them. */
  questionsToAsk: z.array(z.string().min(1)).min(1),
  /** How to find one. Never a named service unless it can be verified. */
  howToFind: z.string().min(1),
  /** Mentioned when every condition holds. */
  showWhen: z.array(profileConditionSchema).min(1).optional(),
  /** Mentioned when at least one condition holds. */
  showWhenAny: z.array(profileConditionSchema).min(1).optional(),
  sources: z.array(sourceSchema).min(1),
})
export type Organisation = z.infer<typeof organisationSchema>
