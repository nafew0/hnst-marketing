import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
test.skip(
  process.env.P3_MOCKS_TESTS !== '1',
  'Requires a P3 mock-mode server and disposable CMS fixtures'
)
// Exercise the human consent UI while production keeps hideFromBots enabled.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  )
})
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
    if (route === routes[0]) await necessary.click()
    await expect(page.locator('#cc-main .cm')).not.toBeVisible()
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
  const necessary = page.getByRole('button', {
    name: 'Necessary only',
    exact: true,
  })
  await necessary.click()
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
  const necessary = page.getByRole('button', {
    name: 'Necessary only',
    exact: true,
  })
  await necessary.click()
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
    page.getByText('Add a phone number to receive text messages')
  ).toBeVisible()
  await page.locator('input[name="consent.sms"]').uncheck()
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page).toHaveURL(/\/thanks\/contact$/u)
})
test('rate-limited request can retry after correcting input', async ({
  page,
}) => {
  const keys: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('/api/v1/leads'))
      keys.push(request.headers()['idempotency-key'] ?? '')
  })
  await page.goto('/contact')
  const necessary = page.getByRole('button', {
    name: 'Necessary only',
    exact: true,
  })
  await necessary.click()
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
  expect(keys).toHaveLength(2)
  expect(keys[0]).not.toBe(keys[1])
})

test('consent is visible, keyboard operable and has sufficient contrast', async ({
  page,
}) => {
  await page.goto('/contact')
  await page
    .getByRole('button', { name: 'Necessary only', exact: true })
    .click()
  const sms = page.locator('input[name="consent.sms"]')
  const bounds = await sms.boundingBox()
  expect(bounds?.width).toBeGreaterThanOrEqual(20)
  expect(bounds?.height).toBeGreaterThanOrEqual(20)
  await sms.focus()
  await page.keyboard.press('Space')
  await expect(sms).toBeChecked()
  expect(
    await sms.evaluate((element) => getComputedStyle(element).outlineStyle)
  ).not.toBe('none')
  await page.getByRole('button', { name: 'Privacy choices' }).click()
  const audit = await new AxeBuilder({ page }).analyze()
  expect(
    audit.violations.filter(
      (issue) => issue.impact === 'serious' || issue.impact === 'critical'
    )
  ).toEqual([])
})

test('direct pricing visit tracks after consent and withdrawal clears analytics storage', async ({
  page,
}) => {
  const events: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('/api/v1/events'))
      events.push(request.postData() ?? '')
  })
  await page.goto('/packages')
  await page.getByRole('button', { name: 'Accept all', exact: true }).click()
  await expect
    .poll(() => events.join(''), { timeout: 15000 })
    .toContain('pricing_viewed')
  await page.evaluate(() => {
    localStorage.setItem('v2_session_history_review', 'fixture')
    sessionStorage.setItem('v3_first_session_event_review', 'fixture')
    document.cookie = 'v2_session_history_review=fixture; path=/'
  })
  await page.getByRole('button', { name: 'Privacy choices' }).click()
  await page
    .getByRole('button', { name: 'Necessary only', exact: true })
    .click()
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('hnst:anon')))
    .toBeNull()
  expect(
    await page.evaluate(() => localStorage.getItem('v2_session_history_review'))
  ).toBeNull()
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem('v3_first_session_event_review')
    )
  ).toBeNull()
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    'v2_session_history_review'
  )
})

test('a double-click submits exact opt-in wording and succeeds once', async ({
  page,
}) => {
  const bodies: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('/api/v1/leads'))
      bodies.push(request.postData() ?? '')
  })
  await page.goto('/contact')
  await page
    .getByRole('button', { name: 'Necessary only', exact: true })
    .click()
  await page
    .getByRole('textbox', { name: 'First name', exact: true })
    .fill('Consent tester')
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('consent@example.test')
  await page
    .getByRole('textbox', { name: 'Phone (optional, international format)' })
    .fill('+12025550123')
  const sms = page.locator('input[name="consent.sms"]')
  const email = page.locator('input[name="consent.email"]')
  const smsText = await sms.locator('..').innerText()
  const emailText = await email.locator('..').innerText()
  await sms.check()
  await email.check()
  await page
    .getByRole('button', { name: 'Start the conversation', exact: true })
    .click({ clickCount: 2 })
  await expect(page).toHaveURL(/\/thanks\/contact$/u)
  expect(bodies).toHaveLength(1)
  const body = JSON.parse(bodies[0] ?? '{}')
  expect(body.consent).toEqual({ sms: true, email: true, smsText, emailText })
  expect(body.phone).toBe('+12025550123')
})
