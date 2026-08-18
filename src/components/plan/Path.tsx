'use client'

import Link from 'next/link'
import { ProgressReadout } from './ProgressReadout'
import { StepList } from './StepList'
import { UnfinishedJourney } from './UnfinishedJourney'
import { useHousingPlan, usePlanStore } from '@/lib/plan'

/**
 * The pathway screen.
 *
 * The steps come from the roadmap builder, which reads the person's own answers,
 * so an urgent situation gets a different order rather than the same list with an
 * urgent tone.
 */
export function Path() {
  const toggleStep = usePlanStore((state) => state.toggleStep)
  const { plan, progress, completion, ready, isComplete, questionsRemaining, answeredCount } =
    useHousingPlan()

  if (!ready) {
    return (
      <p className="text-moss" role="status">
        Working out your pathway…
      </p>
    )
  }

  if (!isComplete) {
    return (
      <UnfinishedJourney
        what="pathway"
        answeredCount={answeredCount}
        questionsRemaining={questionsRemaining}
      />
    )
  }

  const nextStep = plan.roadmap.find((step) => completion.steps[step.id] !== true)

  return (
    <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-20">
      <div className="rise">
        <p className="eyebrow mb-6">Your pathway</p>
        <h1 className="measure font-display text-[clamp(1.75rem,1.1rem+2.4vw,2.625rem)] font-medium">
          {plan.roadmap.length} steps, in the order that saves the most time
        </h1>
        <p className="measure mt-5 text-lede text-ink-soft">
          This order comes from what you told us. Some steps take months to move,
          which is why they are near the top even though they feel early.
        </p>

        {nextStep ? (
          <section
            aria-labelledby="next-step"
            className="measure mt-9 border-l-4 border-plum bg-paper-raised px-5 py-4"
          >
            <h2 id="next-step" className="eyebrow mb-1">
              Your next step
            </h2>
            <p className="font-display text-[1.1875rem] leading-[1.3] font-medium">
              {nextStep.title}
            </p>
            <p className="mt-2 text-[0.9375rem] text-ink-soft">{nextStep.doNow[0]}</p>
          </section>
        ) : (
          <section
            aria-labelledby="all-done"
            className="measure mt-9 border-l-4 border-eucalypt bg-paper-raised px-5 py-4"
          >
            <h2 id="all-done" className="eyebrow mb-1">
              Every step is ticked
            </h2>
            <p className="text-[0.9375rem]">
              Worth setting a date to review how the arrangement is actually working.
            </p>
          </section>
        )}

        <div className="measure mt-14">
          <StepList
            steps={plan.roadmap}
            completed={completion.steps}
            onToggle={toggleStep}
          />
        </div>

        <p className="measure mt-12 border-t border-hairline pt-8">
          <Link href="/my-plan" className="text-eucalypt underline">
            See everything in your plan
          </Link>
        </p>
      </div>

      <div className="border-t border-hairline pt-6 lg:sticky lg:top-10 lg:self-start lg:border-t-0 lg:pt-1">
        <ProgressReadout progress={progress} />
      </div>
    </div>
  )
}
