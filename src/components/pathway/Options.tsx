'use client'

import { useRouter } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { MatchStateHeadingCopy } from './MatchStateHeadingCopy'
import { PathwayCard } from './PathwayCard'
import { PathwayComparison } from './PathwayComparison'
import { Thread } from '@/components/navigator/Thread'
import { UnfinishedJourney } from '@/components/plan/UnfinishedJourney'
import { explainPathways } from '@/lib/decision-engine'
import { useFlow, useNavigatorStore } from '@/lib/navigator/store'

/**
 * The results screen.
 *
 * Everything shown here comes from the decision engine, which the person's
 * answers drive on their own. This component decides nothing; it groups and
 * renders. Results only appear once the journey is finished — a page of "more
 * information needed" is not a result, it is an unanswered questionnaire.
 */
export function Options() {
  const router = useRouter()
  const goTo = useNavigatorStore((state) => state.goTo)
  const { profile, voice, current, visible, answeredCount, thread } = useFlow()

  const ready = useSyncExternalStore(
    (onChange) => useNavigatorStore.persist.onFinishHydration(onChange),
    () => useNavigatorStore.persist.hasHydrated(),
    () => false,
  )

  function revisit(questionId: string) {
    goTo(questionId)
    router.push('/start')
  }

  if (!ready) {
    return (
      <p className="text-moss" role="status">
        Working out your options…
      </p>
    )
  }

  if (current !== null) {
    return (
      <UnfinishedJourney
        what="options"
        answeredCount={answeredCount}
        questionsRemaining={visible.length - answeredCount}
      />
    )
  }

  const groups = explainPathways(profile, voice)
  const person = voice?.isSelf ? 'you' : 'them'
  const comparable = groups
    .filter((group) => group.state === 'strong_match' || group.state === 'worth_exploring')
    .flatMap((group) => group.pathways)

  return (
    <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-20">
      <div className="rise">
        <p className="eyebrow mb-6">Your options</p>
        <h1 className="measure font-display text-[clamp(1.75rem,1.1rem+2.4vw,2.625rem)] font-medium">
          What may be worth exploring
        </h1>
        <p className="measure mt-5 text-lede text-ink-soft">
          These are the housing and support options that appear closest to what you
          told us. Each one explains why it is here. The NDIS makes the formal
          decision about what it will fund.
        </p>
        <p className="measure mt-4 text-[0.9375rem]">
          <Link href="/path" className="text-eucalypt underline">
            See the steps for these options
          </Link>
        </p>

        {comparable.length >= 2 && (
          <section aria-labelledby="compare" className="mt-12">
            <details>
              <summary
                id="compare"
                className="measure cursor-pointer border-t border-hairline pt-3 text-[0.9375rem] text-eucalypt underline"
              >
                Compare these options side by side
              </summary>
              <div className="mt-6">
                <PathwayComparison options={comparable} />
              </div>
            </details>
          </section>
        )}

        <div className="mt-14 space-y-16">
          {groups.map((group) => {
            const copy = MatchStateHeadingCopy[group.state]
            const regionId = `group-${group.state}`
            const isLowerRelevance = group.state === 'lower_relevance'

            return (
              <section key={group.state} aria-labelledby={regionId}>
                <h2
                  id={regionId}
                  className="measure font-display text-[1.625rem] leading-[1.2] font-medium"
                >
                  {copy.heading}
                </h2>
                <p className="measure mt-3 text-[0.9375rem] text-ink-soft">
                  {copy.explanation}
                </p>

                {isLowerRelevance ? (
                  // Collapsed by default: honest to include, wrong to lead with.
                  <details className="measure mt-6 border-t border-hairline pt-3">
                    <summary className="cursor-pointer text-[0.9375rem] text-eucalypt underline">
                      Show these {group.pathways.length} options
                    </summary>
                    <div className="mt-8 space-y-8">
                      {group.pathways.map((result) => (
                        <PathwayCard
                          key={result.pathway.id}
                          result={result}
                          onRevisitQuestion={revisit}
                        />
                      ))}
                    </div>
                  </details>
                ) : (
                  <div className="mt-9 space-y-8">
                    {group.pathways.map((result) => (
                      <PathwayCard
                        key={result.pathway.id}
                        result={result}
                        onRevisitQuestion={revisit}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
      </div>

      <div className="measure mt-16 border-t border-hairline pt-8">
          <h2 className="font-display text-[1.375rem] font-medium">What happens next</h2>
          <p className="mt-3 text-ink-soft">
            Your pathway turns these options into an order to work through, and your
            plan keeps track of what to gather and who to ask.
          </p>
          <Link
            href="/path"
            className="mt-7 inline-block min-h-12 rounded-sm bg-eucalypt px-8 py-4 text-[1.0625rem] font-bold text-paper no-underline hover:bg-eucalypt-deep"
          >
            See the steps for {person}
          </Link>
      </div>
      </div>

      <div className="border-t border-hairline pt-6 lg:sticky lg:top-10 lg:self-start lg:border-t-0 lg:pt-1">
        <Thread
          entries={thread}
          activeQuestionId={null}
          onRevisit={revisit}
          heading="What you've told us"
        />
      </div>
    </div>
  )
}
