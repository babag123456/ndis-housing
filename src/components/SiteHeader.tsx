import Link from 'next/link'
import { SiteNav } from './SiteNav'

export function SiteHeader() {
  return (
    <header className="border-b border-hairline">
      {/* Stacked on a narrow screen: six destinations and a wordmark cannot
          share one line, and squeezing the wordmark crushed it to three. */}
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-[var(--gutter)] py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-3 text-ink no-underline"
        >
          {/* The thread mark: the same line that records answers in the navigator. */}
          <span aria-hidden="true" className="flex h-5 w-2.5 flex-col justify-between">
            <span className="h-[3px] w-full bg-eucalypt" />
            <span className="h-[3px] w-full bg-eucalypt/60" />
            <span className="h-[3px] w-full bg-eucalypt/30" />
          </span>
          <span className="font-display text-[1.0625rem] font-medium tracking-[-0.01em] whitespace-nowrap">
            Home and living
          </span>
        </Link>
        <SiteNav />
      </div>
    </header>
  )
}
