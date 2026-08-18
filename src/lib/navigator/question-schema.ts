import { z } from 'zod'
import {
  currentLivingSchema,
  desiredChangeSchema,
  desiredLivingSchema,
  housingFeatureNeedSchema,
  informalSupportSchema,
  lifeStageSchema,
  ndisContextSchema,
  overnightSupportSchema,
  supportIntensitySchema,
  timingSchema,
  userPerspectiveSchema,
  type ParticipantProfile,
} from '@/types/profile'

/**
 * A question is data, not code.
 *
 * Conditions and profile mapping are declarative so they can be validated,
 * tested and later moved into /content without rewriting the flow. Nothing here
 * decides which pathway suits anyone — that is the decision engine's job.
 */

const copyVariantsSchema = z.object({
  self: z.string().min(1),
  other: z.string().min(1),
})

/** Every field of the profile a question is allowed to write to. */
export const PROFILE_FIELDS = [
  'perspective',
  'housing.current',
  'housing.desired',
  'housing.featureNeeds',
  'support.dailyIntensity',
  'support.overnight',
  'support.informal',
  'goals.change',
  'context.lifeStage',
  'context.timing',
  'context.ndis',
] as const
export const profileFieldSchema = z.enum(PROFILE_FIELDS)
export type ProfileField = z.infer<typeof profileFieldSchema>

/** The value schema each profile field accepts. Used to validate answers. */
export const FIELD_VALUE_SCHEMAS: Record<ProfileField, z.ZodTypeAny> = {
  perspective: userPerspectiveSchema,
  'housing.current': currentLivingSchema,
  'housing.desired': desiredLivingSchema,
  'housing.featureNeeds': housingFeatureNeedSchema,
  'support.dailyIntensity': supportIntensitySchema,
  'support.overnight': overnightSupportSchema,
  'support.informal': informalSupportSchema,
  'goals.change': desiredChangeSchema,
  'context.lifeStage': lifeStageSchema,
  'context.timing': timingSchema,
  'context.ndis': ndisContextSchema,
}

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
    .array(z.object({ field: profileFieldSchema, value: z.string().min(1) }))
    .optional(),
})
export type QuestionOption = z.infer<typeof questionOptionSchema>

/** A question appears only when every clause holds. */
export const conditionSchema = z.object({
  field: profileFieldSchema,
  /** Shown when the field's value is one of these. */
  oneOf: z.array(z.string().min(1)).min(1).optional(),
  /** Shown when the field's value is none of these. */
  notOneOf: z.array(z.string().min(1)).min(1).optional(),
  /** Shown when the field has no value yet. */
  isUnanswered: z.boolean().optional(),
})
export type Condition = z.infer<typeof conditionSchema>

export const questionSchema = z.object({
  id: z.string().min(1),
  /** Why this question is worth a screen. Shown to the user on request. */
  purpose: z.string().min(1),
  type: z.literal('single-select'),
  profileField: profileFieldSchema,
  question: copyVariantsSchema,
  /** Optional plain-English framing above the options. */
  help: copyVariantsSchema.optional(),
  /** Short label for the thread and for revisit links. */
  threadLabel: copyVariantsSchema,
  options: z.array(questionOptionSchema).min(2),
  showWhen: z.array(conditionSchema).optional(),
})
export type Question = z.infer<typeof questionSchema>

/** Answers keyed by question id. The single source of truth for the journey. */
export type AnswerMap = Readonly<Record<string, string>>

export function readProfileField(
  profile: ParticipantProfile,
  field: ProfileField,
): string | null {
  switch (field) {
    case 'perspective':
      return profile.perspective
    case 'housing.current':
      return profile.housing.current
    case 'housing.desired':
      return profile.housing.desired
    case 'housing.featureNeeds':
      return profile.housing.featureNeeds
    case 'support.dailyIntensity':
      return profile.support.dailyIntensity
    case 'support.overnight':
      return profile.support.overnight
    case 'support.informal':
      return profile.support.informal
    case 'goals.change':
      return profile.goals.change
    case 'context.lifeStage':
      return profile.context.lifeStage
    case 'context.timing':
      return profile.context.timing
    case 'context.ndis':
      return profile.context.ndis
  }
}

/**
 * Writes a validated value into the profile. Returns false when the value is
 * not valid for the field, so a stale saved answer can be dropped rather than
 * corrupting the profile.
 *
 * Each case parses with its own schema. That is more lines than a lookup table,
 * but it is the version the compiler can check: a new profile field cannot be
 * added without handling it here.
 */
export function writeProfileField(
  profile: ParticipantProfile,
  field: ProfileField,
  value: string,
): boolean {
  switch (field) {
    case 'perspective': {
      const parsed = userPerspectiveSchema.safeParse(value)
      if (!parsed.success) return false
      profile.perspective = parsed.data
      return true
    }
    case 'housing.current': {
      const parsed = currentLivingSchema.safeParse(value)
      if (!parsed.success) return false
      profile.housing.current = parsed.data
      return true
    }
    case 'housing.desired': {
      const parsed = desiredLivingSchema.safeParse(value)
      if (!parsed.success) return false
      profile.housing.desired = parsed.data
      return true
    }
    case 'housing.featureNeeds': {
      const parsed = housingFeatureNeedSchema.safeParse(value)
      if (!parsed.success) return false
      profile.housing.featureNeeds = parsed.data
      return true
    }
    case 'support.dailyIntensity': {
      const parsed = supportIntensitySchema.safeParse(value)
      if (!parsed.success) return false
      profile.support.dailyIntensity = parsed.data
      return true
    }
    case 'support.overnight': {
      const parsed = overnightSupportSchema.safeParse(value)
      if (!parsed.success) return false
      profile.support.overnight = parsed.data
      return true
    }
    case 'support.informal': {
      const parsed = informalSupportSchema.safeParse(value)
      if (!parsed.success) return false
      profile.support.informal = parsed.data
      return true
    }
    case 'goals.change': {
      const parsed = desiredChangeSchema.safeParse(value)
      if (!parsed.success) return false
      profile.goals.change = parsed.data
      return true
    }
    case 'context.lifeStage': {
      const parsed = lifeStageSchema.safeParse(value)
      if (!parsed.success) return false
      profile.context.lifeStage = parsed.data
      return true
    }
    case 'context.timing': {
      const parsed = timingSchema.safeParse(value)
      if (!parsed.success) return false
      profile.context.timing = parsed.data
      return true
    }
    case 'context.ndis': {
      const parsed = ndisContextSchema.safeParse(value)
      if (!parsed.success) return false
      profile.context.ndis = parsed.data
      return true
    }
  }
}
