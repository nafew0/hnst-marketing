import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { brand } from '@/brand.config'

/**
 * Mobile Safari and Android Chrome tint the browser chrome from
 * `meta[name="theme-color"]`. It must match the route's theme: a stale value
 * paints a dark toolbar over a light page. The server renders the dark
 * default, and the global <Theme> rewrites the meta after hydration and on
 * every client navigation.
 */

const DARK = brand.themes.dark.primary
const LIGHT = brand.themes.light.primary
// The first route rendered with <Wrapper theme="light">. Satus used /sanity,
// which left with the Sanity integration; P3's legal pages are light.
const LIGHT_ROUTE = '/legal/privacy'

const themeMeta = (page: Page) => page.locator('meta[name="theme-color"]')

test('theme-color meta is the dark theme on load and after client navigation', async ({
  page,
}) => {
  await page.goto('/lab')
  await page.waitForLoadState('load')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(themeMeta(page)).toHaveCount(1)
  await expect(themeMeta(page)).toHaveAttribute('content', DARK)

  // The window marker proves no full reload happened, which would re-render
  // the server default and pass for the wrong reason.
  await page.evaluate(() => {
    Object.assign(window, { __themeColorNoReload: true })
  })
  await page
    .getByRole('banner')
    .getByRole('link', { name: 'HONEST Marketing home' })
    .click()
  await expect(page).toHaveURL('/')
  await expect(themeMeta(page)).toHaveAttribute('content', DARK)
  await expect(themeMeta(page)).toHaveCount(1)
  expect(
    await page.evaluate(() => '__themeColorNoReload' in window),
    'navigation stayed client-side'
  ).toBe(true)
})

test('theme-color meta turns light on a light route', async ({ page }) => {
  test.fixme(
    true,
    `No light-themed route until P3 ships ${LIGHT_ROUTE}; enable this then.`
  )
  await page.goto(LIGHT_ROUTE)
  await page.waitForLoadState('load')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(themeMeta(page)).toHaveAttribute('content', LIGHT)
  await expect(themeMeta(page)).toHaveCount(1)
})
