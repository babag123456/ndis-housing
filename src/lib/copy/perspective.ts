import type { UserPerspective } from '@/types/profile'

/**
 * The perspective/copy layer.
 *
 * One question set serves every perspective. A question declares two variants —
 * how it reads when someone is exploring for themselves, and how it reads when
 * they are exploring for another person — and this module resolves them.
 *
 * Note on pronouns: CLAUDE.md's sketch used first person ("I") for the self
 * perspective, but its own question examples are second person ("Where do you
 * live now?"). Second person is what an interface actually says to a reader, so
 * the voice is you/they rather than I/they.
 */

/** A phrase written once per perspective rather than once per screen. */
export type CopyVariants = {
  /** Reads for someone exploring for themselves. */
  self: string
  /** Reads for someone exploring for another person. */
  other: string
}

export type Voice = {
  perspective: UserPerspective
  /** True when the user is the person the plan is about. */
  isSelf: boolean
  /** "you live" / "they live" */
  subject: 'you' | 'they'
  /** "ask you" / "ask them" */
  object: 'you' | 'them'
  /** "your home" / "their home" */
  possessive: 'your' | 'their'
  /** "by yourself" / "by themselves" */
  reflexive: 'yourself' | 'themselves'
  /** "you're exploring" / "they're exploring" */
  contraction: "you're" | "they're"
  /**
   * How to name the person in a sentence about them, e.g.
   * "exploring options for your child".
   */
  personLabel: string
}

const PERSON_LABELS: Record<UserPerspective, string> = {
  self: 'yourself',
  parent: 'your child',
  carer: 'the person you care for',
  family: 'your family member',
  professional: 'the person you support',
  other: 'the person you have in mind',
}

export function voiceFor(perspective: UserPerspective): Voice {
  const isSelf = perspective === 'self'
  return {
    perspective,
    isSelf,
    subject: isSelf ? 'you' : 'they',
    object: isSelf ? 'you' : 'them',
    possessive: isSelf ? 'your' : 'their',
    reflexive: isSelf ? 'yourself' : 'themselves',
    contraction: isSelf ? "you're" : "they're",
    personLabel: PERSON_LABELS[perspective],
  }
}

/**
 * Resolves a phrase for the current voice. Falls back to the "other" variant
 * before a perspective has been chosen, because that wording ("How would they
 * like to live?") is never wrong about the reader — it just isn't yet personal.
 */
export function resolveCopy(variants: CopyVariants, voice: Voice | null): string {
  if (voice?.isSelf) return variants.self
  return variants.other
}

/** Capitalises the first letter only, leaving proper nouns and acronyms alone. */
export function sentenceCase(text: string): string {
  if (text.length === 0) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}
