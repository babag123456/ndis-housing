import type { Metadata, Viewport } from 'next'
import { Atkinson_Hyperlegible, Literata } from 'next/font/google'
import './globals.css'

/*
 * Atkinson Hyperlegible was designed by the Braille Institute to be legible for
 * readers with low vision, which makes it the right interface face for a product
 * whose whole purpose is making a hard system readable. Literata is a reading
 * serif built for long-form legibility on screen, so questions can be set large
 * and still feel like something a person asked rather than a form field.
 */
const sans = Atkinson_Hyperlegible({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-atkinson',
})

const display = Literata({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-literata',
})

export const metadata: Metadata = {
  title: {
    default: 'Home and living navigator',
    template: '%s — Home and living navigator',
  },
  description:
    'Work out which housing and support options may suit you, what may be funded, and what to do next.',
}

export const viewport: Viewport = {
  // Pinching to zoom must keep working.
  initialScale: 1,
  width: 'device-width',
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:rounded focus-visible:bg-eucalypt focus-visible:px-4 focus-visible:py-3 focus-visible:text-paper"
        >
          Skip to the main content
        </a>
        {children}
      </body>
    </html>
  )
}
