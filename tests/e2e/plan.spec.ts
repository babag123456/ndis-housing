import { expect, test, type Page } from '@playwright/test'
import { PERSONA_A, PERSONA_C, PERSONA_D } from '../fixtures/personas'

/**
 * The pathway and the plan.
 *
 * These check the things only a browser can: that the order a person sees
 * reflects their circumstances, that ticking something off survives closing the
 * tab, and that a plan with nothing in it says so rather than showing an empty box.
 */

const JOURNEY_KEY = 'ndis-housing.journey.v1'
const PLAN_KEY = 'ndis-housing.plan.v1'

async function withJourney(
  page: Page,
  answers: Record<string, string>,
  ticks?: { steps?: Record<string, true>; evidence?: Record<string, true> },
) {
  await page.goto('/')
  await page.evaluate(
    ([journeyKey, journey, planKey, plan]) => {
      window.localStorage.setItem(journeyKey, journey)
      if (plan) window.localStorage.setItem(planKey, plan)
    },
    [
      JOURNEY_KEY,
      JSON.stringify({ state: { answers, activeQuestionId: null }, version: 0 }),
      PLAN_KEY,
      ticks
        ? JSON.stringify({
            state: { steps: ticks.steps ?? {}, evidence: ticks.evidence ?? {} },
            version: 0,
          })
        : '',
    ] as const,
  )
}

async function open(page: Page, path: '/path' | '/my-plan') {
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

test('the pathway is numbered, because the order matters', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await open(page, '/path')

  const steps = page.getByRole('listitem').filter({ has: page.getByRole('checkbox') })
  expect(await steps.count()).toBeGreaterThan(3)
  await expect(page.getByRole('heading', { level: 3 }).first()).toContainText(
    'Understand the options',
  )
})

test('an urgent situation reorders the pathway rather than relabelling it', async ({
  page,
}) => {
  await withJourney(page, PERSONA_C)
  await open(page, '/path')

  await expect(page.getByRole('heading', { level: 3 }).first()).toContainText(
    'Sort out somewhere safe to stay now',
  )
})

test('a person with time is not told to find emergency housing', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await open(page, '/path')

  await expect(
    page.getByRole('heading', { name: 'Sort out somewhere safe to stay now' }),
  ).toBeHidden()
})

test('the next step is the first one not ticked', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await open(page, '/path')

  const next = page.getByRole('region', { name: 'Your next step' })
  await expect(next).toContainText('Understand the options')

  await page
    .getByRole('listitem')
    .filter({ hasText: 'Understand the options' })
    .getByRole('checkbox')
    .check()

  await expect(next).not.toContainText('Understand the options')
})

test('ticking a step survives closing the page', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await open(page, '/path')

  const step = page
    .getByRole('listitem')
    .filter({ hasText: 'Understand the options' })
    .getByRole('checkbox')
  await step.check()
  await expect(page.getByText('1 of', { exact: false }).first()).toBeVisible()

  await page.reload()
  await expect(
    page
      .getByRole('listitem')
      .filter({ hasText: 'Understand the options' })
      .getByRole('checkbox'),
  ).toBeChecked()
})

test('what this involves separates understanding, preparing and doing', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await open(page, '/path')

  const step = page.getByRole('listitem').filter({ hasText: 'Understand the options' })
  await step.getByText('What this involves').click()
  await expect(step).toContainText('Understand')
  await expect(step).toContainText('Prepare')
  await expect(step).toContainText('Do')
})

test('the plan gathers the situation, the options and the checklist', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await open(page, '/my-plan')

  await expect(page.getByRole('navigation', { name: "Your situation" })).toContainText(
    'You live in the family home.',
  )
  await expect(page.getByRole('region', { name: /Options that may suit/ })).toContainText(
    'Build a living arrangement around the person',
  )
  await expect(page.getByRole('region', { name: 'What to gather' })).toBeVisible()
})

test('a checklist item says which options it is for, and stays ticked', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await open(page, '/my-plan')

  const gather = page.getByRole('region', { name: 'What to gather' })
  const item = gather.getByRole('listitem').first()
  await expect(item).toContainText('For:')

  await item.getByRole('checkbox').check()
  await page.reload()
  await expect(
    page.getByRole('region', { name: 'What to gather' }).getByRole('listitem').first().getByRole('checkbox'),
  ).toBeChecked()
})

test('an unsure journey says what is still unknown and links back to it', async ({ page }) => {
  await withJourney(page, PERSONA_D)
  await open(page, '/my-plan')

  const unknown = page.getByRole('region', { name: 'Still to find out' })
  await expect(unknown).toBeVisible()
  await unknown.getByRole('button').first().click()
  await expect(page).toHaveURL(/\/start$/)
})

test('a plan with no likely options says so rather than showing an empty list', async ({
  page,
}) => {
  await withJourney(page, PERSONA_D)
  await open(page, '/my-plan')

  const options = page.getByRole('region', { name: /Options that may suit/ })
  await expect(options).toContainText('not enough')
})

test('an unfinished journey is invited to finish', async ({ page }) => {
  await withJourney(page, { perspective: 'self' })
  await open(page, '/path')

  await page.getByRole('link', { name: /Continue the questions/ }).click()
  await expect(page).toHaveURL(/\/start$/)
})

test('starting again clears the ticks as well as the answers', async ({ page }) => {
  await withJourney(page, PERSONA_A, { steps: { 'understand-the-options': true } })
  await open(page, '/path')
  await expect(page.getByText('1 of', { exact: false }).first()).toBeVisible()

  await page.goto('/start')
  await page.getByRole('button', { name: 'Start again' }).click()

  await page.goto('/path')
  await expect(page.getByRole('link', { name: /Continue the questions/ })).toBeVisible()
})

test('every screen can be reached from the header', async ({ page }) => {
  await withJourney(page, PERSONA_A)
  await page.goto('/')

  const nav = page.getByRole('navigation', { name: 'Sections' })
  for (const [label, url] of [
    ['Your options', /\/options$/],
    ['Your pathway', /\/path$/],
    ['Your plan', /\/my-plan$/],
  ] as const) {
    await nav.getByRole('link', { name: label }).click()
    await expect(page).toHaveURL(url)
  }
})
