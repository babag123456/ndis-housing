'use client'

import { useSyncExternalStore } from 'react'
import { useFlow, useNavigatorStore } from '@/lib/navigator/store'
import { HOME_AND_LIVING } from '@/tracks/home-and-living'
import { buildPlan, planProgress } from './build'
import { usePlanStore } from './store'

/**
 * The plan, as the screens see it.
 *
 * Rebuilt from the answers on every render rather than cached, so an answer
 * changed on one screen is reflected on every other one without any
 * synchronising code.
 */
export function usePlan() {
  const { profile, voice, thread, current, visible, answeredCount } = useFlow(HOME_AND_LIVING.id)
  const steps = usePlanStore((state) => state.steps)
  const evidence = usePlanStore((state) => state.evidence)

  // Both stores read saved state, so both have to be hydrated before the screen
  // can show anything truthful.
  const journeyReady = useSyncExternalStore(
    (onChange) => useNavigatorStore.persist.onFinishHydration(onChange),
    () => useNavigatorStore.persist.hasHydrated(),
    () => false,
  )
  const planReady = useSyncExternalStore(
    (onChange) => usePlanStore.persist.onFinishHydration(onChange),
    () => usePlanStore.persist.hasHydrated(),
    () => false,
  )

  const plan = buildPlan({ profile, voice, thread, track: HOME_AND_LIVING })

  return {
    plan,
    voice,
    progress: planProgress(plan, { steps, evidence }),
    completion: { steps, evidence },
    ready: journeyReady && planReady,
    /** True once every question that applies has an answer. */
    isComplete: current === null,
    questionsRemaining: visible.length - answeredCount,
    answeredCount,
  }
}
