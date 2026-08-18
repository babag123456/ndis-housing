import { Explainer } from '@/components/content/Explainer'
import { Sources } from '@/components/content/Sources'
import type { Organisation } from '@/lib/content/schema'

/**
 * One kind of help.
 *
 * These are roles, not named services. Naming a service we have not verified
 * would send someone to a phone number that may not exist, so each entry says how
 * to find the right one instead.
 */
export function OrganisationCard({ organisation }: { organisation: Organisation }) {
  const headingId = `organisation-${organisation.id}`

  return (
    <article
      aria-labelledby={headingId}
      className="measure border-t border-hairline py-8 first:border-t-0 first:pt-0"
    >
      <h3
        id={headingId}
        className="font-display text-[1.375rem] leading-[1.25] font-medium"
      >
        {organisation.plainName}
      </h3>

      <div className="mt-3">
        <Explainer description={organisation.description}>
          <div className="mt-6 space-y-6">
            <section>
              <h4 className="eyebrow mb-2">Good for</h4>
              <ul className="space-y-2 text-[0.9375rem] leading-[1.5] text-ink-soft">
                {organisation.helpsWith.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section>
              <h4 className="eyebrow mb-2">Questions to ask them</h4>
              <ul className="space-y-2 text-[0.9375rem] leading-[1.5] text-ink-soft">
                {organisation.questionsToAsk.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </Explainer>
      </div>

      <div className="measure mt-6 border-l-4 border-eucalypt bg-paper-raised px-4 py-3">
        <h4 className="eyebrow mb-1">How to find one</h4>
        <p className="text-[0.9375rem] leading-[1.55]">{organisation.howToFind}</p>
      </div>

      <div className="mt-5">
        <Sources sources={organisation.sources} />
      </div>
    </article>
  )
}
