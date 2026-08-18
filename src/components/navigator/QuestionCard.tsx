'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { resolveCopy, type Voice } from '@/lib/copy/perspective'
import type { Question } from '@/lib/navigator/question-schema'

/**
 * One question, one screen, one primary action.
 *
 * Native radio inputs inside a fieldset, because that is what screen readers,
 * voice control and browser autofill already understand. Nothing auto-advances:
 * a person using a screen reader has to be able to hear every option before
 * committing, so choosing and continuing are separate steps.
 */
export function QuestionCard({
  question,
  voice,
  selected,
  position,
  estimatedTotal,
  canGoBack,
  moveFocus,
  onAnswer,
  onBack,
}: {
  question: Question
  voice: Voice | null
  selected: string | undefined
  position: number
  estimatedTotal: number
  canGoBack: boolean
  /** True once the person has acted, so focus should follow them here. */
  moveFocus: boolean
  onAnswer: (value: string) => void
  onBack: () => void
}) {
  const [choice, setChoice] = useState<string | undefined>(selected)
  const [error, setError] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstOptionRef = useRef<HTMLInputElement>(null)
  const errorId = useId()
  const helpId = useId()

  // Each question is a fresh instance of this component, keyed on its id, so the
  // pending choice above starts from whatever is stored for this question and
  // needs no resetting. All that is left is focus: after the person answers or
  // goes back, move focus to the new question so the change is announced rather
  // than swapping silently under the reader. On first load focus is left alone.
  useEffect(() => {
    if (moveFocus) headingRef.current?.focus()
  }, [moveFocus])

  const help = question.help ? resolveCopy(question.help, voice) : null

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (choice === undefined) {
      setError('Choose one of the options to continue. You can pick "I\'m not sure".')
      firstOptionRef.current?.focus()
      return
    }
    onAnswer(choice)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rise">
      <p className="eyebrow mb-6">
        Question {position} of about {estimatedTotal}
      </p>

      <fieldset
        className="border-0 p-0"
        aria-describedby={cn(help && helpId, error && errorId) || undefined}
      >
        <legend className="mb-4 p-0">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="measure font-display text-[clamp(1.75rem,1.1rem+2.4vw,2.625rem)] font-medium outline-offset-8"
          >
            {resolveCopy(question.question, voice)}
          </h1>
        </legend>

        {help && (
          <p id={helpId} className="measure mb-6 text-lede text-ink-soft">
            {help}
          </p>
        )}

        <details className="measure mb-8 border-t border-hairline pt-3">
          <summary className="cursor-pointer text-[0.9375rem] text-eucalypt underline">
            Why we ask this
          </summary>
          <p className="mt-2 text-[0.9375rem] text-ink-soft">{question.purpose}</p>
        </details>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="measure mb-6 border-l-4 border-plum bg-paper-raised px-4 py-3 text-[0.9375rem] text-ink"
          >
            {error}
          </p>
        )}

        <div className="measure divide-y divide-hairline border-y border-hairline">
          {question.options.map((option, index) => {
            const id = `${question.id}-${option.value}`
            const isChosen = choice === option.value
            return (
              <label
                key={option.value}
                htmlFor={id}
                className={cn(
                  'flex cursor-pointer items-start gap-4 px-1 py-4 transition-colors',
                  'hover:bg-paper-raised has-[:focus-visible]:bg-paper-raised',
                  isChosen && 'bg-paper-raised',
                )}
              >
                <input
                  ref={index === 0 ? firstOptionRef : undefined}
                  type="radio"
                  id={id}
                  name={question.id}
                  value={option.value}
                  checked={isChosen}
                  onChange={() => {
                    setChoice(option.value)
                    setError(null)
                  }}
                  className="mt-[0.3rem] h-[1.15rem] w-[1.15rem] shrink-0 accent-[var(--color-eucalypt)]"
                />
                <span className="min-h-6">
                  <span
                    className={cn(
                      'block text-[1.0625rem] leading-[1.45]',
                      isChosen ? 'font-bold text-ink' : 'text-ink',
                    )}
                  >
                    {resolveCopy(option.label, voice)}
                  </span>
                  {option.hint && (
                    <span className="mt-1 block text-[0.9375rem] text-moss">
                      {resolveCopy(option.hint, voice)}
                    </span>
                  )}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="measure mt-9 flex flex-wrap items-center gap-6">
        <button
          type="submit"
          className="min-h-12 cursor-pointer rounded-sm bg-eucalypt px-7 py-3 text-[1.0625rem] font-bold text-paper hover:bg-eucalypt-deep"
        >
          Continue
        </button>
        {canGoBack && (
          <button
            type="button"
            onClick={onBack}
            className="min-h-12 cursor-pointer border-0 bg-transparent text-[1rem] text-eucalypt underline"
          >
            Go back
          </button>
        )}
      </div>
    </form>
  )
}
