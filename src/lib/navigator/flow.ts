import { createEmptyProfile, type ParticipantProfile } from '@/types/profile'
import { resolveCopy, voiceFor, type Voice } from '@/lib/copy/perspective'
import { QUESTIONS } from './questions'
import {
  readProfileField,
  writeProfileField,
  type AnswerMap,
  type Condition,
  type Question,
} from './question-schema'

/**
 * The conditional question flow.
 *
 * Answers are the only stored state. The profile, the visible question list, the
 * thread and progress are all derived from them on every read. That means going
 * back and changing an answer cannot leave a stale profile value behind, and a
 * saved journey can be replayed after the question set changes.
 */

export type QuestionVisibility = 'visible' | 'skipped' | 'undetermined'

/** One answered question, written back in plain English. */
export type ThreadEntry = {
  questionId: string
  label: string
  statement: string
  /** True when the person answered "I'm not sure". */
  unsure: boolean
}

export type FlowState = {
  profile: ParticipantProfile
  voice: Voice | null
  /** Questions to ask, in order, given the answers so far. */
  visible: readonly Question[]
  /** The next question with no answer, or null when the journey is complete. */
  current: Question | null
  thread: readonly ThreadEntry[]
  /** Question ids whose stored answer was accepted into the profile. */
  answeredIds: ReadonlySet<string>
  answeredCount: number
  /**
   * Questions that are visible or whose visibility is not yet determined.
   * An estimate, because later answers can reveal or skip questions.
   */
  estimatedTotal: number
  /**
   * Answers kept in storage that no longer belong to the journey, because an
   * earlier answer changed or the value is no longer valid. Never applied to
   * the profile, and never discarded either — the person may change back.
   */
  inactiveAnswerIds: readonly string[]
}

function evaluateCondition(
  condition: Condition,
  profile: ParticipantProfile,
): QuestionVisibility {
  const value = readProfileField(profile, condition.field)

  if (condition.isUnanswered === true) {
    return value === null ? 'visible' : 'skipped'
  }
  if (value === null) return 'undetermined'
  if (condition.oneOf && !condition.oneOf.includes(value)) return 'skipped'
  if (condition.notOneOf && condition.notOneOf.includes(value)) return 'skipped'
  return 'visible'
}

function evaluateVisibility(
  question: Question,
  profile: ParticipantProfile,
): QuestionVisibility {
  if (!question.showWhen || question.showWhen.length === 0) return 'visible'

  let result: QuestionVisibility = 'visible'
  for (const condition of question.showWhen) {
    const outcome = evaluateCondition(condition, profile)
    if (outcome === 'skipped') return 'skipped'
    if (outcome === 'undetermined') result = 'undetermined'
  }
  return result
}

/**
 * Walks the question list once, building the profile as it goes.
 *
 * Building incrementally matters: a question's condition is evaluated against
 * only the answers that come before it, so answering a later question can never
 * make an earlier one disappear from the journey.
 */
export function evaluateFlow(answers: AnswerMap): FlowState {
  const profile = createEmptyProfile()
  const visible: Question[] = []
  const thread: ThreadEntry[] = []
  const inactiveAnswerIds: string[] = []
  /** Questions whose stored answer was accepted into the profile. */
  const answeredIds = new Set<string>()
  let undeterminedCount = 0
  let voice: Voice | null = null

  for (const question of QUESTIONS) {
    const visibility = evaluateVisibility(question, profile)

    if (visibility === 'undetermined') {
      undeterminedCount += 1
      continue
    }
    if (visibility === 'skipped') {
      if (answers[question.id] !== undefined) inactiveAnswerIds.push(question.id)
      continue
    }

    visible.push(question)

    const answer = answers[question.id]
    if (answer === undefined) continue

    const option = question.options.find((candidate) => candidate.value === answer)
    if (!option) {
      // A stored answer that is no longer an offered option. Ignore it rather
      // than write an invalid value into the profile.
      inactiveAnswerIds.push(question.id)
      continue
    }

    if (!writeProfileField(profile, question.profileField, option.value)) {
      inactiveAnswerIds.push(question.id)
      continue
    }
    for (const implied of option.implies ?? []) {
      writeProfileField(profile, implied.field, implied.value)
    }
    answeredIds.add(question.id)
    if (option.unsure === true && !profile.uncertainties.includes(question.id)) {
      profile.uncertainties.push(question.id)
    }

    // Perspective is the first question, so the voice is set before any
    // perspective-aware copy is resolved below.
    if (profile.perspective !== null) {
      voice = voiceFor(profile.perspective)
    }

    thread.push({
      questionId: question.id,
      label: resolveCopy(question.threadLabel, voice),
      statement: resolveCopy(option.statement, voice),
      unsure: option.unsure === true,
    })
  }

  const current = visible.find((question) => !answeredIds.has(question.id)) ?? null

  return {
    profile,
    voice,
    visible,
    current,
    thread,
    answeredIds,
    answeredCount: answeredIds.size,
    estimatedTotal: visible.length + undeterminedCount,
    inactiveAnswerIds,
  }
}
