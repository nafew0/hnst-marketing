import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Phase 1 acceptance that unit tests cannot reach: reduced motion shows no
// movement, the hero's first paint is final-looking text, the mobile drawer
// traps focus, and /lab stays out of search. Owned by Claude (P1); P3/P9
// extend e2e/ around it.

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the homepage runs no animations and shows the final state', async ({
    page,
  }) => {
    await page.goto('/')
    await page.waitForLoadState('load')

    const state = await page.evaluate(() => {
      const lineInner = document.querySelector('h1 span span')
      const lede = document.querySelector('h1 + p')
      return {
        running: document.getAnimations().length,
        lineTransform: lineInner ? getComputedStyle(lineInner).transform : '',
        ledeOpacity: lede ? getComputedStyle(lede).opacity : '',
      }
    })

    expect(state.running).toBe(0)
    expect(state.lineTransform).toBe('none')
    expect(state.ledeOpacity).toBe('1')
  })
})

test('hero text never starts fully transparent (LCP-safe)', async ({
  page,
}) => {
  await page.goto('/')
  // Only animations on elements that hold text: an opacity-0 start would make
  // the first paint not count for LCP. Decorative layers (the flare) may.
  const startOpacities = await page.evaluate(() => {
    const samples: number[] = []
    for (const animation of document.getAnimations()) {
      const effect = animation.effect
      if (
        !(effect instanceof KeyframeEffect) ||
        !(effect.target instanceof Element) ||
        !effect.target.textContent?.trim()
      )
        continue
      if (!effect.getKeyframes().some((frame) => frame.opacity !== undefined))
        continue
      const previousTime = animation.currentTime
      const running = animation.playState === 'running'
      animation.pause()
      animation.currentTime = 0
      samples.push(Number(getComputedStyle(effect.target).opacity))
      animation.currentTime = previousTime
      if (running) animation.play()
    }
    return samples
  })
  expect(startOpacities.length).toBeGreaterThan(0)
  for (const opacity of startOpacities) expect(opacity).toBeGreaterThan(0)
})

test.describe('mobile navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('the drawer traps focus, closes on Escape and restores focus', async ({
    page,
  }) => {
    await page.goto('/')
    const toggle = page.getByRole('button', { name: 'Menu' })
    await toggle.click()

    const drawer = page.getByRole('dialog', { name: 'Menu' })
    await expect(drawer).toBeVisible()

    // Base UI moves focus off its edge guards right after they receive it,
    // so poll until focus settles before asserting where it landed.
    for (let step = 0; step < 12; step++) {
      await page.keyboard.press('Tab')
      await expect
        .poll(() =>
          drawer.evaluate((node) => node.contains(document.activeElement))
        )
        .toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(toggle).toBeFocused()
  })
})

test('/lab is noindex and has no serious accessibility issues', async ({
  page,
}) => {
  await page.goto('/lab')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/
  )
  const results = await new AxeBuilder({ page }).analyze()
  const serious = results.violations.filter(
    (violation) =>
      violation.impact === 'serious' || violation.impact === 'critical'
  )
  expect(serious.map((violation) => violation.id)).toEqual([])
})
