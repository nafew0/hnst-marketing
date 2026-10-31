import AxeBuilder from '@axe-core/playwright'
import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * The page windows (docs/phases/P7W.md). `/lab/window` is a noindex fixture with
 * a form and a lightbox, so these run without a database. The rest of the table
 * needs the pages themselves, which render a CMS fallback when there is none.
 */

declare global {
  interface Window {
    __clears: number
  }
}

const MAIN_PAGES = [
  '/packages',
  '/how-it-works',
  '/proof',
  '/about',
  '/the-honest-marketer',
  '/book',
  '/contact',
]

const windowOf = (page: Page) => page.getByRole('dialog')
const control = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true })
const closeControl = (page: Page) => windowOf(page).getByLabel('Close window')
const minimiseControl = (page: Page) =>
  windowOf(page).getByLabel('Minimise window')

/** A click before hydration is a full page load, so wait for React to own it. */
async function hydrated(link: Locator) {
  await expect
    .poll(() =>
      link.evaluate((element) =>
        Object.keys(element).some((key) => key.startsWith('__reactProps'))
      )
    )
    .toBe(true)
}

async function clickThrough(link: Locator) {
  await hydrated(link)
  await link.evaluate((element: HTMLElement) => element.click())
}

/** Scripted, so a link in a closed phone menu or a hidden desktop nav still works. */
async function openFromLink(page: Page, href: string) {
  await clickThrough(page.locator(`a[href="${href}"]`).first())
  await expect(page).toHaveURL(new RegExp(`${href}$`, 'u'))
  await expect(windowOf(page)).toBeVisible()
}

async function openFixture(page: Page) {
  await clickThrough(page.locator('a[href="/lab/window"]'))
  await expect(windowOf(page)).toBeVisible()
  await expect(windowOf(page).getByRole('heading')).toHaveText('Window fixture')
}

async function openFixtureFromLab(page: Page) {
  await page.goto('/lab')
  await openFixture(page)
}

for (const from of ['/', '/packages']) {
  for (const href of MAIN_PAGES) {
    if (href === from) continue
    test(`${href} opens as a window from ${from}`, async ({ page }) => {
      await page.goto(href)
      const directTitle = await page.title()
      await page.goto(from)
      await openFromLink(page, href)
      await expect(page).toHaveTitle(directTitle)
      await expect(windowOf(page).locator('h1').first()).toBeVisible()
      // Only one frame, and the page underneath hasn't gone anywhere.
      await expect(page.locator('[data-window]')).toHaveCount(1)
    })
  }
}

test('a link on a 404 still opens a window', async ({ page }) => {
  await page.goto('/this-page-does-not-exist')
  await openFromLink(page, '/packages')
})

test('a link inside a window replaces it, and Back steps through', async ({
  page,
}) => {
  await page.goto('/')
  await openFromLink(page, '/packages')
  const card = windowOf(page).locator('a[href^="/packages/"]').first()
  test.skip((await card.count()) === 0, 'Needs CMS packages')
  const href = await card.getAttribute('href')
  await clickThrough(card)
  await expect(page).toHaveURL(new RegExp(`${href}$`, 'u'))
  await expect(page.locator('[data-window]')).toHaveCount(1)
  await page.goBack()
  await expect(page).toHaveURL(/\/packages$/u)
  await expect(windowOf(page)).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/\/$/u)
  await expect(windowOf(page)).toBeHidden()
})

test('red, Esc and Back return to the same scroll position; clicking outside does nothing', async ({
  page,
}) => {
  await page.goto('/')
  await hydrated(page.locator('footer a').first())
  await page.evaluate(() => window.scrollTo(0, 1200))
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0)
  const scrolled = await page.evaluate(() => window.scrollY)
  const backToBase = async () => {
    await expect(page).toHaveURL(/\/$/u)
    await expect(windowOf(page)).toBeHidden()
    expect(
      Math.abs((await page.evaluate(() => window.scrollY)) - scrolled)
    ).toBeLessThan(5)
  }

  await openFromLink(page, '/contact')
  await closeControl(page).click()
  await backToBase()

  await openFromLink(page, '/contact')
  await page.keyboard.press('Escape')
  await backToBase()

  await openFromLink(page, '/contact')
  await page.goBack()
  await backToBase()

  await openFromLink(page, '/contact')
  await page.mouse.click(4, 4)
  await expect(windowOf(page)).toBeVisible()
  await expect(page).toHaveURL(/\/contact$/u)
})

test('red returns to the first page after moving between windows', async ({
  page,
}) => {
  await page.goto('/')
  await openFromLink(page, '/packages')
  const card = windowOf(page).locator('a[href^="/packages/"]').first()
  test.skip((await card.count()) === 0, 'Needs CMS packages')
  await clickThrough(card)
  await expect(page).toHaveURL(/\/packages\/.+/u)
  await closeControl(page).click()
  await expect(page).toHaveURL(/\/$/u)
  await expect(windowOf(page)).toBeHidden()
})

test('a half-filled form survives minimise and restore, and nothing reaches browser storage', async ({
  page,
}) => {
  await page.goto('/lab')
  await openFixture(page)
  const draft = windowOf(page).locator('input[name="draft"]')
  await draft.fill('half-filled-value')
  const consent = windowOf(page).locator('input[name="consent"]')
  await windowOf(page).getByText('Tick box').click()
  const scroller = windowOf(page).locator('[data-window-scroller]')
  await scroller.evaluate((element) => {
    element.scrollTop = 300
  })

  await minimiseControl(page).click()
  await expect(page).toHaveURL(/\/lab$/u)
  await expect(windowOf(page)).toBeHidden()
  const stored = await page.evaluate(() =>
    JSON.stringify([{ ...localStorage }, { ...sessionStorage }])
  )
  expect(stored).not.toContain('half-filled-value')

  await page.getByRole('button', { name: 'Restore Window fixture' }).click()
  await expect(windowOf(page)).toBeVisible()
  await expect(page).toHaveURL(/\/lab\/window$/u)
  await expect(draft).toHaveValue('half-filled-value')
  await expect(consent).toBeChecked()
  await expect
    .poll(() => scroller.evaluate((element) => element.scrollTop))
    .toBe(300)
})

test('a form that succeeds lands on its thank-you page with the window gone', async ({
  page,
}) => {
  test.skip(!process.env.P6_MOCKS_TESTS, 'Needs the mock API and CMS copy')
  // Production hides the consent banner from bots.
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  )
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Necessary only', exact: true })
    .click()
  await openFromLink(page, '/contact')
  const form = windowOf(page)
  await form
    .getByRole('textbox', { name: 'First name', exact: true })
    .fill('Local tester')
  await form
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('p7w@example.com')
  await form
    .getByRole('button', { name: 'Start the conversation', exact: true })
    .click()
  await expect(page).toHaveURL(/\/thanks\/contact$/u)
  await expect(windowOf(page)).toBeHidden()
})

test('a minimised icon can be dismissed, and holds one per page', async ({
  page,
}) => {
  await page.goto('/lab')
  await openFixture(page)
  await minimiseControl(page).click()
  await expect(windowOf(page)).toBeHidden()
  await openFixture(page)
  await minimiseControl(page).click()
  await expect(
    page.getByRole('button', { name: 'Restore Window fixture' })
  ).toHaveCount(1)
  await page.getByRole('button', { name: 'Dismiss Window fixture' }).click()
  await expect(
    page.getByRole('button', { name: 'Restore Window fixture' })
  ).toHaveCount(0)
})

test('the dock does not cover the privacy control', async ({ page }) => {
  await page.goto('/lab')
  await openFixture(page)
  await minimiseControl(page).click()
  const chip = page.getByRole('button', { name: 'Restore Window fixture' })
  await expect(chip).toBeVisible()
  const privacy = await page
    .getByRole('button', { name: 'Privacy choices' })
    .boundingBox()
  const dock = await page
    .getByRole('navigation', { name: 'Dock' })
    .boundingBox()
  if (!(privacy && dock)) throw new Error('Expected both to be on screen')
  const apart =
    dock.x + dock.width <= privacy.x ||
    dock.y + dock.height <= privacy.y ||
    privacy.y + privacy.height <= dock.y
  expect(apart).toBe(true)
})

test('a lightbox stacks inside the window, and Esc closes only the lightbox', async ({
  page,
}) => {
  await page.goto('/lab')
  await openFixture(page)
  await page.getByRole('button', { name: 'Open lightbox' }).click()
  const lightbox = page.locator('[data-lightbox]')
  await expect(lightbox).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(lightbox).toBeHidden()
  await expect(windowOf(page)).toBeVisible()
  await expect(page).toHaveURL(/\/lab\/window$/u)
  await page.keyboard.press('Escape')
  await expect(windowOf(page)).toBeHidden()
  await expect(page).toHaveURL(/\/lab$/u)
})

test('keyboard: Tab stays in the window and dock, focus returns, and the controls and dock work', async ({
  page,
  isMobile,
  browserName,
}) => {
  test.skip(isMobile, 'Phones have no Tab key')
  await page.goto('/')
  const link = page.locator('footer a[href="/contact"]').first()
  await hydrated(link)
  await link.focus()
  await page.keyboard.press('Enter')
  await expect(windowOf(page)).toBeVisible()
  // Base UI's invisible focus guards take a stop, and the browser passes through
  // `body` as focus wraps round. What matters is that no page element is hit.
  const focused = new Set<string>()
  for (let press = 0; press < 60; press += 1) {
    await page.keyboard.press('Tab')
    focused.add(
      await page.evaluate(() => {
        const element = document.activeElement
        if (element?.closest('[data-window]')) return 'window'
        if (element?.closest('[data-window-dock]')) return 'dock'
        return element?.hasAttribute('data-base-ui-focus-guard')
          ? 'guard'
          : `outside: ${element?.tagName}`
      })
    )
  }
  expect(focused.has('window')).toBe(true)
  // Safari's Tab skips links by default, and most dock icons are links.
  if (browserName === 'chromium') expect(focused.has('dock')).toBe(true)
  expect(
    [...focused].filter(
      (item) => item.startsWith('outside') && item !== 'outside: BODY'
    )
  ).toEqual([])
  // From inside the window: Esc from the dock leaves focus on the dock.
  await windowOf(page).locator('[data-window-scroller]').focus()
  await page.keyboard.press('Escape')
  await expect(windowOf(page)).toBeHidden()
  await expect(link).toBeFocused()

  await link.press('Enter')
  await expect(windowOf(page)).toBeVisible()
  await minimiseControl(page).focus()
  await page.keyboard.press('Enter')
  await expect(windowOf(page)).toBeHidden()
  const chip = page.getByRole('button', { name: /^Restore /u })
  await chip.focus()
  await page.keyboard.press('Enter')
  await expect(windowOf(page)).toBeVisible()
  await control(page, 'Enter full screen').focus()
  await page.keyboard.press('Enter')
  await expect(control(page, 'Exit full screen')).toBeVisible()
  await closeControl(page).focus()
  await page.keyboard.press('Enter')
  await expect(windowOf(page)).toBeHidden()
})

test('green fills the browser, and phones have no green', async ({
  page,
  isMobile,
}) => {
  await page.goto('/')
  await openFromLink(page, '/contact')
  const box = () => windowOf(page).boundingBox()
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('Expected a viewport')
  if (isMobile) {
    await expect(page.getByLabel('Enter full screen')).toBeHidden()
    await expect.poll(async () => (await box())?.width).toBe(viewport.width)
    return
  }
  expect((await box())?.width).toBeLessThan(viewport.width)
  await control(page, 'Enter full screen').click()
  await expect.poll(async () => (await box())?.width).toBe(viewport.width)
  await control(page, 'Exit full screen').click()
  await expect
    .poll(async () => (await box())?.width)
    .toBeLessThan(viewport.width)
})

test('axe finds nothing serious open, full screen or minimised', async ({
  page,
  isMobile,
}) => {
  const scan = async () => {
    // On Safari, Base UI gives its aria-hidden focus guards `role="button"`.
    const { violations } = await new AxeBuilder({ page })
      .exclude('[data-base-ui-focus-guard]')
      .analyze()
    expect(
      violations
        .filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))
        .map((item) => item.id)
    ).toEqual([])
  }
  await page.goto('/')
  await openFromLink(page, '/contact')
  await scan()
  if (!isMobile) {
    await control(page, 'Enter full screen').click()
    await scan()
    await control(page, 'Exit full screen').click()
  }
  await minimiseControl(page).click()
  await expect(windowOf(page)).toBeHidden()
  await scan()
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('nothing animates and everything works', async ({ page }) => {
    await page.goto('/')
    await openFromLink(page, '/contact')
    const running = await page.evaluate(
      () =>
        document
          .querySelector('[data-window]')
          ?.getAnimations({ subtree: false }).length ?? -1
    )
    expect(running).toBe(0)
    await closeControl(page).click()
    await expect(windowOf(page)).toBeHidden()
  })
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('a direct visit renders the whole page in the frame', async ({
    page,
  }) => {
    for (const href of MAIN_PAGES) {
      await page.goto(href)
      await expect(page.locator('header')).toBeVisible()
      await expect(page.getByRole('contentinfo')).toBeVisible()
      await expect(
        page.locator('main [data-window-direct] h1').first()
      ).toBeVisible()
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        new RegExp(`${href}$`, 'u')
      )
      await expect(
        page.locator('script[type="application/ld+json"]').first()
      ).toBeAttached()
      // Red works with no script at all.
      await expect(
        page.getByRole('link', { name: 'Close window' })
      ).toHaveAttribute('href', '/')
    }
  })
})

test('direct visit: red goes home, and yellow goes home with an icon that restores the form', async ({
  page,
}) => {
  await page.goto('/contact')
  await hydrated(page.getByRole('link', { name: 'Close window' }))
  await page.getByRole('link', { name: 'Close window' }).click()
  await expect(page).toHaveURL(/\/$/u)
  await expect(page.getByRole('button', { name: /^Restore /u })).toHaveCount(0)

  await page.goto('/contact')
  const name = page.locator('[data-window-direct] input[name="firstName"]')
  const hasForm = (await name.count()) > 0
  await hydrated(page.getByRole('link', { name: 'Minimise window' }))
  if (hasForm) await name.fill('Half filled')
  await page.getByRole('link', { name: 'Minimise window' }).click()
  await expect(page).toHaveURL(/\/$/u)
  await page.getByRole('button', { name: 'Restore Contact' }).click()
  await expect(page).toHaveURL(/\/contact$/u)
  await expect(windowOf(page)).toBeVisible()
  if (hasForm)
    await expect(windowOf(page).locator('input[name="firstName"]')).toHaveValue(
      'Half filled'
    )
})

test('the consent banner still works with a window open', async ({ page }) => {
  // Production hides the banner from bots.
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  )
  await page.goto('/')
  const banner = page.locator('#cc-main .cm')
  await expect(banner).toBeVisible()
  await openFromLink(page, '/contact')
  await page.locator('#cc-main button[data-role="necessary"]').first().click()
  await expect(banner).toBeHidden()
  await expect(windowOf(page)).toBeVisible()
})

test('the dock switches windows, and the first keeps its form', async ({
  page,
}) => {
  await openFixtureFromLab(page)
  const draft = windowOf(page).locator('input[name="draft"]')
  await draft.fill('kept')
  const dock = page.getByRole('navigation', { name: 'Dock' })
  await dock.getByRole('link', { name: 'Contact', exact: true }).click()
  await expect(page).toHaveURL(/\/contact$/u)
  await expect(page.locator('[data-window]')).toHaveCount(1)
  await dock.getByRole('button', { name: 'Restore Window fixture' }).click()
  await expect(page).toHaveURL(/\/lab\/window$/u)
  await expect(draft).toHaveValue('kept')
  await minimiseControl(page).click()
  await expect(windowOf(page)).toBeHidden()
  await expect(
    dock.getByRole('button', { name: 'Restore Window fixture' })
  ).toBeVisible()
})

test('yellow plays the genie into the icon, and restoring plays it back', async ({
  page,
}) => {
  await page.goto('/lab')
  await openFixture(page)
  await expect
    .poll(() =>
      page.evaluate(() =>
        document.querySelector('[data-window]')?.getAttribute('data-static')
      )
    )
    .toBeNull()
  await page.waitForTimeout(1500)
  await minimiseControl(page).click()
  await expect
    .poll(() =>
      page
        .locator('[data-window]')
        .evaluate((element: HTMLElement) => element.style.clipPath)
    )
    .toContain('polygon')
  await expect(windowOf(page)).toBeHidden()
  await page.getByRole('button', { name: 'Restore Window fixture' }).click()
  await expect(windowOf(page)).toBeVisible()
  await expect
    .poll(() =>
      page
        .locator('[data-window]')
        .evaluate((element: HTMLElement) => element.style.clipPath)
    )
    .toBe('')
  await expect(windowOf(page).getByRole('heading')).toHaveText('Window fixture')
})

test('every page has an icon in the dock, and it opens that page', async ({
  page,
}) => {
  await page.goto('/')
  const dock = page.getByRole('navigation', { name: 'Dock' })
  for (const name of [
    'Home',
    'Packages',
    'How it works',
    'Proof',
    'About',
    'The HONEST Marketer',
    'Contact',
    'Book a call',
  ])
    await expect(dock.getByRole('link', { name, exact: true })).toBeVisible()
  const about = dock.getByRole('link', { name: 'About', exact: true })
  await hydrated(about)
  await about.click()
  await expect(page).toHaveURL(/\/about$/u)
  await expect(windowOf(page)).toBeVisible()
  await dock.getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page).toHaveURL(/\/$/u)
  await expect(windowOf(page)).toBeHidden()
})

test('consent can be changed from inside a window', async ({ page }) => {
  // Production hides the consent UI from bots.
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  )
  await page.goto('/')
  await openFromLink(page, '/contact')
  await windowOf(page).getByRole('button', { name: 'Privacy choices' }).click()
  await expect(page.locator('#cc-main .pm')).toBeVisible()
})

test('the world loop plays inside a window, and stops behind one', async ({
  page,
}) => {
  const playing = (selector: string) =>
    page.locator(selector).evaluate((video: HTMLVideoElement) => !video.paused)
  await page.goto('/how-it-works')
  const direct = '[data-window-direct] video'
  await expect.poll(() => playing(direct)).toBe(true)
  await openFromLink(page, '/contact')
  const inside = '[data-window-scroller][data-active] video'
  await expect.poll(() => playing(inside)).toBe(true)
  await expect.poll(() => playing(direct)).toBe(false)
  await closeControl(page).click()
  await expect.poll(() => playing(direct)).toBe(true)
})

test('the canvas stops drawing behind a window and resumes after', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.__clears = 0
    for (const Context of [
      globalThis.WebGL2RenderingContext,
      globalThis.WebGLRenderingContext,
    ]) {
      if (!Context) continue
      const clear = Context.prototype.clear
      Context.prototype.clear = function (mask: number) {
        window.__clears += 1
        clear.call(this, mask)
      }
    }
  })
  const clears = () => page.evaluate(() => window.__clears)
  await page.goto('/')
  await page.waitForTimeout(2000)
  test.skip((await clears()) === 0, 'The canvas needs a hardware WebGL context')
  await openFromLink(page, '/contact')
  await page.waitForTimeout(500)
  const before = await clears()
  await page.waitForTimeout(1000)
  expect(await clears()).toBe(before)
  await closeControl(page).click()
  await expect(windowOf(page)).toBeHidden()
  await expect.poll(clears).toBeGreaterThan(before)
})
