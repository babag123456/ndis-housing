import type { Metadata } from 'next'
import { Navigator } from '@/components/navigator/Navigator'
import { SiteHeader } from '@/components/SiteHeader'

export const metadata: Metadata = { title: 'Your situation' }

export default function StartPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-[var(--gutter)] py-14 lg:py-20">
        <Navigator />
      </main>
    </>
  )
}
