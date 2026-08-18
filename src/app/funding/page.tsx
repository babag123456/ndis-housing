import type { Metadata } from 'next'
import { Funding } from '@/components/funding/Funding'
import { SiteHeader } from '@/components/SiteHeader'

export const metadata: Metadata = { title: 'Who pays for what' }

export default function FundingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-[var(--gutter)] py-14 lg:py-20">
        <Funding />
      </main>
    </>
  )
}
