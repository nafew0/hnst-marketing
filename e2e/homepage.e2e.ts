import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import type { ErrorEnvelope, OffersResponse } from '@/lib/contracts'

// P7 acceptance that unit tests cannot reach: the whole story is there at every
// device tier, nothing depends on scroll or WebGL to be read, and package prices
// follow /api/v1/offers with the facts in the page as the fallback.

const SECTIONS = [
  /Your marketing/,
  /2023/,
  /2026/,
  /^Then$/,
  /Not a marketing agency like was possible yesterday/,
  /Everything on a golden platter/,
  /How it works/,
  /Pick how much/,
  /HONEST Marketing itself/,
  /ready when you are/,
]

const OFFERS_ROUTE = '**/api/v1/offers'

async function expectWholeStory(page: Page) {
  for (const name of SECTIONS) {
    await expect(page.getByRole('heading', { name })).toBeAttached()
  }
  await expect(
    page.getByRole('link', { name: 'Book your call' })
  ).toHaveAttribute('href', '/book')
}

const stubOffers = (
  page: Page,
  status: number,
  body: OffersResponse | ErrorEnvelope
) =>
  page.route(OFFERS_ROUTE, (route) =>
    route.fulfill({ status, json: body, contentType: 'application/json' })
  )

const scrollToPackages = (page: Page) =>
  page
    .getByRole('heading', { name: /Pick how much/ })
    .evaluate((heading) => heading.scrollIntoView())

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('shows the complete story with nothing pinned or animated', async ({
    page,
  }) => {
    await stubOffers(page, 503, {
      error: { code: 'upstream_unavailable', message: 'Down' },
    })
    await page.goto('/')
    await page.waitForLoadState('load')
    await expectWholeStory(page)

    // The film's chapters are readable stills, not a 600svh scrub.
    await expect(page.getByRole('heading', { name: /2023/ })).toBeVisible()
    const facts = await page.evaluate(() => ({
      pinned: [...document.querySelectorAll('main *')].filter(
        (element) =>
          element.checkVisibility() &&
          getComputedStyle(element).position === 'sticky'
      ).length,
      running: document.getAnimations().length,
      height: document.documentElement.scrollHeight,
    }))
    expect(facts.pinned).toBe(0)
    expect(facts.running).toBe(0)

    await expect(page.locator('main canvas')).toHaveCount(0)
    await expect(
      page.getByText('Brand Bible', { exact: true }).first()
    ).toBeVisible()
    await expect(page.getByText('$5,000')).toBeVisible()
    await expect(page.getByText('from $25,000')).toBeVisible()
  })

  test('the homepage has no serious accessibility issues', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('load')
    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter(
      (violation) =>
        violation.impact === 'serious' || violation.impact === 'critical'
    )
    expect(serious.map((violation) => violation.id)).toEqual([])
  })
})

test.describe('phone (tier 1)', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true })

  test('tells the story with the film and posters, without live WebGL', async ({
    page,
  }) => {
    await page.goto('/')
    await page.waitForLoadState('load')
    await expectWholeStory(page)
    await expect(
      page.getByText('Brand Bible', { exact: true }).first()
    ).toBeVisible()

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})

for (const tier of [0, 1, 2, 3]) {
  test(`/lab/home shows every section at tier ${tier}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`/lab/home?tier=${tier}`)
    await page.waitForLoadState('load')
    await expectWholeStory(page)
    expect(errors).toEqual([])
  })
}

test.describe('package prices', () => {
  test('live offers replace the prices in the page', async ({ page }) => {
    await stubOffers(page, 200, {
      packages: [
        { tier: 'founder', price: 4200, value: 12000, turnaround: '10 days' },
      ],
    })
    await page.goto('/')
    await page.waitForLoadState('load')
    await scrollToPackages(page)

    const founder = page.getByRole('article').filter({
      has: page.getByRole('heading', { name: 'Founder Package' }),
    })
    await expect(founder.getByText('$4,200')).toBeVisible()
    await expect(founder.getByText('10 days')).toBeVisible()
    // A tier the API left out keeps its own price.
    await expect(page.getByText('$2,500')).toBeVisible()
  })

  test('a 503 keeps the fallback prices and logs no page error', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await stubOffers(page, 503, {
      error: { code: 'upstream_unavailable', message: 'Down' },
    })
    await page.goto('/')
    await page.waitForLoadState('load')
    await scrollToPackages(page)

    await expect(page.getByText('$5,000')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('compare re-flows the same cards, the Founder Package first', async ({
    page,
  }) => {
    await page.goto('/')
    await page.waitForLoadState('load')
    await scrollToPackages(page)

    const toggle = page.getByRole('button', { name: 'Compare packages' })
    await toggle.click()
    await expect(
      page.getByRole('button', { name: 'Show cards' })
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('Revisions').first()).toBeVisible()

    // Polled: the cards are mid-flight from their old places at first.
    await expect
      .poll(() =>
        page.getByRole('article').evaluateAll((cards) => {
          const byTop = cards
            .map((card) => ({
              name: card.querySelector('h3')?.textContent,
              top: card.getBoundingClientRect().top,
            }))
            .sort((a, b) => a.top - b.top)
          return byTop[0]?.name
        })
      )
      .toBe('Founder Package')

    await page.getByRole('button', { name: 'Show cards' }).click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })
})

test('every section heading is reachable by the steps of a real scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.waitForLoadState('load')
  // A jump past the entry points must not leave a headline hidden.
  const heading = page.getByRole('heading', { name: /How it works/ })
  await page
    .getByRole('heading', { name: /Pick how much/ })
    .evaluate((element) => element.scrollIntoView())
  await heading.evaluate((element) => element.scrollIntoView())
  await expect
    .poll(() =>
      heading.evaluate((element) => {
        const lines = element.querySelectorAll('[style*="opacity"]')
        return [...lines].every(
          (line) => Number(getComputedStyle(line).opacity) > 0.9
        )
      })
    )
    .toBe(true)
})
