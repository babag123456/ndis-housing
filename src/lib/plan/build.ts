import type { ParticipantProfile } from '@/types/profile'
import type { Voice } from '@/lib/copy/perspective'
import type { ThreadEntry } from '@/lib/navigator/flow'
import { explainPathways, type ExplainedPathway } from '@/lib/decision-engine'
import { explainRoadmap, type ExplainedStep } from '@/lib/roadmap'
import { allConditionsHold, anyConditionHolds } from '@/lib/conditions'
import { HOME_AND_LIVING } from '@/tracks/home-and-living'
import type { Track } from '@/tracks/track'
import { FUNDING_BY_ID } from '@content/funding'
import { ORGANISATIONS } from '@content/organisations'
import type { FundingSourceContent, Organisation } from '@/lib/content/schema'

/**
 * The plan.
 *
 * Derived, not stored. Everything here is computed from the person's answers, so
 * there is no second copy of the truth to go stale when an answer changes. The
 * only thing that genuinely needs saving is which items the person has ticked
 * off, and that lives in the plan store.
 */

export type PlanChecklistItem = {
  /** Stable across sessions as long as the wording is unchanged. */
  id: string
  text: string
  /** The options this item is for, so a person can see why it is on the list. */
  neededFor: readonly string[]
}

/** A source of money, and which of the person's options draw on it. */
export type PlanFunding = {
  source: FundingSourceContent
  forOptions: readonly string[]
}

export type PlanOpenQuestion = {
  questionId: string
  question: string
}

export type Plan = {
  /** The situation in the person's own words, as recorded on the thread. */
  situation: readonly ThreadEntry[]
  /** Options that appear to fit: strong matches first, then worth exploring. */
  likely: readonly ExplainedPathway[]
  needsMoreInformation: readonly ExplainedPathway[]
  lowerRelevance: readonly ExplainedPathway[]
  /** What is still unanswered, once across the whole plan rather than per option. */
  openQuestions: readonly PlanOpenQuestion[]
  evidence: readonly PlanChecklistItem[]
  questionsToAsk: readonly PlanChecklistItem[]
  roadmap: readonly ExplainedStep[]
  /** Who may pay, kept separate from what each option is. */
  funding: readonly PlanFunding[]
  /** The kinds of help worth approaching, given the situation. */
  organisations: readonly Organisation[]
}

/** A readable, stable id derived from the wording of an item. */
function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/**
 * Collects items from several options into one list.
 *
 * The same requirement often appears under more than one option. Listing it once
 * and naming the options it serves turns a repetitive pile into a checklist a
 * person can actually work through.
 */
function gather(
  pathways: readonly ExplainedPathway[],
  select: (pathway: ExplainedPathway) => readonly string[],
): PlanChecklistItem[] {
  const byText = new Map<string, PlanChecklistItem>()

  for (const result of pathways) {
    for (const text of select(result)) {
      const existing = byText.get(text)
      if (existing) {
        byText.set(text, {
          ...existing,
          neededFor: [...existing.neededFor, result.pathway.plainName],
        })
      } else {
        byText.set(text, {
          id: slug(text),
          text,
          neededFor: [result.pathway.plainName],
        })
      }
    }
  }

  return [...byText.values()]
}

/**
 * Gathers the funding sources the likely options draw on.
 *
 * Built from the options rather than authored per person, so a mainstream source
 * like rent assistance appears whenever an option needs it — including when every
 * other option on the list is NDIS-funded.
 */
function gatherFunding(pathways: readonly ExplainedPathway[]): PlanFunding[] {
  const bySource = new Map<string, PlanFunding>()

  for (const result of pathways) {
    for (const id of result.pathway.fundingSources) {
      const source = FUNDING_BY_ID.get(id)
      if (source === undefined) continue

      const existing = bySource.get(id)
      bySource.set(id, {
        source,
        forOptions: existing
          ? [...existing.forOptions, result.pathway.plainName]
          : [result.pathway.plainName],
      })
    }
  }

  return [...bySource.values()]
}

function relevantOrganisations(profile: ParticipantProfile): Organisation[] {
  return ORGANISATIONS.filter((organisation) => {
    if (organisation.showWhen && !allConditionsHold(profile, organisation.showWhen)) {
      return false
    }
    if (organisation.showWhenAny && !anyConditionHolds(profile, organisation.showWhenAny)) {
      return false
    }
    return true
  })
}

export function buildPlan({
  profile,
  voice,
  thread,
  track = HOME_AND_LIVING,
}: {
  profile: ParticipantProfile
  voice: Voice | null
  thread: readonly ThreadEntry[]
  track?: Track
}): Plan {
  const groups = explainPathways(profile, voice, track)
  const inState = (state: ExplainedPathway['state']) =>
    groups.find((group) => group.state === state)?.pathways ?? []

  const strong = inState('strong_match')
  const worth = inState('worth_exploring')
  const likely = [...strong, ...worth]
  const needsMoreInformation = inState('needs_more_information')
  const lowerRelevance = inState('lower_relevance')

  // Open questions are asked once for the plan, not once per option that needs
  // them, so the same question is never on the list twice.
  const openQuestions = new Map<string, PlanOpenQuestion>()
  for (const result of [...likely, ...needsMoreInformation]) {
    for (const open of result.openQuestions) {
      openQuestions.set(open.questionId, open)
    }
  }

  return {
    situation: thread,
    likely,
    needsMoreInformation,
    lowerRelevance,
    openQuestions: [...openQuestions.values()],
    // Only options that may actually suit generate work. Asking someone to
    // gather evidence for an option we have just called less relevant would be
    // busywork.
    evidence: gather(likely, (result) => result.pathway.evidence),
    questionsToAsk: gather(likely, (result) => result.pathway.questionsToAsk),
    roadmap: explainRoadmap(profile, voice, track.steps),
    funding: gatherFunding(likely),
    organisations: relevantOrganisations(profile),
  }
}

export type PlanCompletion = {
  steps: Readonly<Record<string, true>>
  evidence: Readonly<Record<string, true>>
}

export type PlanProgress = {
  stepsDone: number
  stepsTotal: number
  evidenceDone: number
  evidenceTotal: number
  percentComplete: number
}

/**
 * Counts progress against the plan as it stands now.
 *
 * Ticks are kept even when an item leaves the plan — an answer may change back —
 * but they are not counted while the item is absent, so progress can never
 * exceed what is actually on the list.
 */
export function planProgress(plan: Plan, completed: PlanCompletion): PlanProgress {
  const stepsDone = plan.roadmap.filter((step) => completed.steps[step.id] === true).length
  const evidenceDone = plan.evidence.filter(
    (item) => completed.evidence[item.id] === true,
  ).length

  const total = plan.roadmap.length + plan.evidence.length
  const done = stepsDone + evidenceDone

  return {
    stepsDone,
    stepsTotal: plan.roadmap.length,
    evidenceDone,
    evidenceTotal: plan.evidence.length,
    percentComplete: total === 0 ? 0 : Math.round((done / total) * 100),
  }
}
