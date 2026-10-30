import { randomUUID } from 'node:crypto'

import { expect, test, type Page } from '@playwright/test'
import { Pool } from 'pg'

test.skip(
  process.env.P3_REAL_API !== '1',
  'Requires production, mocks off and the disposable review database'
)

function database() {
  const url = new URL(process.env.DATABASE_URL ?? '')
  if (
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    !url.pathname.endsWith('_p3_review')
  )
    throw new Error('Refusing non-review database')
  if (process.env.GHL_PIT || process.env.GHL_LOCATION_ID)
    throw new Error('Real API tests must not have GHL credentials')
  return new Pool({ connectionString: url.href })
}
async function fill(page: Page, email: string) {
  await page.goto('/contact?utm_source=p3-review')
  const necessary = page.getByRole('button', {
    name: 'Necessary only',
    exact: true,
  })
  if (await necessary.isVisible()) await necessary.click()
  await page
    .getByRole('textbox', { name: 'First name', exact: true })
    .fill('Local review')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email)
  await page.getByText("I'm not a robot", { exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(() => document.querySelector('altcha-widget')?.getState())
    )
    .toBe('verified')
}
for (const retry of [false, true]) {
  test(`real ALTCHA ${retry ? 'uncertain retry' : 'double-click'} creates exactly one queued lead`, async ({
    page,
  }) => {
    const pool = database()
    const email = `p3-${randomUUID()}@example.test`
    const keys: string[] = []
    let first = true
    await page.route('**/api/v1/leads', async (route) => {
      keys.push(route.request().headers()['idempotency-key'] ?? '')
      const body = route.request().postDataJSON()
      expect(body.company_website_confirm).toBe('')
      expect(body.consent.sms).toBe(false)
      expect(body.consent.email).toBe(false)
      expect(body.consent.smsText).toContain('HONEST')
      const response = await route.fetch()
      expect(response.status()).toBe(202)
      if (retry && first) {
        first = false
        await route.abort('failed')
      } else await route.fulfill({ response })
    })
    try {
      await fill(page, email)
      await page
        .getByRole('button', { name: 'Start the conversation', exact: true })
        .click({ clickCount: 2 })
      if (retry) {
        await expect(
          page.getByRole('button', { name: 'Try again', exact: true })
        ).toBeVisible()
        // New proof and URL must not turn an uncertain retry into a new lead.
        await page.evaluate(async () => {
          const widget = document.querySelector('altcha-widget')
          if (!widget) throw new Error('Missing captcha')
          await widget.reset()
          await widget.verify()
        })
        await expect
          .poll(() =>
            page.evaluate(() =>
              document.querySelector('altcha-widget')?.getState()
            )
          )
          .toBe('verified')
        await page.evaluate(() =>
          history.replaceState(null, '', '/contact?retry=1')
        )
        await page
          .getByRole('button', { name: 'Try again', exact: true })
          .click()
      }
      await expect(page).toHaveURL(/\/thanks\/contact$/u)
      expect(keys).toHaveLength(retry ? 2 : 1)
      expect(new Set(keys).size).toBe(1)
      const result = await pool.query(
        "SELECT payload, status FROM integration.outbox WHERE payload->>'email' = $1",
        [email]
      )
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].status).toBe('queued')
      expect(result.rows[0].payload.utm.source).toBe('p3-review')
    } finally {
      await pool.end()
    }
  })
}
