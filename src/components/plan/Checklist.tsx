'use client'

import { cn } from '@/lib/cn'
import type { PlanChecklistItem } from '@/lib/plan'

/**
 * A checklist of things to gather.
 *
 * Native checkboxes, one label each. Each item says which options it is for, so a
 * person can see why it is on their list and drop it if they drop the option.
 */
export function Checklist({
  items,
  completed,
  onToggle,
}: {
  items: readonly PlanChecklistItem[]
  completed: Readonly<Record<string, true>>
  onToggle: (id: string) => void
}) {
  return (
    <ul className="divide-y divide-hairline border-y border-hairline">
      {items.map((item) => {
        const isDone = completed[item.id] === true
        return (
          <li key={item.id}>
            <label
              className={cn(
                'flex cursor-pointer items-start gap-4 px-1 py-4',
                'hover:bg-paper-raised has-[:focus-visible]:bg-paper-raised',
              )}
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => onToggle(item.id)}
                className="mt-[0.3rem] h-[1.15rem] w-[1.15rem] shrink-0 accent-[var(--color-eucalypt)]"
              />
              <span>
                <span
                  className={cn(
                    'block text-[1rem] leading-[1.45]',
                    isDone && 'text-moss line-through',
                  )}
                >
                  {item.text}
                </span>
                <span className="mt-1 block text-[0.8125rem] text-moss">
                  For: {item.neededFor.join(' · ')}
                </span>
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
