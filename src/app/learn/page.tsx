import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'

export const metadata: Metadata = { title: 'Browse the options' }

/**
 * The secondary route, for someone who already knows what they are looking for.
 *
 * The pathway library it will hold is not written yet. Rather than show an empty
 * shell, this screen says plainly what is here and offers the route that works.
 */
export default function LearnPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-[var(--gutter)] py-16 lg:py-24">
        <h1 className="measure font-display text-[clamp(2rem,1.4rem+2.4vw,3rem)] font-medium">
          Browsing the options directly isn&rsquo;t open yet
        </h1>
        <p className="measure mt-6 text-lede text-ink-soft">
          Plain-English guides to each housing and support option are being written.
          Until they are here, the guided questions are the way through — they take a
          few minutes and you can skip anything you are unsure about.
        </p>
        <Link
          href="/start"
          className="mt-9 inline-block min-h-12 rounded-sm bg-eucalypt px-8 py-4 text-[1.0625rem] font-bold text-paper no-underline hover:bg-eucalypt-deep"
        >
          Help me work out the options
        </Link>
      </main>
    </>
  )
}
