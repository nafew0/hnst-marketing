import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/*
 * The high-end home screen (components/home-screen), with its CMS switch on and
 * the high-end copy seeded (lib/cms/seed-high-end.ts --publish), against a
 * production build. Runs on desktop and phone sizes. Dylan's layout (20–21 Nov
 * 2026): a lock screen asking about the audit, then four widgets, three app
 * icons and the Call / Text / Email dock.
 */
test.skip(
  process.env.HOME_SCREEN_TESTS !== '1',
  'Needs the home screen switched on in the CMS (seed-high-end.ts --publish) and a build after it'
)

const screen = (page: Page) => page.locator('[data-home-screen-layer]')
const lock = (page: Page) => page.getByRole('region', { name: 'Lock screen' })
const widgets = (page: Page) => page.getByRole('navigation', { name: 'Offers' })
const dock = (page: Page) =>
  page.getByRole('navigation', { name: 'Contact Dylan' })

async function seriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .exclude('[data-base-ui-focus-guard]')
    .analyze()
  return violations
    .filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))
    .map((item) => item.id)
}

async function hydrated(page: Page) {
  // The dock moves onto <body> once React runs.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.querySelector('nav[aria-label="Contact Dylan"]')
            ?.parentElement === document.body
      )
    )
    .toBe(true)
}

/** A fresh visit to `/`, answered with "I got an audit". */
async function unlocked(page: Page) {
  await page.goto('/')
  await hydrated(page)
  await lock(page).getByRole('button', { name: 'Yes, I got an audit' }).click()
  await expect(lock(page)).toHaveCount(0)
}

test('the lock screen asks about the audit and stays locked until answered', async ({
  page,
}) => {
  await page.goto('/')
  await hydrated(page)
  await expect(
    lock(page).getByRole('heading', { name: 'Did you get an audit from us?' })
  ).toBeVisible()
  await lock(page)
    .getByRole('button', { name: 'Swipe up for the full site' })
    .click()
  await expect(lock(page).getByRole('status')).toHaveText(
    'You didn’t pick an experience. Choose one above.'
  )
  await expect(dock(page).getByRole('link', { name: 'Call' })).toHaveAttribute(
    'href',
    'tel:+19452209222'
  )
  expect(await seriousViolations(page)).toEqual([])

  await lock(page).getByRole('button', { name: 'Yes, I got an audit' }).click()
  await expect(lock(page)).toHaveCount(0)

  // Once a visit: back on `/`, no question.
  await page.reload()
  await expect(lock(page)).toBeHidden()
})

test('the widgets, app icons and dock replace the old site', async ({
  page,
}) => {
  await unlocked(page)
  for (const name of [
    'Your own mobile application Our lead offer',
    'Start a podcast',
    'Get content',
    'Social media',
  ])
    await expect(widgets(page).getByRole('link', { name })).toBeVisible()
  const more = page.getByRole('navigation', { name: 'More' })
  await expect(more.getByRole('button', { name: 'Home page' })).toBeVisible()
  await expect(more.getByRole('link', { name: 'About' })).toBeVisible()
  await expect(more.getByRole('link', { name: 'Offers' })).toBeVisible()

  // The old dock, app icons and booking are gone.
  await expect(page.locator('[data-window-dock]')).toHaveCount(1)
  await expect(page.locator('[data-phone-home]')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Book a call' })).toHaveCount(0)
  expect(await seriousViolations(page)).toEqual([])
})

test('a widget’s headlines turn over', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await unlocked(page)
  const ticks = widgets(page)
    .getByRole('link', { name: 'Start a podcast' })
    .locator('[data-active]')
  const first = await ticks.textContent()
  await expect
    .poll(() => ticks.textContent(), { timeout: 12_000 })
    .not.toBe(first)
})

test('an offer opens in a window, and its messages name it', async ({
  page,
}) => {
  await unlocked(page)
  await widgets(page).getByRole('link', { name: 'Start a podcast' }).click()
  await expect(page).toHaveURL(/\/podcast$/u)
  const window = page.getByRole('dialog', { name: 'Podcast' })
  await expect(
    window.getByRole('heading', {
      level: 1,
      name: 'Can you imagine controlling the public narrative with your own voice?',
    })
  ).toBeVisible()

  const text = await dock(page)
    .getByRole('link', { name: 'Text' })
    .getAttribute('href')
  expect(decodeURIComponent(text ?? '')).toContain('the Podcast page')
  const price = window.getByRole('link', { name: 'Get a Price' }).first()
  expect(decodeURIComponent((await price.getAttribute('href')) ?? '')).toMatch(
    /^sms:\+19452209222\?body=.*a price for Podcast/u
  )
  expect(await seriousViolations(page)).toEqual([])

  await window.getByRole('button', { name: 'Close window' }).click()
  await expect(page).toHaveURL(/\/$/u)
  await expect(widgets(page)).toBeVisible()
})

test('“Here for the website” shows the cinematic homepage, offers unpriced', async ({
  page,
}) => {
  await page.goto('/')
  await hydrated(page)
  await lock(page)
    .getByRole('button', { name: 'I’m here for the website' })
    .click()
  await expect(screen(page)).toBeHidden()
  await expect(
    page.getByRole('heading', { level: 1, name: /I knew you’d\s*show up\./u })
  ).toBeVisible()
  const offers = page.getByRole('region', {
    name: 'Custom scope, not a menu of discounts.',
  })
  await expect(offers.getByRole('heading', { name: 'Podcast' })).toBeAttached()
  // No prices: “$10M+” describes the buyer, not a price.
  await expect(offers).not.toContainText(/\$\d[\d,.]*(?![\dM])/u)

  await page.getByRole('button', { name: 'Home screen' }).click()
  await expect(widgets(page)).toBeVisible()
})

test('direct visits and prospect links skip the question; retired pages go to Offers', async ({
  page,
}) => {
  await page.goto('/?p=SampleToken1')
  await hydrated(page)
  await expect(lock(page)).toBeHidden()
  await expect(widgets(page)).toBeVisible()

  await page.goto('/mobile-application')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /your customer’s home screen/u,
    })
  ).toBeVisible()
  await expect(
    page.getByText('Sample figures, shown until the real ones are in.')
  ).toBeVisible()
  await expect(dock(page)).toBeVisible()

  // /packages is prerendered, so its redirect runs in the browser, and
  // Chromium can report the first navigation as aborted on the way.
  await Promise.all([
    page.waitForURL(/\/offers$/u),
    page.goto('/packages').catch(() => null),
  ])
  await page.goto('/app')
  await expect(page).toHaveURL(/\/mobile-application$/u)
})

test('a prospect’s link greets them, skips the question and leaves the address clean', async ({
  page,
}) => {
  const token = process.env.HOME_SCREEN_PROSPECT_TOKEN
  test.skip(!token, 'Needs a prospect in the CMS (HOME_SCREEN_PROSPECT_TOKEN)')
  await page.goto(`/?p=${token}`)
  await hydrated(page)
  await expect(lock(page)).toBeHidden()
  await expect(page.getByRole('status').first()).toHaveText(
    /, I knew you’d show up\./u
  )
  await expect(page).toHaveURL(/\/$/u)
  await widgets(page).getByRole('link', { name: 'Start a podcast' }).click()
  await expect(page.getByRole('dialog', { name: 'Podcast' })).toBeVisible()
})

test('the social page: profile, posts and the footer’s new links', async ({
  page,
}) => {
  await page.goto('/social')
  await expect(
    page.getByRole('heading', { level: 1, name: 'HONEST Marketing' })
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible()
  // No profile links in the CMS yet: no follow buttons, never a network's home page.
  await expect(page.getByRole('link', { name: /^Follow on/u })).toHaveCount(0)

  const tiles = page.locator('ul button[aria-label]').filter({
    has: page.locator('img'),
  })
  if ((await tiles.count()) > 0) {
    await tiles.first().click()
    const viewer = page.getByRole('dialog').filter({ hasText: 'Close' })
    await expect(viewer).toBeVisible()
    // Our own posts live here: nothing sends the visitor away.
    await expect(viewer.getByRole('link')).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(viewer).toBeHidden()
  }

  const circles = page
    .getByRole('list', { name: 'Highlights' })
    .getByRole('button')
  if ((await circles.count()) > 0) {
    await circles.first().click()
    const story = page.locator('dialog[open]')
    await expect(story.getByRole('button', { name: 'Next' })).toBeVisible()
    await story.getByRole('button', { name: 'Close' }).click()
    await expect(story).toHaveCount(0)
  }
  expect(await seriousViolations(page)).toEqual([])

  const footer = page.getByRole('navigation', { name: 'Footer' })
  await expect(
    footer.getByRole('link', { name: 'Start a podcast' })
  ).toBeAttached()
  await expect(footer.getByRole('link', { name: 'Packages' })).toHaveCount(0)
})
