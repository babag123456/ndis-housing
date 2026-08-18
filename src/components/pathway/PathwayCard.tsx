'use client'

import { MarkedList } from '@/components/MarkedList'
import { Sources } from '@/components/content/Sources'
import type { ExplainedPathway } from '@/lib/decision-engine'

/**
 * One option.
 *
 * The plain-English name is the heading, and the formal NDIS term appears below
 * it as an explanation of what that name means — never the other way round. The
 * two disclosures hold the reasoning and the practical detail, so the default
 * view stays scannable for someone reading ten of these at once.
 */
export function PathwayCard({
  result,
  onRevisitQuestion,
}: {
  result: ExplainedPathway
  onRevisitQuestion: (questionId: string) => void
}) {
  const { pathway, reasons, cautions, openQuestions } = result
  const headingId = `pathway-${pathway.id}`

  return (
    <article
      aria-labelledby={headingId}
      className="measure border-t border-hairline py-8 first:border-t-0 first:pt-0"
    >
      <h3
        id={headingId}
        className="measure font-display text-[1.375rem] leading-[1.25] font-medium"
      >
        {pathway.plainName}
      </h3>

      <p className="measure mt-3 text-ink-soft">{pathway.description.simple}</p>

      {pathway.formalName && (
        <p className="measure mt-3 text-[0.9375rem] text-moss">
          This may involve {pathway.formalName}
          {pathway.acronym ? ` (${pathway.acronym})` : ''}.
        </p>
      )}

      <details className="measure mt-5 border-t border-hairline pt-3">
        <summary className="cursor-pointer text-[0.9375rem] text-eucalypt underline">
          Why am I seeing this?
        </summary>

        <div className="mt-4 space-y-6">
          {reasons.length > 0 && (
            <section>
              <h4 className="eyebrow mb-2">What your answers suggest</h4>
              <MarkedList
                as="ul"
                items={reasons.map((reason) => ({
                  key: reason,
                  content: (
                    <span className="text-[0.9375rem] leading-[1.5] text-ink-soft">
                      {reason}
                    </span>
                  ),
                }))}
              />
            </section>
          )}

          {openQuestions.length > 0 && (
            <section>
              <h4 className="eyebrow mb-2">What is still uncertain</h4>
              <p className="mb-2 text-[0.9375rem] text-ink-soft">
                Answering these would tell us more about this option.
              </p>
              <ul className="space-y-2">
                {openQuestions.map((open) => (
                  <li key={open.questionId}>
                    <button
                      type="button"
                      onClick={() => onRevisitQuestion(open.questionId)}
                      className="cursor-pointer border-0 bg-transparent p-0 text-left text-[0.9375rem] text-eucalypt underline"
                    >
                      {open.question}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(cautions.length > 0 || pathway.mayNotFit.length > 0) && (
            <section>
              <h4 className="eyebrow mb-2">What may not fit</h4>
              <ul className="space-y-2 text-[0.9375rem] leading-[1.5] text-ink-soft">
                {[...cautions, ...pathway.mayNotFit].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </details>

      <details className="measure mt-3 border-t border-hairline pt-3">
        <summary className="cursor-pointer text-[0.9375rem] text-eucalypt underline">
          What this means and what to ask
        </summary>

        <div className="mt-4 space-y-6">
          <section>
            <h4 className="eyebrow mb-2">What this means</h4>
            <p className="text-[0.9375rem] leading-[1.6] text-ink-soft">
              {pathway.description.tellMeMore}
            </p>
            <p className="mt-3 text-[0.9375rem] leading-[1.6] text-ink-soft">
              {pathway.description.detail}
            </p>
          </section>

          <section>
            <h4 className="eyebrow mb-2">Questions to ask</h4>
            <ul className="space-y-2 text-[0.9375rem] leading-[1.5] text-ink-soft">
              {pathway.questionsToAsk.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="eyebrow mb-2">Information that may be needed</h4>
            <ul className="space-y-2 text-[0.9375rem] leading-[1.5] text-ink-soft">
              {pathway.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="eyebrow mb-2">Who may pay</h4>
            <ul className="space-y-2 text-[0.9375rem] leading-[1.5] text-ink-soft">
              {pathway.fundingNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>

        </div>
      </details>

      <div className="measure mt-6 border-l-4 border-eucalypt bg-paper-raised px-4 py-3">
        <h4 className="eyebrow mb-1">Next step</h4>
        <p className="text-[0.9375rem] leading-[1.55]">{pathway.nextStep}</p>
      </div>

      <div className="measure mt-5">
        <Sources sources={pathway.sources} />
      </div>
    </article>
  )
}
