import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

test.skip(
  process.env.P6_MOCKS_TESTS !== '1',
  'Requires P6 disposable CMS fixtures and the API mocks build'
)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  )
})
async function dismissConsent(page: Page) {
  const button = page.getByRole('button', {
    name: 'Necessary only',
    exact: true,
  })
  const consent = (await page.context().cookies()).some(
    (cookie) => cookie.name === 'cc_cookie'
  )
  if (!consent || (await button.isVisible())) await button.click()
  await expect(page.locator('#cc-main .cm')).not.toBeVisible()
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
}
async function details(page: Page, email: string) {
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('P6 tester')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email)
  for (const question of await page.locator('textarea[name^="answers."]').all())
    await question.fill('Disposable test answer')
}
const routes = [
  '/how-it-works',
  '/about',
  '/proof',
  '/the-honest-marketer',
  '/book',
  '/thanks/magnet',
  '/thanks/booking',
  '/packages',
  '/packages/basic-diy',
  '/packages/executive',
  '/packages/founder',
  '/packages/diamond',
  '/contact',
]
test('P6 production pages render without errors, fit their viewport and pass axe', async ({
  page,
}, info) => {
  test.setTimeout(120000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const path of routes) {
    const response = await page.goto(path)
    expect(response?.status(), path).toBe(200)
    // Let the first MSW registration settle before navigating to another page.
    // Bounded: `ready` can stay pending in Chromium on a page the worker
    // already controls, and this is only a settling wait, not an assertion.
    await page.evaluate(() =>
      Promise.race([
        navigator.serviceWorker.ready.then(() => undefined),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ])
    )
    await dismissConsent(page)
    await expect(page.locator('main h1')).toHaveCount(1)
    await page.evaluate(() => document.fonts.ready)
    await page.getByRole('heading', { level: 1 }).scrollIntoViewIfNeeded()
    const audit = await new AxeBuilder({ page }).analyze()
    expect(
      audit.violations.filter(
        (issue) => issue.impact === 'serious' || issue.impact === 'critical'
      ),
      path
    ).toEqual([])
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth
      ),
      path
    ).toBe(false)
    if (path === '/about')
      expect(await page.locator('main').innerText()).not.toContain('17 years')
    const name = `${path.slice(1).replaceAll('/', '-')}-${info.project.name}`
    const screenshot = info.outputPath(`${name}.png`)
    await page.screenshot({
      path: screenshot,
      fullPage: true,
      animations: 'disabled',
    })
    await info.attach(name, { path: screenshot, contentType: 'image/png' })
  }
  expect(errors).toEqual([])
})
test('booking confirms once with optional consents unchecked and exports the returned time', async ({
  page,
}) => {
  const bodies: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('/api/v1/bookings'))
      bodies.push(request.postData() ?? '')
  })
  await page.goto('/book')
  await dismissConsent(page)
  await chooseTime(page)
  await details(page, 'p6-confirmed@example.test')
  await expect(page.locator('input[name="consent.sms"]')).not.toBeChecked()
  await expect(page.locator('input[name="consent.email"]')).not.toBeChecked()
  await page
    .getByRole('button', { name: 'Request this time', exact: true })
    .click({ clickCount: 2 })
  await expect(page).toHaveURL(/\/thanks\/booking$/u)
  await expect(
    page.getByText(
      'Your appointment is confirmed. We will also email the details.',
      { exact: true }
    )
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Download ICS' })
  ).toHaveAttribute('href', /^data:text\/calendar/u)
  const google = await page
    .getByRole('link', { name: 'Add to Google Calendar' })
    .getAttribute('href')
  expect(new URL(google ?? '').searchParams.get('dates')).toMatch(
    /\d{8}T\d{6}Z\/\d{8}T\d{6}Z/u
  )
  expect(bodies).toHaveLength(1)
  const body = JSON.parse(bodies[0] ?? '{}')
  expect(body.consent.sms).toBe(false)
  expect(body.consent.email).toBe(false)
  expect(body.contact.phone).toBeUndefined()
  expect(Object.keys(body.answers)).toHaveLength(3)
  // GoHighLevel shows these keys to the Founder: words, not CMS row ids.
  for (const key of Object.keys(body.answers)) expect(key).toContain(' ')
})
test('queued booking stays pending and offers no calendar exports', async ({
  page,
}) => {
  await page.goto('/book')
  await dismissConsent(page)
  await chooseTime(page)
  await details(page, 'p6-pending@ghl-down.test')
  await page
    .getByRole('button', { name: 'Request this time', exact: true })
    .click()
  await expect(page).toHaveURL(/\/thanks\/booking$/u)
  await expect(page.getByText(/Your booking request is queued/u)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Download ICS' })).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'Add to Google Calendar' })
  ).toHaveCount(0)
})
test('slot conflict clears selection and refreshes availability', async ({
  page,
}) => {
  let loads = 0
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/booking/slots?')) loads++
  })
  await page.goto('/book')
  await dismissConsent(page)
  await chooseTime(page)
  await details(page, 'taken@example.test')
  const before = loads
  await page
    .getByRole('button', { name: 'Request this time', exact: true })
    .click()
  await expect(
    page.getByText('Just taken, pick another time', { exact: true }).first()
  ).toBeVisible()
  await expect.poll(() => loads).toBeGreaterThan(before)
  await expect(page.locator('input[name="slot"]:checked')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Try again', exact: true })
  ).toBeDisabled()
})
test('month paging and timezone changes keep queries within 31 days', async ({
  page,
}) => {
  const queries: URLSearchParams[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/booking/slots?'))
      queries.push(new URL(request.url()).searchParams)
  })
  await page.goto('/book')
  await dismissConsent(page)
  await chooseTime(page)
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
    ).toBeLessThanOrEqual(31)
  await expect(page.locator('input[name="slot"]:checked')).toHaveCount(0)
})
for (const edited of [false, true])
  test(`an uncertain booking retry retains its idempotency key${edited ? ' after an edit' : ''}`, async ({
    page,
  }) => {
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
    await page.goto('/book')
    await dismissConsent(page)
    await chooseTime(page)
    await details(page, 'p6-retry@example.test')
    await page
      .getByRole('button', { name: 'Request this time', exact: true })
      .click()
    await expect(
      page.getByText(
        'We could not confirm the result. Retry this request before booking elsewhere.',
        { exact: true }
      )
    ).toBeVisible()
    await page.clock.install()
    await page.clock.setSystemTime(new Date(Date.now() + 7 * 86400000))
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    // The first attempt may have booked, so an edit must not mint a new key.
    if (edited)
      await page.locator('input[name="contact.firstName"]').fill('Edited')
    await page.getByRole('button', { name: 'Try again', exact: true }).click()
    await expect(page).toHaveURL(/\/thanks\/booking$/u)
    expect(keys).toHaveLength(2)
    expect(keys[0]).toBeTruthy()
    expect(keys[1]).toBe(keys[0])
  })
test('availability outage uses the CMS calendar iframe', async ({ page }) => {
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
  await page.goto('/book')
  await dismissConsent(page)
  await page
    .locator('iframe[title="HONEST Discovery Call calendar"]')
    .scrollIntoViewIfNeeded()
  await expect(
    page
      .frameLocator('iframe[title="HONEST Discovery Call calendar"]')
      .getByRole('heading', { name: 'Calendar fixture' })
  ).toBeVisible()
})
test('magnet signup reaches email-delivery thanks', async ({ page }) => {
  await page.goto('/the-honest-marketer')
  await dismissConsent(page)
  await page
    .getByRole('textbox', { name: 'First name', exact: true })
    .fill('P6 reader')
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('p6-magnet@example.test')
  await page
    .getByRole('button', { name: 'Send me the guide', exact: true })
    .click()
  await expect(page).toHaveURL(/\/thanks\/magnet$/u)
  await expect(page.getByText(/Delivery is by email/u)).toBeVisible()
})
test('drafts and settings remain private and preview shows the draft badge', async ({
  page,
  request,
  browser,
}) => {
  const login = await page.request.post('/api/cms/users/login', {
    data: {
      email: 'p3-editor@example.test',
      password: 'P3-disposable-local-fixture-only!',
    },
  })
  expect(login.ok()).toBe(true)
  const { token } = await login.json()
  const headers = { Authorization: `JWT ${token}` }
  const listing = await request.get(
    '/api/cms/pages?where[slug][equals]=about',
    { headers }
  )
  const item = (await listing.json()).docs[0]
  try {
    const saved = await request.patch(`/api/cms/pages/${item.id}?draft=true`, {
      headers,
      data: { title: 'Private P6 preview', _status: 'draft' },
    })
    expect(saved.ok()).toBe(true)
    const preview = await page.request.get('/cms-preview?path=/about', {
      headers,
      maxRedirects: 0,
    })
    expect(preview.status()).toBe(307)
    const bypass = preview
      .headers()
      ['set-cookie']?.match(/__prerender_bypass=([^;]+)/u)?.[1]
    expect(bypass).toBeTruthy()
    // The production cookie stays Secure. Only this HTTP loopback fixture
    // normalizes its transport, since WebKit rejects Secure cookies on HTTP.
    await page.context().addCookies([
      {
        name: 'payload-token',
        value: token,
        url: 'http://localhost:3003',
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: '__prerender_bypass',
        value: bypass ?? '',
        url: 'http://localhost:3003',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])
    const response = await page.goto('/about')
    expect(response?.status()).toBe(200)
    await expect(page.getByText('[DRAFT]', { exact: true })).toBeVisible()
    const isolated = await browser.newContext({
      baseURL: 'http://localhost:3003',
    })
    try {
      const anonymous = await isolated.request.get(
        '/api/cms/pages?draft=true&where[slug][equals]=about'
      )
      expect(JSON.stringify(await anonymous.json())).not.toContain(
        'Private P6 preview'
      )
    } finally {
      await isolated.close()
    }
  } finally {
    await request.patch(`/api/cms/pages/${item.id}?draft=true`, {
      headers,
      data: { title: item.title, _status: 'draft' },
    })
  }
})

test('booking validates SMS phone and sends the exact opt-in wording', async ({
  page,
}) => {
  const bodies: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('/api/v1/bookings'))
      bodies.push(request.postData() ?? '')
  })
  await page.goto('/book')
  await dismissConsent(page)
  await chooseTime(page)
  await details(page, 'p6-consent@example.test')
  const sms = page.locator('input[name="consent.sms"]')
  const email = page.locator('input[name="consent.email"]')
  const smsText = await sms.locator('..').innerText()
  const emailText = await email.locator('..').innerText()
  await sms.check()
  await email.check()
  await page
    .getByRole('button', { name: 'Request this time', exact: true })
    .click()
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'Add a phone number to receive text messages' })
  ).toBeVisible()
  expect(bodies).toHaveLength(0)
  await page
    .getByRole('textbox', { name: 'Phone (optional, international format)' })
    .fill('+12025550123')
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page).toHaveURL(/\/thanks\/booking$/u)
  const body = JSON.parse(bodies[0] ?? '{}')
  expect(body.consent).toEqual({ sms: true, email: true, smsText, emailText })
})

test('gallery lightbox is keyboard accessible and restores focus', async ({
  page,
  request,
}) => {
  const login = await request.post('/api/cms/users/login', {
    data: {
      email: 'p3-admin@example.test',
      password: 'P3-disposable-local-fixture-only!',
    },
  })
  const { token } = await login.json()
  const headers = { Authorization: `JWT ${token}` }
  const listing = await request.get(
    '/api/cms/pages?where[slug][equals]=proof',
    { headers }
  )
  const record = (await listing.json()).docs[0]
  const image = await request.get('/posters/glint.webp')
  const upload = await request.post('/api/cms/media', {
    headers,
    multipart: {
      _payload: JSON.stringify({ alt: 'QA fixture only, not client proof' }),
      file: {
        name: 'p6-gallery-test.webp',
        mimeType: 'image/webp',
        buffer: await image.body(),
      },
    },
  })
  expect(upload.ok()).toBe(true)
  const media = (await upload.json()).doc
  const blocks = structuredClone(record.blocks)
  const gallery = blocks.find(
    (block: { blockType: string }) => block.blockType === 'proofGallery'
  )
  gallery.items[0].image = media.id
  gallery.items[0].title = 'Keyboard test fixture'
  gallery.items[0].caption = 'QA image only; not client proof.'
  try {
    const updated = await request.patch(`/api/cms/pages/${record.id}`, {
      headers,
      data: { blocks, _status: 'published' },
    })
    expect(updated.ok()).toBe(true)
    await page.goto('/proof')
    await dismissConsent(page)
    const trigger = page.getByRole('button', {
      name: 'Open screenshot: Keyboard test fixture',
    })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(
      page.getByRole('dialog', { name: 'Keyboard test fixture' })
    ).toBeVisible()
    const audit = await new AxeBuilder({ page }).analyze()
    expect(
      audit.violations.filter(
        (issue) => issue.impact === 'serious' || issue.impact === 'critical'
      )
    ).toEqual([])
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  } finally {
    await request.patch(`/api/cms/pages/${record.id}`, {
      headers,
      data: { blocks: record.blocks, _status: 'published' },
    })
    await request.delete(`/api/cms/media/${media.id}`, { headers })
  }
})

test('anonymous global draft requests cannot reveal unapproved settings', async ({
  page,
  request,
  browser,
}) => {
  const login = await page.request.post('/api/cms/users/login', {
    data: {
      email: 'p3-editor@example.test',
      password: 'P3-disposable-local-fixture-only!',
    },
  })
  expect(login.ok()).toBe(true)
  const { token } = await login.json()
  const headers = { Authorization: `JWT ${token}` }
  const prior = await page.request.get(
    '/api/cms/globals/site-settings?draft=true',
    { headers }
  )
  expect(prior.ok()).toBe(true)
  const settings = await prior.json()
  try {
    const saved = await request.post(
      '/api/cms/globals/site-settings?draft=true',
      {
        headers,
        data: { publicEmail: 'private-draft@example.test', _status: 'draft' },
      }
    )
    expect(saved.ok()).toBe(true)
    const isolated = await browser.newContext({
      baseURL: 'http://localhost:3003',
    })
    const anonymous = await isolated.request.get(
      '/api/cms/globals/site-settings?draft=true'
    )
    expect(anonymous.status()).toBe(403)
    const published = await isolated.request.get(
      '/api/cms/globals/site-settings'
    )
    expect(published.ok()).toBe(true)
    expect(JSON.stringify(await published.json())).not.toContain(
      'private-draft@example.test'
    )
    expect(JSON.stringify(await anonymous.json())).not.toContain(
      'private-draft@example.test'
    )
    await isolated.close()
    const editor = await page.request.get(
      '/api/cms/globals/site-settings?draft=true',
      { headers }
    )
    expect(editor.ok()).toBe(true)
    expect((await editor.json()).publicEmail).toBe('private-draft@example.test')
  } finally {
    await request.post('/api/cms/globals/site-settings?draft=true', {
      headers,
      data: { publicEmail: settings.publicEmail ?? '', _status: 'draft' },
    })
  }
})

test('P6 analytics records booking and package clicks only after consent', async ({
  page,
}) => {
  const events: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('/api/v1/events'))
      events.push(request.postData() ?? '')
  })
  await page.goto('/book')
  await page.getByRole('button', { name: 'Accept all', exact: true }).click()
  await chooseTime(page)
  await page
    .getByRole('link', { name: 'Packages', exact: true })
    .first()
    .click()
  await page
    .getByRole('dialog')
    .getByRole('link', { name: 'Explore the Founder Package', exact: true })
    .click()
  await expect
    .poll(() => events.join(''), { timeout: 15000 })
    .toContain('booking_step')
  expect(events.join('')).toContain('package_clicked')
  expect(events.join('')).toContain('cta_clicked')
  // The page's own control sits inert behind the window.
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Privacy choices' })
    .click()
  await page
    .getByRole('button', { name: 'Necessary only', exact: true })
    .click()
  expect(
    await page.evaluate(() => localStorage.getItem('hnst:anon'))
  ).toBeNull()
})
