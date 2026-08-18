import type { Metadata } from 'next'
import { Organisations } from '@/components/funding/Organisations'
import { SiteHeader } from '@/components/SiteHeader'

export const metadata: Metadata = { title: 'Who can help' }

export default function OrganisationsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-[var(--gutter)] py-14 lg:py-20">
        <Organisations />
      </main>
    </>
  )
}
