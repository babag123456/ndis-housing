'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

/**
 * Navigation named after what a person is trying to do, not after NDIS
 * categories. Formal terminology stays inside the results, where it can be
 * explained.
 */
const DESTINATIONS = [
  { href: '/start', label: 'Your situation' },
  { href: '/options', label: 'Your options' },
  { href: '/path', label: 'Your pathway' },
  { href: '/my-plan', label: 'Your plan' },
  { href: '/funding', label: 'Funding' },
  { href: '/organisations', label: 'Who can help' },
] as const

export function SiteNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Sections">
      <ul className="flex flex-wrap gap-x-6 gap-y-1">
        {DESTINATIONS.map((destination) => {
          const isCurrent = pathname === destination.href
          return (
            <li key={destination.href}>
              <Link
                href={destination.href}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'inline-block py-1 text-[0.9375rem]',
                  isCurrent
                    ? 'font-bold text-ink underline decoration-eucalypt decoration-2 underline-offset-[0.4em]'
                    : 'text-moss hover:text-eucalypt hover:underline',
                )}
              >
                {destination.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
