import { Explainer } from '@/components/content/Explainer'
import { Sources } from '@/components/content/Sources'
import type { FundingSourceContent } from '@/lib/content/schema'

/**
 * One source of money.
 *
 * "Does not pay for" gets the same weight as "pays for". The gap between two
 * sources is where people lose months, so it is not tucked away.
 */
export function FundingSourceCard({
  source,
  relevance,
}: {
  source: FundingSourceContent
  /** Why this one is on the person's list, if it is. */
  relevance?: readonly string[]
}) {
  const headingId = `funding-${source.id}`

  return (
    <article
      aria-labelledby={headingId}
      className="measure border-t border-hairline py-8 first:border-t-0 first:pt-0"
    >
      <h3
        id={headingId}
        className="font-display text-[1.375rem] leading-[1.25] font-medium"
      >
        {source.plainName}
      </h3>
      {source.formalName && (
        <p className="mt-2 text-[0.9375rem] text-moss">{source.formalName}</p>
      )}

      <div className="mt-3">
        <Explainer description={source.description}>
          {relevance && relevance.length > 0 && (
            <p className="mt-4 border-l-4 border-plum bg-paper-raised px-4 py-3 text-[0.9375rem]">
              On your list because of: {relevance.join(' · ')}
            </p>
          )}

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <section>
              <h4 className="eyebrow mb-2">May pay for</h4>
              <ul className="space-y-2 text-[0.9375rem] leading-[1.5] text-ink-soft">
                {source.pays.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section>
              <h4 className="eyebrow mb-2">Does not pay for</h4>
              <ul className="space-y-2 text-[0.9375rem] leading-[1.5] text-ink-soft">
                {source.doesNotPay.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </Explainer>
      </div>

      <div className="mt-5">
        <Sources sources={source.sources} />
      </div>
    </article>
  )
}
