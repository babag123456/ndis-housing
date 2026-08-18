'use client'

import { FUNDING_SOURCES_CONTENT } from '@content/funding'
import { FundingSourceCard } from './FundingSourceCard'
import { useHousingPlan } from '@/lib/plan'

/**
 * The funding screen.
 *
 * Readable without having answered anything, because someone may arrive here
 * first. Once a journey exists, the sources their options draw on are marked and
 * shown first — the same content, ordered by what matters to them.
 */
export function Funding() {
  const { plan, ready, isComplete } = useHousingPlan()

  const relevanceById = new Map(
    ready && isComplete ? plan.funding.map((item) => [item.source.id, item.forOptions]) : [],
  )
  const ordered = [...FUNDING_SOURCES_CONTENT].sort((left, right) => {
    const leftRelevant = relevanceById.has(left.id) ? 0 : 1
    const rightRelevant = relevanceById.has(right.id) ? 0 : 1
    return leftRelevant - rightRelevant
  })

  return (
    <div className="rise">
      <p className="eyebrow mb-6">Funding</p>
      <h1 className="measure font-display text-[clamp(1.75rem,1.1rem+2.4vw,2.625rem)] font-medium">
        Who pays for what
      </h1>
      <p className="measure mt-5 text-lede text-ink-soft">
        Several different systems pay for different parts of a home and the support
        in it. The most useful thing to know about each one is what it does
        <em> not</em> cover.
      </p>
      {relevanceById.size > 0 && (
        <p className="measure mt-5 text-[0.9375rem] text-ink-soft">
          The {relevanceById.size} sources your options draw on are listed first.
        </p>
      )}

      <div className="mt-14">
        {ordered.map((source) => (
          <FundingSourceCard
            key={source.id}
            source={source}
            relevance={relevanceById.get(source.id)}
          />
        ))}
      </div>

      <p className="measure mt-12 border-t border-hairline pt-8 text-[0.9375rem] text-moss">
        Nothing here says what any person will receive. Amounts and rules change,
        and each system decides its own.
      </p>
    </div>
  )
}
