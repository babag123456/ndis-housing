import { expect, test, type Page } from '@playwright/test'
import { PERSONA_A } from '../fixtures/personas'

/**
 * Comparison, funding, and who can help.
 *
 * The theme of these is restraint: the comparison must not become a wide matrix,
 * funding must say what it does not cover, and the organisations list must not
 * pretend to be a directory of real services.
 */

const JOURNEY_KEY = 'ndis-housing.journey.v1'

async function withJourney(page: Page, answers: Record<string, string>) {
  await page.goto('/')
  await page.evaluate(
    ([key, value]) => {
      window.localStorage.setItem(key, value)
    },
    [
      JOURNEY_KEY,
      JSON.stringify({ state: { answers, activeQuestionId: null }, version: 0 }),
    ] as const,
  )
}

test('comparison is offered, not imposed', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await page.goto('/options')

  // Not shown until asked for: a wide table is the wrong thing to open with.
  await expect(page.getByRole('table')).toBeHidden()

  await page.getByText('Compare these options side by side').click()
  await expect(page.getByRole('table')).toBeVisible()
})

test('the comparison asks the same questions of each option', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await page.goto('/options')
  await page.getByText('Compare these options side by side').click()

  const table = page.getByRole('table')
  for (const label of ['What it is', 'Who may pay', 'The formal name', 'The next step']) {
    await expect(table.getByRole('rowheader', { name: label })).toBeVisible()
  }
})

test('the comparison stops at three options', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await page.goto('/options')
  await page.getByText('Compare these options side by side').click()

  const boxes = page.getByRole('group', { name: /Choose up to three/ }).getByRole('checkbox')
  const total = await boxes.count()
  for (let index = 0; index < total; index += 1) {
    const box = boxes.nth(index)
    if (await box.isEnabled()) await box.check()
  }

  await expect(page.getByText('Three is the most that stays readable')).toBeVisible()
  await expect(
    page.getByRole('table').getByRole('columnheader'),
  ).toHaveCount(4) // three options plus the question column
})

test('funding leads with what each system does not cover', async ({ page }) => {
  await page.goto('/funding')

  const ndis = page.getByRole('article', { name: 'NDIS funding' })
  await expect(ndis.getByRole('heading', { name: 'Does not pay for' })).toBeVisible()
  await expect(ndis).toContainText('Rent')
})

test('funding reads without having answered anything', async ({ page }) => {
  await page.goto('/funding')
  await expect(page.getByRole('heading', { level: 1, name: 'Who pays for what' })).toBeVisible()
  await expect(page.getByRole('article')).not.toHaveCount(0)
})

test('funding marks the systems a person’s own options draw on', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await page.goto('/funding')

  await expect(page.getByText(/sources your options draw on are listed first/)).toBeVisible()
  await expect(page.getByRole('article').first()).toContainText('On your list because of:')
})

test('the three levels of detail are offered the same way everywhere', async ({ page }) => {
  await page.goto('/funding')

  const card = page.getByRole('article', { name: 'NDIS funding' })
  await expect(card.getByText('Tell me more')).toBeVisible()
  await expect(card.getByText('In more detail')).toBeVisible()

  await card.getByText('In more detail').click()
  await expect(card).toContainText('National Disability Insurance Agency')
})

test('who can help is filtered to the situation once it is known', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await page.goto('/organisations')

  await expect(page.getByRole('heading', { name: 'A support coordinator' })).toBeVisible()
  await expect(page.getByText(/Other kinds of help/)).toBeVisible()
})

test('who can help says plainly that it is not a directory', async ({ page }) => {
  await page.goto('/organisations')

  await expect(page.getByText(/roles rather than named services/)).toBeVisible()
  await expect(
    page.getByRole('article').first().getByRole('heading', { name: 'How to find one' }),
  ).toBeVisible()
})

test('the plan links out to funding and to who can help', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await page.goto('/my-plan')

  const funding = page.getByRole('region', { name: 'Who may pay' })
  await expect(funding).toContainText('Does not pay for')
  await funding.getByRole('link').click()
  await expect(page).toHaveURL(/\/funding$/)

  await page.goto('/my-plan')
  const help = page.getByRole('region', { name: 'Who can help' })
  await help.getByRole('link').click()
  await expect(page).toHaveURL(/\/organisations$/)
})
