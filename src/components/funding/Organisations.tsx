'use client'

import { ORGANISATIONS } from '@content/organisations'
import { OrganisationCard } from './OrganisationCard'
import { useHousingPlan } from '@/lib/plan'

/**
 * The organisations screen.
 *
 * When a journey is finished this shows the kinds of help that suit the person's
 * situation, with the rest available but out of the way. Handing everyone the full
 * list is how a directory becomes useless.
 */
export function Organisations() {
  const { plan, ready, isComplete } = useHousingPlan()
  const personalised = ready && isComplete

  const relevantIds = new Set(
    personalised ? plan.organisations.map((organisation) => organisation.id) : [],
  )
  const relevant = personalised ? plan.organisations : ORGANISATIONS
  const others = personalised
    ? ORGANISATIONS.filter((organisation) => !relevantIds.has(organisation.id))
    : []

  return (
    <div className="rise">
      <p className="eyebrow mb-6">Who can help</p>
      <h1 className="measure font-display text-[clamp(1.75rem,1.1rem+2.4vw,2.625rem)] font-medium">
        The people worth having on side
      </h1>
      <p className="measure mt-5 text-lede text-ink-soft">
        {personalised
          ? 'These are the kinds of help that fit what you told us. Each one says what it is good for and how to find one.'
          : 'These are the kinds of help involved in a housing change. Each one says what it is good for and how to find one.'}
      </p>
      <p className="measure mt-5 text-[0.9375rem] text-moss">
        These are roles rather than named services. A directory of real
        organisations needs checked, current, state-by-state information, and we
        would rather describe the role than send you to a number that may not
        answer.
      </p>

      <div className="mt-14">
        {relevant.map((organisation) => (
          <OrganisationCard key={organisation.id} organisation={organisation} />
        ))}
      </div>

      {others.length > 0 && (
        <details className="measure mt-12 border-t border-hairline pt-3">
          <summary className="cursor-pointer text-[0.9375rem] text-eucalypt underline">
            Other kinds of help ({others.length})
          </summary>
          <div className="mt-8">
            {others.map((organisation) => (
              <OrganisationCard key={organisation.id} organisation={organisation} />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
