import type { Metadata } from 'next'
import { Options } from '@/components/pathway/Options'
import { SiteHeader } from '@/components/SiteHeader'

export const metadata: Metadata = { title: 'Your options' }

export default function OptionsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-[var(--gutter)] py-14 lg:py-20">
        <Options />
      </main>
    </>
  )
}
