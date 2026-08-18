import { expect, test } from '@playwright/test'

/**
 * The header at the widths people actually hold.
 *
 * The wordmark has been crushed to three stacked lines once already, after a
 * destination was added without re-checking a phone. These read the rendered
 * geometry rather than the class names, so the check survives a rewrite of the
 * layout and still catches the same failure.
 */

const PHONE = { width: 390, height: 844 }
const SMALL_PHONE = { width: 320, height: 720 }
const TABLET = { width: 768, height: 1024 }
const DESKTOP = { width: 1280, height: 900 }

/** Two lines of the wordmark would be about 48px. One is about 26px. */
const ONE_LINE = 34

test.describe('the header', () => {
  for (const [name, size] of [
    ['a small phone', SMALL_PHONE],
    ['a phone', PHONE],
    ['a tablet', TABLET],
    ['a desktop', DESKTOP],
  ] as const) {
    test(`keeps the wordmark on one line and every destination reachable on ${name}`, async ({
      page,
    }) => {
      await page.setViewportSize(size)
      await page.goto('/start')

      const wordmark = page.getByRole('link', { name: 'Home and living' })
      const box = await wordmark.boundingBox()
      expect(box?.height).toBeLessThan(ONE_LINE)

      const nav = page.getByRole('navigation', { name: 'Sections' })
      await expect(nav.getByRole('link')).toHaveCount(6)
      for (const link of await nav.getByRole('link').all()) {
        await expect(link).toBeVisible()
      }

      // Nothing in the header pushes the page sideways.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }

  test('holds together when the reader has enlarged their text', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await page.goto('/start')
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '24px'
    })

    const wordmark = page.getByRole('link', { name: 'Home and living' })
    const box = await wordmark.boundingBox()
    // One line, now at one and a half times the size.
    expect(box?.height).toBeLessThan(ONE_LINE * 1.5)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
