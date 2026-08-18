import type { ReactNode } from 'react'

/**
 * Simple, then more, then the formal detail.
 *
 * One component for the three levels wherever they appear, so a person learns the
 * pattern once: the plain version is always on screen, and nothing makes them
 * read the formal wording to get the point. Two sibling disclosures rather than
 * nested ones, because a disclosure inside a disclosure is a maze.
 */
export function Explainer({
  description,
  moreLabel = 'Tell me more',
  detailLabel = 'In more detail',
  children,
}: {
  description: { simple: string; tellMeMore: string; detail: string }
  moreLabel?: string
  detailLabel?: string
  /** Anything to show between the plain version and the disclosures. */
  children?: ReactNode
}) {
  return (
    <div>
      <p className="text-ink-soft">{description.simple}</p>
      {children}
      <details className="mt-4 border-t border-hairline pt-3">
        <summary className="cursor-pointer text-[0.9375rem] text-eucalypt underline">
          {moreLabel}
        </summary>
        <p className="mt-3 text-[0.9375rem] leading-[1.6] text-ink-soft">
          {description.tellMeMore}
        </p>
      </details>
      <details className="mt-3 border-t border-hairline pt-3">
        <summary className="cursor-pointer text-[0.9375rem] text-eucalypt underline">
          {detailLabel}
        </summary>
        <p className="mt-3 text-[0.9375rem] leading-[1.6] text-ink-soft">
          {description.detail}
        </p>
      </details>
    </div>
  )
}
