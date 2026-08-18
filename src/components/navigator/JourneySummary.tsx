'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Thread } from './Thread'
import type { ThreadEntry } from '@/lib/navigator/flow'
import type { Voice } from '@/lib/copy/perspective'

/**
 * The end of the opening journey.
 *
 * The person reads their own situation back before anything is suggested to
 * them, so a wrong answer can be corrected before it shapes the results.
 */
export function JourneySummary({
  entries,
  voice,
  uncertainCount,
  moveFocus,
  onRevisit,
  onStartAgain,
}: {
  entries: readonly ThreadEntry[]
  voice: Voice | null
  uncertainCount: number
  /** True once the person has acted, so focus should follow them here. */
  moveFocus: boolean
  onRevisit: (questionId: string) => void
  onStartAgain: () => void
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (moveFocus) headingRef.current?.focus()
  }, [moveFocus])

  const person = voice?.isSelf ? 'you' : 'them'

  return (
    <div className="rise">
      <p className="eyebrow mb-6">Your situation</p>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="measure font-display text-[clamp(1.75rem,1.1rem+2.4vw,2.625rem)] font-medium outline-offset-8"
      >
        Here&rsquo;s what you&rsquo;ve told us
      </h1>
      <p className="measure mt-5 text-lede text-ink-soft">
        Read it over. If anything is wrong, choose it and answer again — nothing
        else you have entered will be lost.
      </p>

      {uncertainCount > 0 && (
        <p className="measure mt-5 border-l-4 border-plum bg-paper-raised px-4 py-3 text-[0.9375rem]">
          You answered &ldquo;I&rsquo;m not sure&rdquo; to {uncertainCount}{' '}
          {uncertainCount === 1 ? 'question' : 'questions'}. That is fine, and it is
          worth knowing: the options we suggest will stay open where the answer
          could change things.
        </p>
      )}

      <div className="measure mt-10 border-t border-hairline pt-8">
        <Thread
          entries={entries}
          activeQuestionId={null}
          onRevisit={onRevisit}
          heading="Your answers"
        />
      </div>

      <div className="measure mt-10 border-t border-hairline pt-8">
        <h2 className="font-display text-[1.375rem] font-medium">What happens next</h2>
        <p className="mt-3 text-ink-soft">
          We&rsquo;ll show the housing and support options that appear closest to
          this, and explain why each one is there.
        </p>
        <Link
          href="/options"
          className="mt-7 inline-block min-h-12 rounded-sm bg-eucalypt px-8 py-4 text-[1.0625rem] font-bold text-paper no-underline hover:bg-eucalypt-deep"
        >
          See the options that may suit {person}
        </Link>
        <p className="mt-7">
          <button
            type="button"
            onClick={onStartAgain}
            className="min-h-12 cursor-pointer border-0 bg-transparent text-[1rem] text-eucalypt underline"
          >
            Start again
          </button>
        </p>
      </div>
    </div>
  )
}
