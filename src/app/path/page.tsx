import type { Metadata } from 'next'
import { Path } from '@/components/plan/Path'
import { SiteHeader } from '@/components/SiteHeader'

export const metadata: Metadata = { title: 'Your pathway' }

export default function PathPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-[var(--gutter)] py-14 lg:py-20">
        <Path />
      </main>
    </>
  )
}
