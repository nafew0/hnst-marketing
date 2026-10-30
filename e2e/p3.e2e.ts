import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
const routes = [
  '/packages',
  '/packages/basic-diy',
  '/packages/executive',
  '/packages/founder',
  '/packages/diamond',
  '/contact',
  '/legal/privacy',
  '/legal/terms',
  '/legal/sms',
  '/link-in-bio',
  '/thanks/contact',
]
test('public pages, accessibility and console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const route of routes) {
    const response = await page.goto(route)
    expect(response?.status(), route).toBe(200)
    await expect(page.locator('main h1')).toHaveCount(1)
    const necessary = page.getByRole('button', {
      name: 'Necessary only',
      exact: true,
    })
    if (await necessary.isVisible()) await necessary.click()
    const audit = await new AxeBuilder({ page }).analyze()
    expect(
      audit.violations.filter(
        (issue) => issue.impact === 'serious' || issue.impact === 'critical'
      ),
      route
    ).toEqual([])
  }
  expect(errors).toEqual([])
})
test('contact submits with optional consent unchecked', async ({ page }) => {
  await page.goto('/contact?utm_source=p3-test')
  await page
    .getByRole('button', { name: 'Necessary only', exact: true })
    .click()
  await page
    .getByRole('textbox', { name: 'First name', exact: true })
    .fill('Local tester')
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('p3@example.com')
  await expect(page.locator('input[name="consent.sms"]')).not.toBeChecked()
  await expect(page.locator('input[name="consent.email"]')).not.toBeChecked()
  await page
    .getByRole('button', { name: 'Start the conversation', exact: true })
    .click()
  await expect(page).toHaveURL(/\/thanks\/contact$/u)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Thank you. We’re on it.'
  )
})
test('validation and SMS phone requirement keep the form actionable', async ({
  page,
}) => {
  await page.goto('/contact')
  await page
    .getByRole('button', { name: 'Necessary only', exact: true })
    .click()
  await page
    .getByRole('textbox', { name: 'First name', exact: true })
    .fill('Local tester')
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('invalid')
  await expect(
    page.getByRole('button', { name: 'Start the conversation', exact: true })
  ).toHaveAttribute('aria-disabled', 'true')
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('p3@example.com')
  await page.locator('input[name="consent.sms"]').check()
  await page
    .getByRole('button', { name: 'Start the conversation', exact: true })
    .click()
  await expect(
    page.getByText('phone: Add a phone number to receive text messages')
  ).toBeVisible()
  await page.locator('input[name="consent.sms"]').uncheck()
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page).toHaveURL(/\/thanks\/contact$/u)
})
test('rate-limited request can retry after correcting input', async ({
  page,
}) => {
  await page.goto('/contact')
  await page
    .getByRole('button', { name: 'Necessary only', exact: true })
    .click()
  await page
    .getByRole('textbox', { name: 'First name', exact: true })
    .fill('Local tester')
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('p3@ratelimit.test')
  await page
    .getByRole('button', { name: 'Start the conversation', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Try again', exact: true })
  ).toBeVisible()
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('p3@example.com')
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page).toHaveURL(/\/thanks\/contact$/u)
})
