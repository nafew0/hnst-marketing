import AxeBuilder from '@axe-core/playwright'
import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * The phone layout's shell (docs/phases/M1.md and M2.md): lock screen, home
 * screen, app frame, notifications. Runs at phone sizes in Chromium and WebKit
 * emulation. Skips where the server was built without
 * NEXT_PUBLIC_PHONE_LAYOUT=1, which is the default until M9.
 */

const home = (page: Page) => page.locator('[data-phone-home]')
const lock = (page: Page) => page.getByRole('region', { name: 'Lock screen' })
const apps = (page: Page) => page.getByRole('navigation', { name: 'Apps' })
const windowOf = (page: Page) =>
  page.getByRole('dialog').and(page.locator('[data-window]'))
const homeBar = (page: Page) =>
  page.getByRole('button', { name: 'Home screen', exact: true })
const banner = (page: Page) =>
  page.getByRole('button', { name: 'Dismiss notification' })

/** A tap before hydration is a full page load, so wait for React to own it. */
async function hydrated(target: Locator) {
  await expect
    .poll(() =>
      target.evaluate((element) =>
        Object.keys(element).some((key) => key.startsWith('__reactProps'))
      )
    )
    .toBe(true)
}

async function skipWithoutPhoneLayout(page: Page) {
  test.skip(
    (await home(page).count()) === 0,
    'Built without NEXT_PUBLIC_PHONE_LAYOUT=1'
  )
}

/** A fresh visit to `/`: the lock screen, then unlocked onto the home screen. */
async function openHome(page: Page) {
  await page.goto('/')
  await skipWithoutPhoneLayout(page)
  const unlock = page.getByRole('button', { name: /unlock/u })
  await hydrated(unlock)
  await unlock.click()
  await expect(apps(page)).toBeVisible()
  await hydrated(apps(page).getByRole('link', { name: 'Packages' }))
}

async function seriousViolations(page: Page) {
  // On Safari, Base UI gives its aria-hidden focus guards `role="button"`.
  const { violations } = await new AxeBuilder({ page })
    .exclude('[data-base-ui-focus-guard]')
    .analyze()
  return violations
    .filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))
    .map((item) => item.id)
}

/** The zoom out of an icon has finished. */
async function settled(page: Page) {
  await expect
    .poll(() =>
      page
        .locator('[data-window]')
        .evaluate((element) => element.style.transform)
    )
    .toBe('')
}

test.describe('phone lock screen', () => {
  test.skip(({ isMobile }) => !isMobile, 'Phones only')

  test('shows once a session, with the date, time and first notifications', async ({
    page,
  }) => {
    await page.goto('/')
    await skipWithoutPhoneLayout(page)
    await expect(lock(page)).toBeVisible()
    await expect(lock(page).getByText(/\d:\d\d/u)).toBeVisible()
    const cards = lock(page).getByRole('list', { name: 'Notifications' })
    await expect(cards.getByRole('button')).toHaveCount(2)
    expect(await seriousViolations(page)).toEqual([])

    const unlock = page.getByRole('button', { name: /unlock/u })
    await hydrated(unlock)
    await unlock.click()
    await expect(lock(page)).toBeHidden()
    await expect(apps(page)).toBeVisible()

    await page.reload()
    await expect(apps(page)).toBeVisible()
    await expect(lock(page)).toBeHidden()
  })

  test('a swipe up unlocks, and a card opens its app', async ({ page }) => {
    await page.goto('/')
    await skipWithoutPhoneLayout(page)
    const unlock = page.getByRole('button', { name: /unlock/u })
    await hydrated(unlock)
    const viewport = page.viewportSize()
    if (!viewport) throw new Error('Expected a viewport')
    const x = viewport.width / 2
    await page.mouse.move(x, viewport.height * 0.6)
    await page.mouse.down()
    await page.mouse.move(x, viewport.height * 0.3, { steps: 8 })
    await page.mouse.up()
    await expect(lock(page)).toBeHidden()

    await page.evaluate(() => sessionStorage.clear())
    await page.reload()
    const card = lock(page).getByRole('button', { name: /Discovery call/u })
    await hydrated(card)
    await card.click()
    await expect(page).toHaveURL(/\/book$/u)
    // Calendar is open: as a window, or as a direct visit when the dev server
    // answers the route late and Next loads the page in full.
    await expect(
      page
        .getByRole('dialog', { name: 'Book a call' })
        .or(page.locator('[data-window-direct]'))
    ).toBeVisible()
  })

  test('a visit that starts on another page never sees it', async ({
    page,
  }) => {
    await page.goto('/book')
    const back = page.getByRole('link', { name: 'Back' })
    test.skip((await back.count()) === 0, 'Built without the phone layout')
    await hydrated(back)
    await back.click()
    await expect(page).toHaveURL(/\/$/u)
    await expect(apps(page)).toBeVisible()
    await expect(lock(page)).toBeHidden()
  })
})

test.describe('phone home screen', () => {
  test.skip(({ isMobile }) => !isMobile, 'Phones only')

  test('shows widgets, the apps and a four-icon dock over the story', async ({
    page,
  }) => {
    await openHome(page)
    await expect(
      page.getByRole('navigation', { name: 'Dock' }).getByRole('listitem')
    ).toHaveCount(4)
    // Two widgets and fifteen apps, five of them HONEST's social profiles.
    await expect(apps(page).getByRole('listitem')).toHaveCount(17)
    await expect(
      page.getByRole('button', {
        name: /next free call.*\d/iu,
      })
    ).toBeVisible()
    await expect(
      page.locator('#main-content > :not([data-phone-home])').first()
    ).toHaveAttribute('inert', '')
    expect(await seriousViolations(page)).toEqual([])
  })

  test('social apps open the network in a new tab; the dock calls, texts and emails HONEST', async ({
    page,
  }) => {
    await openHome(page)
    for (const [name, host] of [
      ['Instagram', /^https:\/\/(www\.)?instagram\.com\//u],
      ['X', /^https:\/\/(www\.)?(x|twitter)\.com\//u],
      ['YouTube', /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//u],
      ['TikTok', /^https:\/\/(www\.)?tiktok\.com\//u],
      ['LinkedIn', /^https:\/\/([a-z]+\.)?linkedin\.com\//u],
    ] as const) {
      const link = apps(page).getByRole('link', {
        name: `HONEST on ${name} (opens in a new tab)`,
      })
      await expect(link).toHaveAttribute('href', host)
      await expect(link).toHaveAttribute('target', '_blank')
      // The network's own logo, not a redrawn one.
      await expect(link.locator('img')).toHaveAttribute('src', /social/u)
    }
    const dock = page.getByRole('navigation', { name: 'Dock' })
    await expect(
      dock.getByRole('link', { name: /^Call HONEST: \+\d+$/u })
    ).toHaveAttribute('href', /^tel:\+\d+$/u)
    await expect(
      dock.getByRole('link', { name: /^Text HONEST: \+\d+$/u })
    ).toHaveAttribute('href', /^sms:\+\d+$/u)
    await expect(
      dock.getByRole('link', { name: /^Email HONEST: \S+@\S+$/u })
    ).toHaveAttribute('href', /^mailto:\S+@\S+$/u)
    await expect(
      dock.getByRole('button', { name: 'Classic website' })
    ).toBeVisible()
  })

  test('an app opens, goes home kept as it was, and comes back', async ({
    page,
  }) => {
    await openHome(page)
    await apps(page).getByRole('link', { name: 'Packages' }).click()
    await expect(page).toHaveURL(/\/packages$/u)
    await expect(windowOf(page)).toBeVisible()
    await expect(
      windowOf(page).getByRole('button', { name: 'Back' })
    ).toBeVisible()
    await expect(page.getByLabel('Close window')).toBeHidden()

    await windowOf(page).getByRole('button', { name: 'Home screen' }).click()
    await expect(page).toHaveURL(/\/$/u)
    await expect(windowOf(page)).toBeHidden()
    const restore = apps(page).getByRole('button', { name: 'Packages' })
    await expect(restore).toBeVisible()
    await restore.click()
    await expect(page).toHaveURL(/\/packages$/u)
    await expect(windowOf(page)).toBeVisible()
  })

  test('the next-call widget opens Calendar', async ({ page }) => {
    await openHome(page)
    await page.getByRole('button', { name: /next free call/iu }).click()
    await expect(page).toHaveURL(/\/book$/u)
    await expect(windowOf(page)).toBeVisible()
  })

  test('Add to Home Screen shows the steps when there is no prompt', async ({
    page,
  }) => {
    await openHome(page)
    await apps(page)
      .getByRole('button', { name: /Add to Home Screen/u })
      .click()
    const sheet = page.getByRole('dialog', { name: 'Add to Home Screen' })
    await expect(sheet).toBeVisible()
    await expect(sheet.getByRole('listitem').first()).toBeVisible()
    await sheet.getByRole('button', { name: 'Done' }).click()
    await expect(sheet).toBeHidden()
  })

  test('Back at an app’s first page goes home', async ({ page }) => {
    await openHome(page)
    await apps(page).getByRole('link', { name: 'About' }).click()
    await expect(windowOf(page)).toBeVisible()
    await windowOf(page).getByRole('button', { name: 'Back' }).click()
    await expect(page).toHaveURL(/\/$/u)
    await expect(windowOf(page)).toBeHidden()
  })

  test('a phone-only app opens at ?app= and the browser’s Back closes it', async ({
    page,
  }) => {
    await openHome(page)
    await apps(page).getByRole('link', { name: 'Camera' }).click()
    await expect(page).toHaveURL(/\/\?app=camera$/u)
    await expect(page).toHaveTitle(/^Camera \|/u)
    await expect(
      windowOf(page).getByRole('heading', { name: 'Camera' })
    ).toBeVisible()
    await settled(page)
    expect(await seriousViolations(page)).toEqual([])
    await page.goBack()
    await expect(page).toHaveURL(/\/$/u)
    await expect(windowOf(page)).toBeHidden()
    await expect(page).toHaveTitle('HONEST Marketing')
  })

  test('a phone-only app opens on a direct visit too', async ({ page }) => {
    await page.goto('/?app=camera')
    await skipWithoutPhoneLayout(page)
    await expect(
      windowOf(page).getByRole('heading', { name: 'Camera' })
    ).toBeVisible()
    await windowOf(page).getByRole('button', { name: 'Home screen' }).click()
    await expect(page).toHaveURL(/\/$/u)
    await expect(apps(page)).toBeVisible()
  })

  test('HONEST opens the story, and the home bar returns', async ({ page }) => {
    await openHome(page)
    await page.getByRole('button', { name: 'HONEST', exact: true }).click()
    await expect(apps(page)).toBeHidden()
    await expect(
      page.locator('#main-content > :not([data-phone-home])').first()
    ).not.toHaveAttribute('inert', '')
    await homeBar(page).click()
    await expect(apps(page)).toBeVisible()
  })

  test('a direct visit is a full-screen app, and home keeps the page', async ({
    page,
  }) => {
    await page.goto('/book')
    const back = page.getByRole('link', { name: 'Back' })
    test.skip((await back.count()) === 0, 'Built without the phone layout')
    await expect(back).toBeVisible()
    await expect(page.getByRole('link', { name: 'Close window' })).toBeHidden()
    await expect(
      page
        .locator('[data-window-direct]')
        .getByRole('button', { name: 'Privacy choices' })
    ).toBeVisible()
    const indicator = page.getByRole('link', { name: 'Home screen' })
    await hydrated(indicator)
    await indicator.click()
    await expect(page).toHaveURL(/\/$/u)
    await expect(
      apps(page).getByRole('button', { name: 'Calendar: book a call' })
    ).toBeVisible()
  })

  test('with reduced motion: no zoom and no wallpaper video', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openHome(page)
    await expect(home(page).locator('video')).toHaveCount(0)
    await apps(page).getByRole('link', { name: 'About' }).click()
    await expect(windowOf(page)).toBeVisible()
    expect(
      await page
        .locator('[data-window]')
        .evaluate((element) => element.style.transform)
    ).toBe('')
  })
})

test.describe('phone notifications', () => {
  test.skip(({ isMobile }) => !isMobile, 'Phones only')

  const fire = (page: Page, trigger: string) =>
    page.getByRole('button', { name: `notify('${trigger}')` }).click()

  async function openLab(page: Page) {
    await page.goto('/lab/phone')
    await hydrated(page.getByRole('button', { name: "notify('home-idle')" }))
    test.skip(
      (await page.locator('[data-phone-announcer]').count()) === 0,
      'Built without the phone layout'
    )
  }

  test('at most three banners a visit, each trigger once, all in the centre', async ({
    page,
  }) => {
    await openLab(page)
    for (const trigger of ['home-idle', 'left-packages', 'photo-taken']) {
      await fire(page, trigger)
      await expect(banner(page)).toBeVisible()
      await banner(page).click()
      await expect(banner(page)).toBeHidden()
    }
    // A fourth trigger, and a repeat, reach the centre without a banner.
    await fire(page, 'wall-sent')
    await fire(page, 'home-idle')
    await expect(banner(page)).toBeHidden()

    await page
      .getByRole('button', { name: 'Open the Notification Centre' })
      .click()
    const centre = page.getByRole('dialog', { name: 'Notifications' })
    await expect(centre).toBeVisible()
    await expect(centre.getByRole('listitem')).toHaveCount(4)
    expect(await seriousViolations(page)).toEqual([])
    await centre.getByRole('button', { name: 'Clear' }).click()
    await expect(centre.getByText('No notifications')).toBeVisible()
  })

  test('never a banner while the visitor is typing', async ({ page }) => {
    await openLab(page)
    const field = page.getByRole('textbox', { name: /Type here/u })
    await field.focus()
    // Clicked by script, so focus stays in the field as it would mid-typing.
    await page
      .getByRole('button', { name: "notify('photo-taken')" })
      .evaluate((button: HTMLElement) => button.click())
    await expect(field).toBeFocused()
    await expect(banner(page)).toBeHidden()
  })

  test('a banner is announced, and tapping it opens its app', async ({
    page,
  }) => {
    await openLab(page)
    await fire(page, 'left-packages')
    await expect(page.locator('[data-phone-announcer]')).toContainText(
      'Questions about a package?'
    )
    await page
      .getByRole('button', {
        name: /Questions about a package\?/u,
      })
      .click()
    await expect(page).toHaveURL(/\/book$/u)
  })
})

for (const width of [375, 390, 430]) {
  test.describe(`phone at ${width} px`, () => {
    test.skip(({ isMobile }) => !isMobile, 'Phones only')
    test.use({ viewport: { width, height: 844 } })

    test('lock screen, home, each app, home', async ({ page }) => {
      await openHome(page)
      const every = [
        ['Camera', 'Camera'],
        ['Notes', 'Notes'],
        ['Packages', 'Packages'],
        ['How it works', 'How it works'],
        ['About', 'About'],
        ['The HONEST Marketer', 'The HONEST Marketer'],
        ['Photos', 'Photos'],
      ] as const
      for (const [name, heading] of every) {
        await home(page).getByRole('link', { name, exact: true }).click()
        await expect(
          windowOf(page).getByRole('heading', { level: 1, name: heading })
        ).toBeVisible()
        await windowOf(page)
          .getByRole('button', { name: 'Home screen' })
          .click()
        await expect(page).toHaveURL(/\/$/u)
        await expect(apps(page)).toBeVisible()
      }
    })
  })
}

test.describe('phone layout without JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  test.skip(({ isMobile }) => !isMobile, 'Phones only')

  test('the story reads as before, and app pages are complete', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(home(page)).toBeHidden()
    await expect(page.locator('#main-content h1').first()).toBeVisible()
    await page.goto('/book')
    await expect(page.locator('main h1')).toBeVisible()
  })
})

test('a computer never sees the phone layout', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Computers only')
  await page.goto('/')
  await expect(home(page)).toBeHidden()
  await expect(page.getByRole('navigation', { name: 'Dock' })).toBeVisible()
  await expect(lock(page)).toBeHidden()
})

test.describe('phone apps (M5)', () => {
  test.skip(({ isMobile }) => !isMobile, 'Phones only')

  const app = (page: Page, name: string) =>
    home(page).getByRole('link', { name, exact: true })
  const sheet = (page: Page, name: string) => page.getByRole('dialog', { name })

  async function openApp(page: Page, name: string, heading: string) {
    await openHome(page)
    await app(page, name).click()
    await expect(windowOf(page)).toBeVisible()
    await expect(
      windowOf(page).getByRole('heading', { level: 1, name: heading })
    ).toBeVisible()
    await settled(page)
  }

  test('Packages is a store with the same prices as /packages, and no ratings', async ({
    page,
  }) => {
    await openApp(page, 'Packages', 'Packages')
    const store = windowOf(page).getByRole('list', { name: 'All packages' })
    // The mock offers (lib/contracts/mocks/fixtures.ts), as the cards show them.
    await expect(store.getByRole('button', { name: /options$/u })).toHaveText([
      '$500',
      '$2,500',
      '$5,000',
      'from $25,000',
    ])
    await expect(windowOf(page)).not.toContainText(/rating|review|★/iu)
    expect(await seriousViolations(page)).toEqual([])

    await store
      .getByRole('button', { name: /Founder Package options/u })
      .click()
    const options = sheet(page, 'Founder Package')
    await expect(options).toBeVisible()
    await expect(
      options.getByRole('link', { name: 'Book a call about this' })
    ).toHaveAttribute('href', '/book?package=founder')
    await expect(
      options.getByRole('textbox', { name: 'Email', exact: true })
    ).toBeVisible()
    await options.getByRole('button', { name: 'Done' }).click()
    await expect(options).toBeHidden()

    await store.getByRole('link', { name: /Founder Package/u }).click()
    await expect(page).toHaveURL(/\/packages\/founder$/u)
    const detail = windowOf(page)
    await expect(
      detail.getByRole('heading', { name: 'Information' })
    ).toBeVisible()
    await expect(
      detail.getByRole('button', { name: /Founder Package options/u })
    ).toHaveText('$5,000')
  })

  test('How it works opens each step in a sheet', async ({ page }) => {
    await openApp(page, 'How it works', 'How it works')
    const first = windowOf(page).getByRole('button', {
      name: 'Answer the questions',
    })
    await first.click()
    const step = sheet(page, 'Answer the questions')
    await expect(step).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(step).toBeHidden()
    await expect(windowOf(page)).toBeVisible()
  })

  test('About shows the CMS’s people and timeline', async ({ page }) => {
    await openApp(page, 'About', 'About')
    await expect(windowOf(page).getByRole('article')).not.toHaveCount(0)
    await expect(
      windowOf(page).getByRole('heading', { name: 'How we got here' })
    ).toBeVisible()
    expect(await seriousViolations(page)).toEqual([])
  })

  test('The HONEST Marketer offers the book in a sheet', async ({ page }) => {
    await openApp(page, 'The HONEST Marketer', 'The HONEST Marketer')
    await windowOf(page).getByRole('button', { name: 'Get the book' }).click()
    const form = sheet(page, 'Get the book')
    await expect(form).toBeVisible()
    await expect(
      form.getByRole('textbox', { name: 'Email', exact: true })
    ).toBeVisible()
  })

  test('Photos: albums, the viewer by keyboard, and reporting a wall photo', async ({
    page,
  }) => {
    await openApp(page, 'Photos', 'Photos')
    const proof = windowOf(page).getByRole('list', { name: 'Proof' })
    await expect(proof.getByRole('listitem')).toHaveCount(6)
    expect(await seriousViolations(page)).toEqual([])
    await proof.getByRole('button').first().click()
    const viewer = page.getByRole('dialog', { name: /Notion/u })
    await expect(viewer).toBeVisible()
    await expect(viewer.getByText('1 of 6')).toBeVisible()
    // Keys go where focus is: wait for it to move into the viewer.
    await expect(viewer.locator(':focus')).toHaveCount(1)
    await page.keyboard.press('ArrowRight')
    await expect(page.getByText('2 of 6')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByText('2 of 6')).toBeHidden()
    await expect(windowOf(page)).toBeVisible()

    await windowOf(page)
      .getByRole('button', { name: 'Wall', exact: true })
      .click()
    await expect(
      windowOf(page).getByText('Visitors’ photos. Not clients or endorsements.')
    ).toBeVisible()
    const wall = windowOf(page).getByRole('list', { name: 'Wall' })
    await expect(wall.getByRole('listitem')).toHaveCount(30)
    await windowOf(page).getByRole('button', { name: 'Load more' }).click()
    await expect(wall.getByRole('listitem')).toHaveCount(36)
    await wall.getByRole('button').first().click()
    await page.getByRole('button', { name: 'Report' }).click()
    await expect(
      page.getByRole('status').filter({ hasText: 'Reported' })
    ).toBeVisible()
    await page.keyboard.press('Escape')

    await windowOf(page)
      .getByRole('button', { name: 'Worlds', exact: true })
      .click()
    await expect(
      windowOf(page).getByRole('list', { name: 'Worlds' }).getByRole('listitem')
    ).toHaveCount(12)
    await windowOf(page)
      .getByRole('button', { name: 'Your shots', exact: true })
      .click()
    await expect(windowOf(page).getByText('No photos yet')).toBeVisible()
  })

  test('the classic website: today’s pages, an address bar, and back home', async ({
    page,
  }) => {
    await openHome(page)
    await home(page).getByRole('button', { name: 'Classic website' }).click()
    await expect(apps(page)).toBeHidden()
    const back = page.getByRole('button', { name: 'Home screen', exact: true })
    await expect(back).toBeVisible()
    await expect(page.getByText(/Address:/u)).toBeAttached()
    await expect(page.getByRole('navigation', { name: 'Dock' })).toBeVisible()

    await page.reload()
    await expect(apps(page)).toBeHidden()
    await expect(back).toBeVisible()

    await back.click()
    await expect(apps(page)).toBeVisible()
    await expect(page.getByText(/Address:/u)).toBeHidden()
  })

  test('content pages keep their own metadata', async ({ page }) => {
    await page.goto('/packages')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/packages$/u
    )
    // The CMS's own SEO title, as before the phone layout.
    await expect(page).toHaveTitle(/\| HONEST Marketing$/u)
  })
})
