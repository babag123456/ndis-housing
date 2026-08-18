'use client'

import { useState, useSyncExternalStore } from 'react'
import { JourneySummary } from './JourneySummary'
import { QuestionCard } from './QuestionCard'
import { Thread } from './Thread'
import { useFlow, useNavigatorStore } from '@/lib/navigator/store'
import { usePlanStore } from '@/lib/plan'

/**
 * Puts the journey on screen.
 *
 * All of the decisions about which question comes next live in the flow module.
 * This component only renders what the flow returns, so the journey can be
 * tested without a browser.
 */
export function Navigator() {
  const answers = useNavigatorStore((state) => state.answers)
  const answer = useNavigatorStore((state) => state.answer)
  const goTo = useNavigatorStore((state) => state.goTo)
  const goBack = useNavigatorStore((state) => state.goBack)
  const reset = useNavigatorStore((state) => state.reset)
  const clearProgress = usePlanStore((state) => state.clearProgress)
  const { visible, current, thread, voice, estimatedTotal, activeQuestionId, profile } =
    useFlow()

  // Saved answers are external state, so they are read through the external
  // store API rather than an effect. The server snapshot is always "not ready",
  // which keeps the first paint on the server and in the browser identical.
  const ready = useSyncExternalStore(
    (onChange) => useNavigatorStore.persist.onFinishHydration(onChange),
    () => useNavigatorStore.persist.hasHydrated(),
    () => false,
  )

  // Focus follows the person only once they have acted. Moving focus on load
  // would take them past the skip link before they had a chance to use it.
  const [hasNavigated, setHasNavigated] = useState(false)
  const revisit = (questionId: string) => {
    setHasNavigated(true)
    goTo(questionId)
  }

  const active =
    visible.find((question) => question.id === activeQuestionId) ?? current
  const position = active ? visible.findIndex((q) => q.id === active.id) + 1 : 0
  const threadEntries = active
    ? thread.filter((entry) => entry.questionId !== active.id)
    : thread

  if (!ready) {
    return (
      <p className="text-moss" role="status">
        Loading your answers…
      </p>
    )
  }

  return (
    <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-20">
      {/* The question comes first in the document, so on a narrow screen a
          person reads the question before the record of earlier answers. */}
      <div>
        {active ? (
          <QuestionCard
            key={active.id}
            question={active}
            voice={voice}
            selected={answers[active.id]}
            position={position}
            estimatedTotal={estimatedTotal}
            canGoBack={position > 1}
            moveFocus={hasNavigated}
            onAnswer={(value) => {
              setHasNavigated(true)
              answer(active.id, value)
            }}
            onBack={() => {
              setHasNavigated(true)
              goBack()
            }}
          />
        ) : (
          <JourneySummary
            entries={thread}
            voice={voice}
            uncertainCount={profile.uncertainties.length}
            moveFocus={hasNavigated}
            onRevisit={revisit}
            onStartAgain={() => {
              setHasNavigated(false)
              reset()
              // A new journey is a new plan; old ticks would not mean anything.
              clearProgress()
            }}
          />
        )}
      </div>

      {/* The summary screen shows the thread in full in the main column, so the
          marginal copy would only repeat it. */}
      {active && threadEntries.length > 0 && (
        <div className="border-t border-hairline pt-6 lg:sticky lg:top-10 lg:self-start lg:border-t-0 lg:pt-1">
          <Thread
            entries={threadEntries}
            activeQuestionId={activeQuestionId}
            onRevisit={revisit}
            heading="What you've told us"
          />
        </div>
      )}
    </div>
  )
}
