import { Sources } from '@/components/content/Sources'
import { COMPLIANCE_ACTIONS, PROVIDER_REGISTER } from '@content/sources/official'
import { providersForRole } from '@content/providers'

/**
 * Named organisations that say they do this job.
 *
 * Examples, not recommendations, and not a directory — which is why every entry
 * is the organisation's own description, carries questions to ask it, and says
 * when its page was last read.
 *
 * Nothing here states whether an organisation is currently NDIS-registered. That
 * is live information published in a searchable register, so the list points at
 * the register instead. Restating it is how this page got Mable wrong.
 */

export function ProviderList({ roleId }: { roleId: string }) {
  const providers = providersForRole(roleId)
  if (providers.length === 0) return null

  return (
    <details className="mt-6 border-t border-hairline pt-3">
      <summary className="cursor-pointer text-[0.9375rem] text-eucalypt underline">
        Examples of this kind of service ({providers.length})
      </summary>

      <p className="mt-4 text-[0.8125rem] leading-[1.5] text-moss">
        These are examples to show what this kind of service looks like. They are
        not recommendations, and they are not a full list — plenty of others do the
        same job. Everything below is what each organisation says about itself.
      </p>

      <ul className="mt-6 space-y-8">
        {providers.map((provider) => (
          <li key={provider.id} className="border-t border-hairline pt-5">
            <h5 className="font-display text-[1.125rem] leading-[1.3] font-medium">
              <a
                href={provider.url}
                className="text-ink underline decoration-hairline-strong hover:decoration-eucalypt"
                rel="noopener noreferrer"
                target="_blank"
              >
                {provider.name}
              </a>
            </h5>
            <p className="mt-2 text-[0.9375rem] leading-[1.55] text-ink-soft">
              {provider.describesItselfAs}
            </p>

            <p className="mt-3 text-[0.8125rem] text-moss">{provider.coverage}</p>

            <section className="mt-4">
              <h6 className="eyebrow mb-2">Worth knowing</h6>
              <ul className="space-y-2 text-[0.9375rem] leading-[1.5] text-ink-soft">
                {provider.worthKnowing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mt-4">
              <h6 className="eyebrow mb-2">Questions to ask them</h6>
              <ul className="space-y-2 text-[0.9375rem] leading-[1.5] text-ink-soft">
                {provider.questionsToAsk.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <div className="mt-4">
              <Sources sources={provider.sources} />
            </div>
          </li>
        ))}
      </ul>

      <section className="mt-8 border-t border-hairline pt-5">
        <h6 className="eyebrow mb-2">Check these two things yourself</h6>
        <ul className="space-y-2 text-[0.9375rem] leading-[1.5] text-ink-soft">
          <li>
            Whether an organisation is currently NDIS-registered, on the{' '}
            <a
              href={PROVIDER_REGISTER.sourceUrl}
              className="text-eucalypt underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              Commission&rsquo;s register
            </a>
            . Registration changes, and whether it matters depends on how the plan is
            managed.
          </li>
          <li>
            Whether any action has been taken against them, in the Commission&rsquo;s{' '}
            <a
              href={COMPLIANCE_ACTIONS.sourceUrl}
              className="text-eucalypt underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              compliance and enforcement decisions
            </a>
            , which lists banning orders and suspended registrations.
          </li>
        </ul>
      </section>
    </details>
  )
}
