'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Checklist } from './Checklist'
import { ProgressReadout } from './ProgressReadout'
import { UnfinishedJourney } from './UnfinishedJourney'
import { Thread } from '@/components/navigator/Thread'
import { usePlan, usePlanStore } from '@/lib/plan'
import { useNavigatorStore } from '@/lib/navigator/store'
import { HOME_AND_LIVING } from '@/tracks/home-and-living'

/**
 * The plan.
 *
 * One page holding everything the person has built up: their situation, what may
 * suit, what is still unknown, what to gather, what to ask, and where they are up
 * to. It summarises and links rather than repeating the options in full, so it
 * stays readable as the plan grows.
 */
export function MyPlan() {
  const router = useRouter()
  const goTo = useNavigatorStore((state) => state.goTo)
  const toggleEvidence = usePlanStore((state) => state.toggleEvidence)
  const {
    plan,
    progress,
    completion,
    ready,
    isComplete,
    questionsRemaining,
    answeredCount,
    voice,
  } = usePlan()

  function revisit(questionId: string) {
    goTo(questionId, HOME_AND_LIVING.id)
    router.push('/start')
  }

  if (!ready) {
    return (
      <p className="text-moss" role="status">
        Opening your plan…
      </p>
    )
  }

  if (!isComplete) {
    return (
      <UnfinishedJourney
        what="plan"
        answeredCount={answeredCount}
        questionsRemaining={questionsRemaining}
      />
    )
  }

  const person = voice?.isSelf ? 'you' : 'them'
  const nextStep = plan.roadmap.find((step) => completion.steps[step.id] !== true)

  return (
    <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-20">
      <div className="rise">
        <p className="eyebrow mb-6">Your plan</p>
        <h1 className="measure font-display text-[clamp(1.75rem,1.1rem+2.4vw,2.625rem)] font-medium">
          Everything in one place
        </h1>
        <p className="measure mt-5 text-lede text-ink-soft">
          This is yours. It stays in this browser, and it updates whenever you change
          an answer.
        </p>

        {nextStep && (
          <section
            aria-labelledby="plan-next"
            className="measure mt-10 border-l-4 border-plum bg-paper-raised px-5 py-4"
          >
            <h2 id="plan-next" className="eyebrow mb-1">
              Your next step
            </h2>
            <p className="font-display text-[1.1875rem] leading-[1.3] font-medium">
              {nextStep.title}
            </p>
            <p className="mt-2 text-[0.9375rem] text-ink-soft">{nextStep.doNow[0]}</p>
            <p className="mt-3 text-[0.9375rem]">
              <Link href="/path" className="text-eucalypt underline">
                See all {plan.roadmap.length} steps
              </Link>
            </p>
          </section>
        )}

        <section aria-labelledby="plan-options" className="measure mt-14">
          <h2
            id="plan-options"
            className="font-display text-[1.625rem] leading-[1.2] font-medium"
          >
            Options that may suit {person}
          </h2>
          {plan.likely.length === 0 && (
            <p className="mt-4 border-l-4 border-plum bg-paper-raised px-4 py-3 text-[0.9375rem]">
              There is not enough here yet to put any option forward. That is a
              reflection of what we know, not of what is available. Answering the
              questions below would change it.
            </p>
          )}
          <ul className="mt-5 divide-y divide-hairline border-y border-hairline">
            {plan.likely.map((result) => (
              <li key={result.pathway.id} className="py-4">
                <p className="text-[1rem] leading-[1.4]">{result.pathway.plainName}</p>
                {result.pathway.formalName && (
                  <p className="mt-1 text-[0.8125rem] text-moss">
                    {result.pathway.formalName}
                    {result.pathway.acronym ? ` (${result.pathway.acronym})` : ''}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[0.9375rem]">
            <Link href="/options" className="text-eucalypt underline">
              {plan.likely.length === 0
                ? 'See what we can say so far'
                : 'Read why each of these is here'}
            </Link>
          </p>

          {plan.lowerRelevance.length > 0 && (
            <details className="mt-6 border-t border-hairline pt-3">
              <summary className="cursor-pointer text-[0.9375rem] text-eucalypt underline">
                Options that appear less relevant ({plan.lowerRelevance.length})
              </summary>
              <ul className="mt-4 space-y-2 text-[0.9375rem] text-ink-soft">
                {plan.lowerRelevance.map((result) => (
                  <li key={result.pathway.id}>{result.pathway.plainName}</li>
                ))}
              </ul>
            </details>
          )}
        </section>

        {plan.openQuestions.length > 0 && (
          <section aria-labelledby="plan-unknown" className="measure mt-14">
            <h2
              id="plan-unknown"
              className="font-display text-[1.625rem] leading-[1.2] font-medium"
            >
              Still to find out
            </h2>
            <p className="mt-3 text-[0.9375rem] text-ink-soft">
              Answering these would let us say more. There is no rush, and
              &ldquo;I&rsquo;m not sure&rdquo; is still a fine answer.
            </p>
            <ul className="mt-5 space-y-3">
              {plan.openQuestions.map((open) => (
                <li key={open.questionId}>
                  <button
                    type="button"
                    onClick={() => revisit(open.questionId)}
                    className="cursor-pointer border-0 bg-transparent p-0 text-left text-[0.9375rem] text-eucalypt underline"
                  >
                    {open.question}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {plan.evidence.length > 0 && (
          <section aria-labelledby="plan-evidence" className="measure mt-14">
            <h2
              id="plan-evidence"
              className="font-display text-[1.625rem] leading-[1.2] font-medium"
            >
              What to gather
            </h2>
            <p className="mt-3 text-[0.9375rem] text-ink-soft">
              Each item appears once, even when several options need it. Nothing here
              guarantees an outcome — it is what a request is usually decided on.
            </p>
            <div className="mt-5">
              <Checklist
                items={plan.evidence}
                completed={completion.evidence}
                onToggle={toggleEvidence}
              />
            </div>
          </section>
        )}

        {plan.funding.length > 0 && (
          <section aria-labelledby="plan-funding" className="measure mt-14">
            <h2
              id="plan-funding"
              className="font-display text-[1.625rem] leading-[1.2] font-medium"
            >
              Who may pay
            </h2>
            <p className="mt-3 text-[0.9375rem] text-ink-soft">
              Your options draw on {plan.funding.length} different systems. They are
              separate from each other, and none of them covers everything.
            </p>
            <ul className="mt-5 divide-y divide-hairline border-y border-hairline">
              {plan.funding.map((item) => (
                <li key={item.source.id} className="py-4">
                  <p className="text-[1rem] leading-[1.4]">{item.source.plainName}</p>
                  <p className="mt-1 text-[0.8125rem] text-moss">
                    For: {item.forOptions.join(' · ')}
                  </p>
                  <p className="mt-2 text-[0.9375rem] text-ink-soft">
                    Does not pay for: {item.source.doesNotPay[0]?.toLowerCase()}.
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[0.9375rem]">
              <Link href="/funding" className="text-eucalypt underline">
                Read what each system does and does not cover
              </Link>
            </p>
          </section>
        )}

        {plan.organisations.length > 0 && (
          <section aria-labelledby="plan-help" className="measure mt-14">
            <h2
              id="plan-help"
              className="font-display text-[1.625rem] leading-[1.2] font-medium"
            >
              Who can help
            </h2>
            <p className="mt-3 text-[0.9375rem] text-ink-soft">
              The kinds of help worth approaching, given what you told us.
            </p>
            <ul className="mt-5 divide-y divide-hairline border-y border-hairline">
              {plan.organisations.map((organisation) => (
                <li key={organisation.id} className="py-4">
                  <p className="text-[1rem] leading-[1.4]">{organisation.plainName}</p>
                  <p className="mt-1 text-[0.9375rem] text-ink-soft">
                    {organisation.helpsWith[0]}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[0.9375rem]">
              <Link href="/organisations" className="text-eucalypt underline">
                Read what each one does and how to find them
              </Link>
            </p>
          </section>
        )}

        {plan.questionsToAsk.length > 0 && (
          <section aria-labelledby="plan-questions" className="measure mt-14">
            <h2
              id="plan-questions"
              className="font-display text-[1.625rem] leading-[1.2] font-medium"
            >
              Questions to ask
            </h2>
            <p className="mt-3 text-[0.9375rem] text-ink-soft">
              Worth taking to a planner, support coordinator or provider.
            </p>
            <ul className="mt-5 space-y-4">
              {plan.questionsToAsk.map((item) => (
                <li key={item.id}>
                  <p className="text-[1rem] leading-[1.45]">{item.text}</p>
                  <p className="mt-1 text-[0.8125rem] text-moss">
                    About: {item.neededFor.join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="space-y-12 border-t border-hairline pt-6 lg:sticky lg:top-10 lg:self-start lg:border-t-0 lg:pt-1">
        <ProgressReadout progress={progress} />
        <Thread
          entries={plan.situation}
          activeQuestionId={null}
          onRevisit={revisit}
          heading="Your situation"
        />
      </div>
    </div>
  )
}
