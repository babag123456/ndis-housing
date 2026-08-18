import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * The thread visual.
 *
 * A continuous vertical rule with a node per item. It carries the same meaning
 * everywhere it appears: this is a record of what the person told us. The rule
 * and nodes are decoration, so they are hidden from assistive technology and the
 * list markup does the structural work.
 */
export type MarkedItem = {
  key: string
  /** Solid for a recorded answer, active for the one in focus, muted for a preview. */
  node?: 'solid' | 'active' | 'muted'
  content: ReactNode
}

const NODE_COLOURS = {
  solid: 'bg-eucalypt',
  active: 'bg-plum',
  muted: 'bg-hairline-strong',
} as const

export function MarkedList({
  items,
  as = 'ol',
  className,
}: {
  items: readonly MarkedItem[]
  as?: 'ol' | 'ul'
  className?: string
}) {
  const List = as
  return (
    <List className={className}>
      {items.map((item) => (
        <li key={item.key} className="relative py-2.5 pl-6">
          <span
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-[3px] w-px bg-hairline-strong"
          />
          <span
            aria-hidden="true"
            className={cn(
              'absolute top-[0.95rem] left-0 h-[7px] w-[7px]',
              NODE_COLOURS[item.node ?? 'solid'],
            )}
          />
          {item.content}
        </li>
      ))}
    </List>
  )
}
