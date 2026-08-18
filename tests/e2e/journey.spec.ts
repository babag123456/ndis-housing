import { expect, test } from '@playwright/test'

/**
 * The journey, end to end.
 *
 * These cover what unit tests cannot: that the perspective actually changes the
 * words on screen, that a skipped question is never shown, and that a person can
 * close the tab and come back to where they were.
 */

type Page = import('@playwright/test').Page

/**
 * Waits until the journey is interactive.
 *
 * The server renders a loading state while saved answers are read, so the
 * options only exist once the page has hydrated. Clicking before that lets the
 * browser's own form submission win instead of the app's.
 */
async function openJourney(page: Page) {
  await page.goto('/start')
  await expect(page.getByRole('radio').first()).toBeVisible()
}

async function choose(page: Page, label: string) {
  await page.getByRole('radio', { name: label, exact: true }).check()
  await page.getByRole('button', { name: 'Continue' }).click()
}

test('a parent is spoken to about their child in the third person', async ({ page }) => {
  await openJourney(page)
  await expect(
    page.getByRole('heading', { name: 'Who are you exploring housing options for?' }),
  ).toBeVisible()

  await choose(page, 'My child')
  await expect(page.getByRole('heading', { name: 'Where do they live now?' })).toBeVisible()

  await choose(page, 'In the family home')
  await expect(page.getByText('They live in the family home.')).toBeVisible()
})

test('someone exploring for themselves is spoken to in the second person', async ({
  page,
}) => {
  await openJourney(page)
  await choose(page, 'Myself')
  await expect(page.getByRole('heading', { name: 'Where do you live now?' })).toBeVisible()

  await choose(page, 'In a place I rent')
  await expect(page.getByText('You rent where you live.')).toBeVisible()
})

test('a question is skipped once an earlier answer has settled it', async ({ page }) => {
  await openJourney(page)
  await choose(page, 'My child')
  await choose(page, 'In the family home')
  await choose(page, 'Get more support in their current home')

  // "How would they like to live?" is not asked, because staying put answered it.
  await expect(
    page.getByRole('heading', { name: 'How would they like to live?' }),
  ).toBeHidden()
  await expect(
    page.getByRole('heading', { name: 'How much help do they need day to day?' }),
  ).toBeVisible()
})

test('answering "I\'m not sure" is allowed and is said out loud', async ({ page }) => {
  await openJourney(page)
  await choose(page, 'Myself')
  await choose(page, 'In a home I own')
  await choose(page, "I'm not sure")

  await expect(page.getByText("You're not sure yet what you want to change.")).toBeVisible()
})

test('continuing without choosing explains what to do instead of losing the screen', async ({
  page,
}) => {
  await openJourney(page)
  await page.getByRole('button', { name: 'Continue' }).click()

  // Scoped to the main content: Next's route announcer is also role="alert".
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Choose one of the options',
  )
  await expect(
    page.getByRole('heading', { name: 'Who are you exploring housing options for?' }),
  ).toBeVisible()
})

test('a journey survives closing the page and coming back', async ({ page }) => {
  await openJourney(page)
  await choose(page, 'Someone I care for')
  await choose(page, 'In a shared home with support staff')

  await page.reload()

  await expect(page.getByText('They live in a shared home with support staff.')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'What would they most like to change?' }),
  ).toBeVisible()
})

test('an earlier answer can be revisited from the thread without losing later ones', async ({
  page,
}) => {
  await openJourney(page)
  await choose(page, 'My child')
  await choose(page, 'In the family home')
  await choose(page, 'Move out of the family home')

  await page.getByRole('button', { name: /They live in the family home/ }).click()
  await expect(page.getByRole('heading', { name: 'Where do they live now?' })).toBeVisible()

  // The later answer is still on the thread, not discarded.
  await expect(page.getByText('They want to move out of the family home.')).toBeVisible()
})

test('the question names its own group of options', async ({ page }) => {
  await openJourney(page)
  // A screen reader entering the options hears the question, not just "group".
  await expect(
    page.getByRole('group', { name: 'Who are you exploring housing options for?' }),
  ).toBeVisible()
})

test('the landing page offers one primary action', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Find the right way to live.' }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Help me work out the options' }).click()
  await expect(page).toHaveURL(/\/start$/)
})
