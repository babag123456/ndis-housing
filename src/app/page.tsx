import Link from 'next/link'
import { MarkedList } from '@/components/MarkedList'
import { SiteHeader } from '@/components/SiteHeader'

/**
 * The landing page.
 *
 * The hero is the promise plus an honest preview of what will be asked. Showing
 * the shape of the journey up front is the whole point: the reason people put
 * this off is that they cannot see how big it is.
 */
const WHAT_WE_ASK = [
  'Who you are exploring for',
  'Where the person lives now, and what they would like to change',
  'How they would like to live',
  'How much help is needed through the day, and overnight',
  'Whether the home itself needs to be different',
  'Timing, and what is in the NDIS plan now',
]

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-[var(--gutter)]">
        <div className="grid gap-16 py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-24 lg:py-28">
          <div>
            <h1 className="font-display text-[clamp(2.5rem,1.6rem+3.6vw,4.25rem)] leading-[1.05] font-medium">
              Find the right way to live.
            </h1>
            <p className="measure mt-8 text-[clamp(1.125rem,1rem+0.4vw,1.375rem)] leading-[1.55] text-ink-soft">
              Housing and support through the NDIS can be complicated. Answer a few
              questions and we&rsquo;ll help you understand the options that may be
              relevant, and what to do next.
            </p>

            <div className="mt-11 flex flex-wrap items-center gap-x-8 gap-y-5">
              <Link
                href="/start"
                className="min-h-12 rounded-sm bg-eucalypt px-8 py-4 text-[1.0625rem] font-bold text-paper no-underline hover:bg-eucalypt-deep"
              >
                Help me work out the options
              </Link>
              <Link href="/learn" className="min-h-12 text-[1.0625rem] text-eucalypt underline">
                I already know what I&rsquo;m looking for
              </Link>
            </div>

            <p className="measure mt-10 text-[0.9375rem] text-moss">
              Nothing you enter is sent anywhere. Your answers stay in this browser,
              and you can stop and come back.
            </p>
          </div>

          {/*
            The same thread that records answers in the navigator, used here to
            preview the questions ahead. It is a list, not decoration, so it
            reads correctly to a screen reader.
          */}
          <aside aria-labelledby="preview-heading" className="lg:pt-4">
            <h2 id="preview-heading" className="eyebrow mb-6">
              What we&rsquo;ll ask
            </h2>
            <MarkedList
              items={WHAT_WE_ASK.map((item) => ({
                key: item,
                node: 'muted' as const,
                content: <span className="text-[1rem] leading-[1.5]">{item}</span>,
              }))}
            />
            <p className="mt-7 border-t border-hairline pt-5 text-[0.9375rem] text-moss">
              About ten short questions, one at a time. You can answer &ldquo;I&rsquo;m
              not sure&rdquo; to any of them.
            </p>
          </aside>
        </div>

        <div className="border-t border-hairline py-14">
          <p className="measure text-[0.9375rem] text-moss">
            This guide helps you understand what may be possible and what to ask. It
            does not decide whether anything will be funded — the NDIS makes that
            decision.
          </p>
        </div>
      </main>
    </>
  )
}
