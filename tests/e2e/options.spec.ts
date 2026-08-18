import { expect, test, type Page } from '@playwright/test'
import { PERSONA_A, PERSONA_B, PERSONA_D } from '../fixtures/personas'

/**
 * The results screen.
 *
 * What matters here is not that results render, but that they render honestly:
 * plain English before NDIS terminology, a reason attached to everything shown,
 * uncertainty named rather than hidden, and no claim about eligibility anywhere.
 */

const STORAGE_KEY = 'ndis-housing.journey.v1'

/** Starts the browser with a completed journey already saved. */
async function withJourney(page: Page, answers: Record<string, string>) {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key as string, value as string)
    },
    [STORAGE_KEY, JSON.stringify({ state: { answers, activeQuestionId: null }, version: 0 })],
  )
}

async function openOptions(page: Page) {
  await page.goto('/options')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

/**
 * Opens a card's reasoning. The disclosure is a native details/summary, so the
 * summary is the control — the surrounding group carries no accessible name.
 */
async function openReasoning(card: ReturnType<Page['getByRole']>) {
  await card.getByText('Why am I seeing this?').click()
}

test('leads with the strongest matches, named in plain English', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await openOptions(page)

  const strong = page.getByRole('region', { name: 'Strong match' })
  await expect(strong).toBeVisible()
  await expect(
    strong.getByRole('heading', { name: 'Build a living arrangement around the person' }),
  ).toBeVisible()
})

test('introduces the formal term only after the plain-English name', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await openOptions(page)

  const card = page.getByRole('article', { name: 'Build a living arrangement around the person' })
  await expect(card).toContainText('Individualised Living Options (ILO)')

  const text = (await card.textContent()) ?? ''
  expect(text.indexOf('Build a living arrangement')).toBeLessThan(
    text.indexOf('Individualised Living Options'),
  )
})

test('answers "why am I seeing this?" with the answers the person gave', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await openOptions(page)

  const card = page.getByRole('article', { name: 'Build a living arrangement around the person' })
  await openReasoning(card)
  await expect(card).toContainText('You want your own place.')
})

test('speaks about the person in the third person for a parent', async ({ page }) => {
  await withJourney(page, PERSONA_B)
  await openOptions(page)

  const card = page.getByRole('article', {
    name: 'Live in a shared home where support is always on hand',
  })
  await openReasoning(card)
  await expect(card).toContainText('They need help overnight.')
})

test('keeps a less relevant option reachable, and explains why it is less relevant', async ({
  page,
}) => {
  await withJourney(page, PERSONA_B)
  await openOptions(page)

  const lessRelevant = page.getByRole('region', {
    name: 'Appears less relevant based on your answers',
  })
  const card = page.getByRole('article', { name: 'Build a living arrangement around the person' })

  // Present but collapsed: honest to include, wrong to lead with.
  await expect(card).toBeHidden()
  await lessRelevant.getByText(/Show these \d+ options/).click()
  await expect(card).toBeVisible()

  await openReasoning(card)
  await expect(card).toContainText('shared home')
})

test('names the questions still open instead of guessing', async ({ page }) => {
  await withJourney(page, PERSONA_D)
  await openOptions(page)

  await expect(page.getByRole('region', { name: 'More information needed' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Strong match' })).toBeHidden()

  const card = page.getByRole('article', {
    name: 'Live in a home built for high physical support needs',
  })
  await openReasoning(card)
  await expect(card).toContainText('Does the home itself need to be different?')
})

test('does not lead with what appears less relevant', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await openOptions(page)

  const headings = await page.getByRole('heading', { level: 2 }).allTextContents()
  const strongAt = headings.findIndex((text) => text.includes('Strong match'))
  const lowerAt = headings.findIndex((text) => text.includes('less relevant'))
  expect(strongAt).toBeGreaterThanOrEqual(0)
  expect(lowerAt).toBeGreaterThan(strongAt)
})

test('never tells anyone they qualify', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await openOptions(page)

  const body = ((await page.getByRole('main').textContent()) ?? '').toLowerCase()
  for (const phrase of ['you qualify', 'they qualify', 'eligible', 'you will receive']) {
    expect(body, phrase).not.toContain(phrase)
  }
  expect(body).toContain('the ndis')
})

test('shows where the information came from, and that nobody has checked it', async ({
  page,
}) => {
  await withJourney(page, PERSONA_A)
  await openOptions(page)

  const card = page.getByRole('article', { name: 'Build a living arrangement around the person' })
  await expect(card.getByRole('link', { name: /NDIS/ }).first()).toBeVisible()
  await expect(card).toContainText('not been checked')
})

test('an unfinished journey is invited to finish rather than shown empty results', async ({
  page,
}) => {
  await withJourney(page, { perspective: 'self', 'current-living': 'own_rental' })
  await openOptions(page)

  await expect(page.getByRole('region', { name: 'Strong match' })).toBeHidden()
  await page.getByRole('link', { name: /Continue the questions/ }).click()
  await expect(page).toHaveURL(/\/start$/)
})

test('the finished journey leads on to the options', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await page.goto('/start')

  await page.getByRole('link', { name: /See the options/ }).click()
  await expect(page).toHaveURL(/\/options$/)
  await expect(page.getByRole('region', { name: 'Strong match' })).toBeVisible()
})
