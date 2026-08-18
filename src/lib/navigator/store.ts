'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { evaluateFlow, type FlowState } from './flow'
import { journeyStorage } from '@/lib/persistence/journey-storage'
import { DEFAULT_TRACK_ID, trackById } from '@/tracks'
import type { AnswerMap } from './question-schema'

/**
 * Navigator state.
 *
 * Only two things are stored: the answers, and which question is on screen.
 * Everything else is derived, so there is no second copy of the truth to keep
 * in sync. Answers are never deleted when the person revisits a question.
 */
type NavigatorState = {
  answers: Record<string, string>
  /**
   * The question on screen, per track. Absent means "the first unanswered one".
   *
   * Per track rather than one value because someone part-way through two tracks
   * should resume each where they left it, not be dropped back to a single
   * shared position.
   */
  activeQuestionId: Partial<Record<string, string | null>>
  answer: (questionId: string, value: string, trackId?: string) => void
  goTo: (questionId: string, trackId?: string) => void
  goBack: (trackId?: string) => void
  reset: () => void
}

type PersistedShape = {
  answers?: Record<string, string>
  /** A bare string is pre-track state: it belonged to home and living. */
  activeQuestionId?: string | Partial<Record<string, string | null>> | null
}

/**
 * Brings stored state forward.
 *
 * The storage key stays at v1 on purpose. Housing question ids did not change,
 * so saved answers are still valid, and bumping the key would discard journeys —
 * "a user returning to a saved journey" is a required end-to-end test.
 */
export function migrateNavigatorState(stored: PersistedShape): {
  answers: Record<string, string>
  activeQuestionId: Partial<Record<string, string | null>>
} {
  const answers = stored.answers ?? {}
  const active = stored.activeQuestionId
  if (typeof active === 'string') {
    return { answers, activeQuestionId: { [DEFAULT_TRACK_ID]: active } }
  }
  return { answers, activeQuestionId: active ?? {} }
}

export const NAVIGATOR_STORAGE_KEY = 'ndis-housing.journey.v1'

export const useNavigatorStore = create<NavigatorState>()(
  persist(
    (set, get) => ({
      answers: {},
      activeQuestionId: {},

      answer: (questionId, value, trackId = DEFAULT_TRACK_ID) => {
        const answers = { ...get().answers, [questionId]: value }
        const { visible, current, answeredIds } = evaluateFlow(
          answers,
          trackById(trackId),
        )
        const position = visible.findIndex((question) => question.id === questionId)
        const next =
          visible.slice(position + 1).find((question) => !answeredIds.has(question.id)) ??
          current
        set({
          answers,
          activeQuestionId: {
            ...get().activeQuestionId,
            [trackId]: next?.id ?? null,
          },
        })
      },

      goTo: (questionId, trackId = DEFAULT_TRACK_ID) =>
        set({ activeQuestionId: { ...get().activeQuestionId, [trackId]: questionId } }),

      goBack: (trackId = DEFAULT_TRACK_ID) => {
        const { answers, activeQuestionId } = get()
        const { visible, current } = evaluateFlow(answers, trackById(trackId))
        const activeId = activeQuestionId[trackId] ?? current?.id ?? null
        // With no active question the journey is finished, so "back" means the
        // last question in the journey.
        const position =
          activeId === null
            ? visible.length
            : visible.findIndex((question) => question.id === activeId)
        const previous = position > 0 ? visible[position - 1] : undefined
        if (previous) {
          set({
            activeQuestionId: { ...activeQuestionId, [trackId]: previous.id },
          })
        }
      },

      reset: () => set({ answers: {}, activeQuestionId: {} }),
    }),
    {
      name: NAVIGATOR_STORAGE_KEY,
      storage: createJSONStorage(journeyStorage),
      partialize: ({ answers, activeQuestionId }) => ({ answers, activeQuestionId }),
      version: 1,
      migrate: (stored) => migrateNavigatorState(stored as PersistedShape),
    },
  ),
)

/** The derived view of the journey. Recomputed from answers on every render. */
export function useFlow(
  trackId: string = DEFAULT_TRACK_ID,
): FlowState & { activeQuestionId: string | null } {
  const answers = useNavigatorStore((state) => state.answers)
  const active = useNavigatorStore((state) => state.activeQuestionId[trackId])
  return {
    ...evaluateFlow(answers as AnswerMap, trackById(trackId)),
    activeQuestionId: active ?? null,
  }
}
