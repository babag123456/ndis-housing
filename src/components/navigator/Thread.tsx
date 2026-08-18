'use client'

import { cn } from '@/lib/cn'
import { MarkedList, type MarkedItem } from '@/components/MarkedList'
import type { ThreadEntry } from '@/lib/navigator/flow'

/**
 * The thread.
 *
 * Each answer is written back as a plain-English sentence, so the person can
 * always see the situation the navigator thinks it is working with. It replaces
 * a progress bar: progress is visible as accumulated understanding rather than
 * as a form filling up. Every entry is a way back to the question that made it.
 */
export function Thread({
  entries,
  activeQuestionId,
  onRevisit,
  heading,
}: {
  entries: readonly ThreadEntry[]
  activeQuestionId: string | null
  onRevisit: (questionId: string) => void
  heading: string
}) {
  if (entries.length === 0) return null

  const items: MarkedItem[] = entries.map((entry) => {
    const isActive = entry.questionId === activeQuestionId
    return {
      key: entry.questionId,
      node: isActive ? 'active' : 'solid',
      content: (
        <button
          type="button"
          onClick={() => onRevisit(entry.questionId)}
          className={cn(
            'block w-full cursor-pointer border-0 bg-transparent text-left',
            'text-[0.9375rem] leading-[1.5] text-ink-soft hover:text-eucalypt hover:underline',
            isActive && 'text-plum',
          )}
        >
          <span className="block text-[0.8125rem] text-moss">{entry.label}</span>
          {/* No "not sure" badge: an uncertain answer says so in the sentence
              itself, and a tag beside it only repeats the word. */}
          <span className="block">{entry.statement}</span>
          <span className="sr-only"> — change this answer</span>
        </button>
      ),
    }
  })

  return (
    <nav aria-labelledby="thread-heading">
      <h2 id="thread-heading" className="eyebrow mb-5 font-sans">
        {heading}
      </h2>
      <MarkedList items={items} />
    </nav>
  )
}
