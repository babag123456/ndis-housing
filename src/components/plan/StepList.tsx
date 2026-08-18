'use client'

import { cn } from '@/lib/cn'
import type { ExplainedStep } from '@/lib/roadmap'

/**
 * The pathway, as an ordered sequence.
 *
 * Numbered because the order carries real information here: the steps depend on
 * each other, and doing them out of order wastes months. Elsewhere in this
 * product numbering would be decoration; on a pathway it is the content.
 */
export function StepList({
  steps,
  completed,
  onToggle,
}: {
  steps: readonly ExplainedStep[]
  completed: Readonly<Record<string, true>>
  onToggle: (id: string) => void
}) {
  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const isDone = completed[step.id] === true
        const headingId = `step-${step.id}`

        return (
          <li
            key={step.id}
            className="relative border-t border-hairline py-8 pl-14 first:border-t-0 first:pt-0"
          >
            {/* The rule runs the length of the pathway; the number is the step. */}
            <span
              aria-hidden="true"
              className="absolute top-0 bottom-0 left-[1.1rem] w-px bg-hairline-strong"
            />
            <span
              aria-hidden="true"
              className={cn(
                'absolute top-8 left-0 flex h-9 w-9 items-center justify-center rounded-full font-sans text-[0.9375rem] font-bold first:top-0',
                isDone
                  ? 'bg-eucalypt text-paper'
                  : 'border border-hairline-strong bg-paper text-ink-soft',
              )}
              style={index === 0 ? { top: 0 } : undefined}
            >
              {index + 1}
            </span>

            <h3
              id={headingId}
              className={cn(
                'font-display text-[1.3125rem] leading-[1.25] font-medium',
                isDone && 'text-moss',
              )}
            >
              {step.title}
            </h3>
            <p className="mt-2 text-[0.9375rem] leading-[1.55] text-ink-soft">{step.why}</p>

            <label className="mt-4 inline-flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => onToggle(step.id)}
                className="h-[1.15rem] w-[1.15rem] accent-[var(--color-eucalypt)]"
              />
              <span className="text-[0.9375rem]">
                Done
                <span className="sr-only"> — {step.title}</span>
              </span>
            </label>

            <details className="mt-4 border-t border-hairline pt-3">
              <summary className="cursor-pointer text-[0.9375rem] text-eucalypt underline">
                What this involves
              </summary>
              <div className="mt-4 space-y-5">
                <section>
                  <h4 className="eyebrow mb-2">Understand</h4>
                  <ul className="space-y-2 text-[0.9375rem] leading-[1.55] text-ink-soft">
                    {step.understand.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h4 className="eyebrow mb-2">Prepare</h4>
                  <ul className="space-y-2 text-[0.9375rem] leading-[1.55] text-ink-soft">
                    {step.prepare.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h4 className="eyebrow mb-2">Do</h4>
                  <ul className="space-y-2 text-[0.9375rem] leading-[1.55]">
                    {step.doNow.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </details>
          </li>
        )
      })}
    </ol>
  )
}
