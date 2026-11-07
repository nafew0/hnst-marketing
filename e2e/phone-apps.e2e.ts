import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { z } from 'zod'

async function ready(page: Page, path: string) {
  await page.goto(path)
  await page.evaluate(() =>
    Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ])
  )
  const consent = page.getByRole('button', {
    name: 'Necessary only',
    exact: true,
  })
  if (await consent.isVisible()) await consent.click()
}
async function audit(page: Page) {
  const duplicates = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(
      (element) => element.id
    )
    return ids.filter((id, index) => ids.indexOf(id) !== index)
  })
  expect(duplicates).toEqual([])
  const result = await new AxeBuilder({ page })
    .exclude('[data-base-ui-focus-guard]')
    .analyze()
  expect(
    result.violations
      .filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))
      .map((item) => item.id)
  ).toEqual([])
}
async function chooseTime(page: Page) {
  await expect(
    page.getByText('Loading availability…', { exact: true })
  ).not.toBeVisible()
  if ((await page.locator('table button:not([disabled])').count()) === 0) {
    await page.getByRole('button', { name: 'Next month', exact: true }).click()
    await expect(
      page.getByText('Loading availability…', { exact: true })
    ).not.toBeVisible()
  }
  await page.locator('table button:not([disabled])').first().click()
  await page.locator('input[name="slot"]').first().check()
  await page
    .getByRole('button', { name: 'Book this time', exact: true })
    .click()
}
async function bookingDetails(page: Page, email: string) {
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('M6 tester')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email)
  for (const question of await page.locator('textarea[name^="answers."]').all())
    await question.fill('Synthetic test answer')
}
async function noVisitorStorage(page: Page, marker: string) {
  const stored = await page.evaluate(() =>
    JSON.stringify({
      local: { ...localStorage },
      session: { ...sessionStorage },
      cookie: document.cookie,
    })
  )
  expect(stored).not.toContain(marker)
}

let pageErrors: string[] = []
test.afterEach(() => {
  expect(pageErrors).toEqual([])
})
test.beforeEach(async ({ page }) => {
  pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('desktop keeps one inline contact and booking form', async ({
  page,
}, info) => {
  test.skip(!info.project.name.startsWith('desktop'), 'Desktop regression')
  await ready(page, '/contact')
  await expect(page.locator('form')).toHaveCount(1)
  await expect(
    page.getByRole('textbox', { name: 'First name', exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole('textbox', { name: 'Subject', exact: true })
  ).toHaveCount(0)
  await ready(page, '/book')
  await expect(page.locator('form')).toHaveCount(1)
  await expect(
    page.getByRole('textbox', { name: 'Name', exact: true })
  ).toBeVisible()
  await audit(page)
})

test('mail validates, keeps a draft through home, sends once and leaves no stored input', async ({
  page,
}, info) => {
  test.skip(info.project.name.startsWith('desktop'), 'Phone compose')
  const requests: string[] = []
  page.on('request', (req) => {
    if (req.url().endsWith('/api/v1/leads') && req.method() === 'POST')
      requests.push(req.postData() ?? '')
  })
  await ready(page, '/contact')
  await page
    .getByRole('button', { name: 'Compose message', exact: true })
    .click()
  await expect(page.locator('form')).toHaveCount(1)
  await page
    .getByRole('textbox', { name: 'First name', exact: true })
    .fill('M6 mail marker')
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('m6-mail@example.com')
  await page
    .getByRole('textbox', { name: 'Subject', exact: true })
    .fill('M6 draft subject')
  await page
    .getByRole('textbox', { name: 'Message', exact: true })
    .fill('M6 private message')
  const emailConsent = page.locator('input[name="consent.email"]')
  const smsConsent = page.locator('input[name="consent.sms"]')
  await expect(emailConsent).not.toBeChecked()
  await expect(smsConsent).not.toBeChecked()
  const consentText = await emailConsent.locator('..').innerText()
  await emailConsent.check()
  await audit(page)
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page
    .getByRole('link', { name: 'Home screen', exact: true })
    .or(page.getByRole('button', { name: 'Home screen', exact: true }))
    .click()
  await page.getByRole('button', { name: 'Mail', exact: true }).click()
  await page
    .getByRole('button', { name: 'Compose message', exact: true })
    .click()
  await expect(
    page.getByRole('textbox', { name: 'Subject', exact: true })
  ).toHaveValue('M6 draft subject')
  await noVisitorStorage(page, 'M6 private message')
  await page.locator('form').evaluate((form) => {
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected form')
    form.requestSubmit()
    form.requestSubmit()
  })
  await expect(page.getByText('Sent', { exact: true })).toBeVisible()
  expect(requests).toHaveLength(1)
  const sent = z
    .object({
      message: z.string(),
      consent: z.object({ emailText: z.string(), sms: z.boolean() }),
    })
    .parse(JSON.parse(requests[0] ?? '{}'))
  expect(sent.message).toContain('Subject: M6 draft subject')
  expect(sent.consent.emailText).toBe(consentText)
  expect(sent.consent.sms).toBe(false)
})

for (const kind of ['confirmed', 'queued', 'conflict'] as const)
  test(`Calendar ${kind} response and package selection`, async ({
    page,
  }, info) => {
    test.skip(info.project.name.startsWith('desktop'), 'Phone Calendar')
    const requests: string[] = []
    page.on('request', (req) => {
      if (req.url().endsWith('/api/v1/bookings') && req.method() === 'POST')
        requests.push(req.postData() ?? '')
    })
    await ready(page, '/book?package=founder')
    await expect(
      page.getByRole('heading', { name: 'Calendar', exact: true })
    ).toBeVisible()
    await chooseTime(page)
    await expect(page.locator('form')).toHaveCount(1)
    const emails = {
      confirmed: 'm6-calendar@example.com',
      queued: 'm6@ghl-down.test',
      conflict: 'taken@example.com',
    }
    await bookingDetails(page, emails[kind])
    await expect(page.locator('input[name="consent.sms"]')).not.toBeChecked()
    await audit(page)
    await page.locator('form').evaluate((form) => {
      if (!(form instanceof HTMLFormElement)) throw new Error('Expected form')
      form.requestSubmit()
      form.requestSubmit()
    })
    if (kind === 'confirmed') {
      await expect(
        page.getByText('Your appointment is confirmed.', { exact: false })
      ).toBeVisible()
      await expect(
        page.getByRole('link', { name: 'Download ICS', exact: true })
      ).toHaveAttribute('href', /^data:text\/calendar/u)
      await expect(
        page.getByRole('link', { name: 'Add to Google Calendar', exact: true })
      ).toHaveAttribute('href', /dates=/u)
    } else if (kind === 'queued') {
      await expect(
        page.getByText(/This is not a confirmed appointment/u)
      ).toBeVisible()
      await expect(
        page.getByRole('link', { name: 'Download ICS', exact: true })
      ).toHaveCount(0)
    } else {
      await expect(
        page.getByText('Just taken, pick another time', { exact: true }).first()
      ).toBeVisible()
      await page.getByRole('button', { name: 'Done', exact: true }).click()
      await expect(
        page.getByText('Loading availability…', { exact: true })
      ).not.toBeVisible()
      await expect(page.locator('input[name="slot"]:checked')).toHaveCount(0)
    }
    expect(requests).toHaveLength(1)
    expect(
      z
        .object({ packageInterest: z.string() })
        .parse(JSON.parse(requests[0] ?? '{}')).packageInterest
    ).toBe('founder')
    if (kind !== 'conflict') {
      await page
        .getByRole('link', { name: 'Home screen', exact: true })
        .or(page.getByRole('button', { name: 'Home screen', exact: true }))
        .click()
      await page.getByRole('button', { name: /notifications/u }).click()
      const centre = page.getByRole('dialog', {
        name: 'Notifications',
        exact: true,
      })
      await expect(
        centre.getByText(
          kind === 'confirmed' ? 'Call booked' : 'Request received',
          { exact: true }
        )
      ).toBeVisible()
      if (kind === 'confirmed') {
        const booked = z
          .object({ slot: z.string(), tz: z.string() })
          .parse(JSON.parse(requests[0] ?? '{}'))
        const time = await page.evaluate(
          ({ slot, tz }) =>
            new Intl.DateTimeFormat(undefined, {
              dateStyle: 'full',
              timeStyle: 'short',
              timeZone: tz,
            }).format(new Date(slot)),
          booked
        )
        await expect(centre.getByText(time, { exact: true })).toBeVisible()
      } else
        await expect(
          centre.getByText('Your confirmation follows by email.', {
            exact: true,
          })
        ).toBeVisible()
    }
  })

test('Notes reads published content and keeps visitor notes in memory', async ({
  page,
}, info) => {
  test.skip(info.project.name.startsWith('desktop'), 'Phone-only Notes')
  await ready(page, '/?app=notes')
  await expect(
    page.getByRole('button', { name: 'M6 published fixture', exact: true })
  ).toBeVisible()
  await expect(
    page.getByText('M6 private draft fixture', { exact: true })
  ).toHaveCount(0)
  await page
    .getByRole('button', { name: 'M6 published fixture', exact: true })
    .click()
  await expect(
    page.getByText('A published editorial note for browser tests.', {
      exact: true,
    })
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'New note', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Title', exact: true })
    .fill('M6 private note title')
  await page
    .getByRole('textbox', { name: 'Note', exact: true })
    .fill('M6 private note body')
  await page
    .getByRole('link', { name: 'Home screen', exact: true })
    .or(page.getByRole('button', { name: 'Home screen', exact: true }))
    .click()
  await page
    .getByRole('link', { name: 'Notes', exact: true })
    .or(page.getByRole('button', { name: 'Notes', exact: true }))
    .click()
  await expect(
    page.getByRole('textbox', { name: 'Note', exact: true })
  ).toHaveValue('M6 private note body')
  await noVisitorStorage(page, 'M6 private note body')
  await page
    .getByRole('button', { name: 'Send to HONEST', exact: true })
    .click()
  await page
    .getByRole('textbox', { name: 'First name', exact: true })
    .fill('M6 note tester')
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('m6-note@example.com')
  await expect(
    page.getByRole('textbox', { name: 'Note to send', exact: true })
  ).toHaveValue('M6 private note body')
  await page
    .getByRole('button', { name: 'Start the conversation', exact: true })
    .click()
  await expect(page.getByText('Sent', { exact: true })).toBeVisible()
  await audit(page)
  await page.reload()
  await expect(
    page.getByRole('textbox', { name: 'Note', exact: true })
  ).toHaveCount(0)
})

test('removal reads only a fragment, requires confirmation and is noindex', async ({
  page,
  request,
}) => {
  const token = 'm6_private_removal_token_for_test_12345'
  const id = '00000000-0000-4000-8000-000000000429'
  const urls: string[] = []
  page.on('request', (req) => urls.push(req.url()))
  await ready(page, `/wall/remove#${id}.${token}`)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/u
  )
  await expect(
    page.getByRole('button', { name: 'Remove my photo', exact: true })
  ).toBeVisible()
  expect(
    urls.filter((url) => url.endsWith('/api/v1/wall/remove'))
  ).toHaveLength(0)
  await page
    .getByRole('button', { name: 'Remove my photo', exact: true })
    .click()
  await expect(
    page.getByText('We could not remove the photo. Please try again.', {
      exact: true,
    })
  ).toBeVisible()
  expect(urls.every((url) => !url.includes(token))).toBe(true)
  expect(await (await request.get('/sitemap.xml')).text()).not.toContain(
    '/wall/remove'
  )
  await audit(page)
  await ready(page, `/wall/remove?id=${id}&token=ignored`)
  await expect(
    page.getByText('Invalid removal link', { exact: true })
  ).toBeVisible()
})

test('compose validates without sending and supports keyboard dismissal', async ({
  page,
}, info) => {
  test.skip(info.project.name.startsWith('desktop'), 'Phone sheet')
  const writes: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('/api/v1/leads')) writes.push(request.url())
  })
  await ready(page, '/contact')
  const trigger = page.getByRole('button', {
    name: 'Compose message',
    exact: true,
  })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Start the conversation', exact: true })
  ).toHaveAttribute('aria-disabled', 'true')
  await page.locator('form').evaluate((form) => {
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected form')
    form.requestSubmit()
  })
  await expect(page.locator('input[name="firstName"]')).toBeFocused()
  expect(writes).toHaveLength(0)
  await page.keyboard.press('Tab')
  await expect(page.locator('input[name="email"]')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await audit(page)
})

test('Calendar pages 31-day availability, changes zone and keeps its draft', async ({
  page,
}, info) => {
  test.skip(info.project.name.startsWith('desktop'), 'Phone Calendar')
  const queries: URLSearchParams[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname === '/api/v1/booking/slots') queries.push(url.searchParams)
  })
  await ready(page, '/book')
  await chooseTime(page)
  await bookingDetails(page, 'm6-draft@example.com')
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page
    .getByRole('link', { name: 'Home screen', exact: true })
    .or(page.getByRole('button', { name: 'Home screen', exact: true }))
    .click()
  await page
    .getByRole('button', { name: 'Calendar: book a call', exact: true })
    .or(page.getByRole('link', { name: 'Calendar: book a call', exact: true }))
    .click()
  await chooseTime(page)
  await expect(
    page.getByRole('textbox', { name: 'Email', exact: true })
  ).toHaveValue('m6-draft@example.com')
  await noVisitorStorage(page, 'm6-draft@example.com')
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.getByRole('button', { name: 'Next month', exact: true }).click()
  await expect(
    page.getByText('Loading availability…', { exact: true })
  ).not.toBeVisible()
  await page.getByRole('combobox', { name: 'Your timezone' }).click()
  await page
    .getByRole('option', { name: 'America/New_York', exact: true })
    .click()
  await expect
    .poll(() => queries.some((query) => query.get('tz') === 'America/New_York'))
    .toBe(true)
  for (const query of queries)
    expect(
      (Date.parse(query.get('to') ?? '') -
        Date.parse(query.get('from') ?? '')) /
        86400000
    ).toBeLessThanOrEqual(30)
  await expect(page.locator('input[name="slot"]:checked')).toHaveCount(0)
  await expect(page.locator('table [aria-current="date"]')).toHaveCount(1)
})

test('Calendar uses the configured embed when availability is offline', async ({
  page,
}, info) => {
  test.skip(info.project.name.startsWith('desktop'), 'Phone Calendar')
  await page
    .context()
    .route('https://api.leadconnectorhq.com/p6-calendar-fixture', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<html><body><h1>Calendar fixture</h1></body></html>',
      })
    )
  await page.addInitScript(() => {
    const original = window.fetch.bind(window)
    window.fetch = Object.assign(
      (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(
          input instanceof Request ? input.url : String(input),
          location.href
        )
        if (url.pathname === '/api/v1/booking/slots')
          return Promise.reject(new TypeError('Simulated offline availability'))
        return original(input, init)
      },
      window.fetch
    )
  })
  await ready(page, '/book')
  await expect(
    page
      .frameLocator('iframe[title="HONEST Discovery Call calendar"]')
      .getByRole('heading', { name: 'Calendar fixture' })
  ).toBeVisible()
})

test('Calendar retries a lost response with the same key after closing its sheet', async ({
  page,
}, info) => {
  test.skip(info.project.name.startsWith('desktop'), 'Phone Calendar')
  await page.addInitScript(() => {
    const original = window.fetch.bind(window)
    let dropped = false
    window.fetch = Object.assign(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(
          input instanceof Request ? input.url : String(input),
          location.href
        )
        const response = await original(input, init)
        if (url.pathname === '/api/v1/bookings' && !dropped) {
          dropped = true
          throw new TypeError('Simulated lost response')
        }
        return response
      },
      window.fetch
    )
  })
  const keys: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('/api/v1/bookings'))
      keys.push(request.headers()['idempotency-key'] ?? '')
  })
  await ready(page, '/book')
  await chooseTime(page)
  await bookingDetails(page, 'm6-retry@example.com')
  await page
    .getByRole('button', { name: 'Request this time', exact: true })
    .click()
  await expect(
    page.getByText(
      'We could not confirm the result. Retry this request before booking elsewhere.',
      { exact: true }
    )
  ).toBeVisible()
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page
    .getByRole('button', { name: 'Book this time', exact: true })
    .click()
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Edited after lost response')
  await page
    .getByRole('button', { name: 'Request this time', exact: true })
    .click()
  await expect(
    page.getByText('Your appointment is confirmed.', { exact: false })
  ).toBeVisible()
  expect(keys).toHaveLength(2)
  expect(keys[0]).toBeTruthy()
  expect(keys[1]).toBe(keys[0])
})

test('a private mock wall link removes once and clears its fragment', async ({
  page,
}) => {
  await ready(page, '/wall/remove')
  const pending = z.object({ id: z.string(), removeToken: z.string() }).parse(
    await page.evaluate(async () => {
      const form = new FormData()
      form.set(
        'image',
        new Blob(['synthetic mock image'], { type: 'image/png' }),
        'fixture.png'
      )
      form.set('consentText', 'Synthetic test consent')
      form.set('adult', 'true')
      form.set('altcha', 'mock-altcha')
      const response = await fetch('/api/v1/wall', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: form,
      })
      return response.json()
    })
  )
  const writes: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('/api/v1/wall/remove'))
      writes.push(request.postData() ?? '')
  })
  await page.evaluate(({ id, removeToken }) => {
    location.hash = `${id}.${removeToken}`
  }, pending)
  const remove = page.getByRole('button', {
    name: 'Remove my photo',
    exact: true,
  })
  await expect(remove).toBeVisible()
  expect(writes).toHaveLength(0)
  await remove.focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByText('Your photo has been removed.', { exact: true })
  ).toBeVisible()
  expect(new URL(page.url()).hash).toBe('')
  expect(writes).toHaveLength(1)
  const body = z
    .object({ id: z.string(), token: z.string() })
    .parse(JSON.parse(writes[0] ?? '{}'))
  expect(body.id).toBe(pending.id)
  expect(body.token).toBe(pending.removeToken)
  await page.reload()
  await page.evaluate(({ id, removeToken }) => {
    location.hash = `${id}.${removeToken}`
  }, pending)
  await remove.click()
  await expect(
    page.getByText(
      'This removal link is invalid or the photo is no longer available.',
      { exact: true }
    )
  ).toBeVisible()
})

test('Mail and Notes sent events require analytics consent and omit visitor text', async ({
  page,
}, info) => {
  test.skip(info.project.name.startsWith('desktop'), 'Phone app analytics')
  const events: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('/api/v1/events'))
      events.push(request.postData() ?? '')
  })
  await ready(page, '/contact')
  expect(events).toHaveLength(0)
  await page
    .getByRole('button', { name: 'Privacy choices', exact: true })
    .first()
    .click()
  await page.getByRole('button', { name: 'Accept all', exact: true }).click()
  await page
    .getByRole('button', { name: 'Compose message', exact: true })
    .click()
  await page
    .getByRole('textbox', { name: 'First name', exact: true })
    .fill('M6 consent tester')
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('m6-analytics@example.com')
  await page
    .getByRole('textbox', { name: 'Subject', exact: true })
    .fill('Private subject')
  await page
    .getByRole('textbox', { name: 'Message', exact: true })
    .fill('Private visitor text')
  await page
    .getByRole('button', { name: 'Start the conversation', exact: true })
    .click()
  await expect(page.getByText('Sent', { exact: true })).toBeVisible()
  await expect
    .poll(() => events.join(''), { timeout: 15000 })
    .toContain('"app":"mail","action":"sent"')
  await ready(page, '/?app=notes')
  await page.getByRole('button', { name: 'New note', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Note', exact: true })
    .fill('Private visitor text')
  await page
    .getByRole('button', { name: 'Send to HONEST', exact: true })
    .click()
  await page
    .getByRole('textbox', { name: 'First name', exact: true })
    .fill('M6 consent tester')
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('m6-analytics@example.com')
  await page
    .getByRole('button', { name: 'Start the conversation', exact: true })
    .click()
  await expect(page.getByText('Sent', { exact: true })).toBeVisible()
  await expect
    .poll(() => events.join(''), { timeout: 15000 })
    .toContain('"app":"notes","action":"sent"')
  expect(events.join('')).not.toContain('Private visitor text')
  expect(events.join('')).not.toContain('m6-analytics@example.com')
})
