'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { journeyStorage } from '@/lib/persistence/journey-storage'
import type { PlanCompletion } from './build'

/**
 * What the person has ticked off.
 *
 * The only part of the plan that is stored, because it is the only part that is
 * not derivable from their answers. It goes through the same persistence seam as
 * the journey, so both move to a backend together.
 */
type PlanStoreState = PlanCompletion & {
  toggleStep: (id: string) => void
  toggleEvidence: (id: string) => void
  clearProgress: () => void
}

export const PLAN_STORAGE_KEY = 'ndis-housing.plan.v1'

/** Removes the key when unticking, so storage holds ticks rather than a mixture. */
function toggle(
  current: Readonly<Record<string, true>>,
  id: string,
): Record<string, true> {
  const next = { ...current }
  if (next[id] === true) {
    delete next[id]
  } else {
    next[id] = true
  }
  return next
}

export const usePlanStore = create<PlanStoreState>()(
  persist(
    (set, get) => ({
      steps: {},
      evidence: {},
      toggleStep: (id) => set({ steps: toggle(get().steps, id) }),
      toggleEvidence: (id) => set({ evidence: toggle(get().evidence, id) }),
      clearProgress: () => set({ steps: {}, evidence: {} }),
    }),
    {
      name: PLAN_STORAGE_KEY,
      storage: createJSONStorage(journeyStorage),
      partialize: ({ steps, evidence }) => ({ steps, evidence }),
    },
  ),
)
