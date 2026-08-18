import type { Metadata } from 'next'
import { MyPlan } from '@/components/plan/MyPlan'
import { SiteHeader } from '@/components/SiteHeader'

export const metadata: Metadata = { title: 'Your plan' }

export default function MyPlanPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-[var(--gutter)] py-14 lg:py-20">
        <MyPlan />
      </main>
    </>
  )
}
