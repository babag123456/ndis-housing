'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { evaluateFlow, type FlowState } from './flow'
import { journeyStorage } from '@/lib/persistence/journey-storage'
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
  /** The question on screen. Null means "the first unanswered one". */
  activeQuestionId: string | null
  answer: (questionId: string, value: string) => void
  goTo: (questionId: string) => void
  goBack: () => void
  reset: () => void
}

export const NAVIGATOR_STORAGE_KEY = 'ndis-housing.journey.v1'

export const useNavigatorStore = create<NavigatorState>()(
  persist(
    (set, get) => ({
      answers: {},
      activeQuestionId: null,

      answer: (questionId, value) => {
        const answers = { ...get().answers, [questionId]: value }
        const { visible, current, answeredIds } = evaluateFlow(answers)
        const position = visible.findIndex((question) => question.id === questionId)
        const next =
          visible.slice(position + 1).find((question) => !answeredIds.has(question.id)) ??
          current
        set({ answers, activeQuestionId: next?.id ?? null })
      },

      goTo: (questionId) => set({ activeQuestionId: questionId }),

      goBack: () => {
        const { answers, activeQuestionId } = get()
        const { visible, current } = evaluateFlow(answers)
        const activeId = activeQuestionId ?? current?.id ?? null
        // With no active question the journey is finished, so "back" means the
        // last question in the journey.
        const position =
          activeId === null
            ? visible.length
            : visible.findIndex((question) => question.id === activeId)
        const previous = position > 0 ? visible[position - 1] : undefined
        if (previous) set({ activeQuestionId: previous.id })
      },

      reset: () => set({ answers: {}, activeQuestionId: null }),
    }),
    {
      name: NAVIGATOR_STORAGE_KEY,
      storage: createJSONStorage(journeyStorage),
      partialize: ({ answers, activeQuestionId }) => ({ answers, activeQuestionId }),
    },
  ),
)

/** The derived view of the journey. Recomputed from answers on every render. */
export function useFlow(): FlowState & { activeQuestionId: string | null } {
  const answers = useNavigatorStore((state) => state.answers)
  const activeQuestionId = useNavigatorStore((state) => state.activeQuestionId)
  return { ...evaluateFlow(answers as AnswerMap), activeQuestionId }
}
