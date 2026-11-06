import AxeBuilder from '@axe-core/playwright'
import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * The phone layout's shell (docs/phases/M1.md, spike; M2 extends it). Runs at
 * phone sizes in Chromium and WebKit emulation. Skips where the server was
 * built without NEXT_PUBLIC_PHONE_LAYOUT=1, which is the default until M9.
 */

const home = (page: Page) => page.locator('[data-phone-home]')
const apps = (page: Page) => page.getByRole('navigation', { name: 'Apps' })
const windowOf = (page: Page) =>
  page.getByRole('dialog').and(page.locator('[data-window]'))
const homeBar = (page: Page) =>
  page.getByRole('button', { name: 'Home screen', exact: true })

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

async function openHome(page: Page) {
  await page.goto('/')
  test.skip(
    (await home(page).count()) === 0,
    'Built without NEXT_PUBLIC_PHONE_LAYOUT=1'
  )
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

test.describe('phone home screen', () => {
  test.skip(({ isMobile }) => !isMobile, 'Phones only')

  test('shows the apps and a four-icon dock over the story', async ({
    page,
  }) => {
    await openHome(page)
    await expect(
      page.getByRole('navigation', { name: 'Dock' }).getByRole('listitem')
    ).toHaveCount(4)
    // Social icons wait for real handles, so seven grid apps show for now.
    await expect(apps(page).getByRole('listitem')).toHaveCount(7)
    await expect(
      page.locator('#main-content > :not([data-phone-home])').first()
    ).toHaveAttribute('inert', '')
    expect(await seriousViolations(page)).toEqual([])
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
    // Scanned here, not on a CMS page: with no database those have nothing
    // focusable, and the window's scroll pane then fails axe (M2 follow-up).
    await expect
      .poll(() =>
        page
          .locator('[data-window]')
          .evaluate((element) => element.style.transform)
      )
      .toBe('')
    expect(await seriousViolations(page)).toEqual([])
    await page.goBack()
    await expect(page).toHaveURL(/\/$/u)
    await expect(windowOf(page)).toBeHidden()
    await expect(page).toHaveTitle('HONEST Marketing')
  })

  test('a phone-only app opens on a direct visit too', async ({ page }) => {
    await page.goto('/?app=camera')
    test.skip(
      (await home(page).count()) === 0,
      'Built without NEXT_PUBLIC_PHONE_LAYOUT=1'
    )
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

  test('a direct visit gets the phone bars, and home keeps the page', async ({
    page,
  }) => {
    await page.goto('/book')
    const back = page.getByRole('link', { name: 'Back' })
    test.skip((await back.count()) === 0, 'Built without the phone layout')
    await expect(back).toBeVisible()
    await expect(page.getByRole('link', { name: 'Close window' })).toBeHidden()
    const indicator = page.getByRole('link', { name: 'Home screen' })
    await hydrated(indicator)
    await indicator.click()
    await expect(page).toHaveURL(/\/$/u)
    await expect(
      apps(page).getByRole('button', { name: 'Calendar: book a call' })
    ).toBeVisible()
  })

  test('with reduced motion an app opens without the zoom', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openHome(page)
    await apps(page).getByRole('link', { name: 'About' }).click()
    await expect(windowOf(page)).toBeVisible()
    expect(
      await page
        .locator('[data-window]')
        .evaluate((element) => element.style.transform)
    ).toBe('')
  })
})

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
})
