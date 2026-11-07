import { readFile } from 'node:fs/promises'

import AxeBuilder from '@axe-core/playwright'
import type { Locator, Page, Request } from '@playwright/test'
import { expect, test } from '@playwright/test'
import sharp from 'sharp'

/**
 * Camera and the wall post (docs/phases/M7.md), at phone sizes in Chromium and
 * WebKit emulation. The browser's camera is replaced by a canvas stream, so
 * the specs see every getUserMedia call and every track. Skips where the
 * server was built without NEXT_PUBLIC_PHONE_LAYOUT=1, the default until M9.
 * Against the mock API (NEXT_PUBLIC_API_MOCKS=1): the real wall is checked on
 * the local stack, as M7.md asks.
 */

type CameraMode = 'works' | 'refused'

declare global {
  interface Window {
    cameraCalls: number
    cameraStreams: MediaStream[]
    /** The text fields of each wall post, as the page handed them to fetch. */
    wallSent: Record<string, string>[]
  }
}

/** Replaces the camera before the page loads. */
async function stubCamera(page: Page, mode: CameraMode) {
  await page.addInitScript((stubMode: CameraMode) => {
    window.cameraCalls = 0
    window.cameraStreams = []
    window.wallSent = []
    const send = window.fetch.bind(window)
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      value: (input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.body instanceof FormData) {
          const fields: Record<string, string> = {}
          for (const [key, value] of init.body.entries())
            if (typeof value === 'string') fields[key] = value
          window.wallSent.push(fields)
        }
        return send(input, init)
      },
    })
    const getUserMedia = async () => {
      window.cameraCalls += 1
      if (stubMode === 'refused')
        throw new DOMException('Permission denied', 'NotAllowedError')
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 480
      const context = canvas.getContext('2d')
      let hue = 0
      const paint = () => {
        hue = (hue + 7) % 360
        if (!context) return
        context.fillStyle = `oklch(0.6 0.12 ${hue})`
        context.fillRect(0, 0, 640, 480)
      }
      paint()
      setInterval(paint, 60)
      const stream = canvas.captureStream(15)
      window.cameraStreams.push(stream)
      return stream
    }
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })
  }, mode)
}

const windowOf = (page: Page) =>
  page.getByRole('dialog').and(page.locator('[data-window]'))
const sheet = (page: Page, name: string) => page.getByRole('dialog', { name })

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

/** Opens Camera straight from its URL, as a notification or a link would. */
async function openCamera(page: Page) {
  await page.goto('/?app=camera')
  test.skip(
    (await page.locator('[data-phone-home]').count()) === 0,
    'Built without NEXT_PUBLIC_PHONE_LAYOUT=1'
  )
  const turnOn = windowOf(page).getByRole('button', { name: 'Turn on camera' })
  await expect(turnOn).toBeVisible()
  await hydrated(turnOn)
  return turnOn
}

async function cameraCalls(page: Page) {
  return page.evaluate(() => window.cameraCalls)
}

/** Every track the camera ever handed out has ended. */
async function allTracksEnded(page: Page) {
  return page.evaluate(() =>
    window.cameraStreams.every((stream) =>
      stream.getTracks().every((track) => track.readyState === 'ended')
    )
  )
}

async function viewfinderLive(page: Page) {
  await expect
    .poll(() =>
      page
        .getByLabel('Viewfinder')
        .evaluate(
          (video: HTMLVideoElement) => video.readyState >= 2 && !video.paused
        )
    )
    .toBe(true)
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

/** POSTs to the wall endpoint, as the page sent them. */
function wallPosts(page: Page) {
  const posts: Request[] = []
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      new URL(request.url()).pathname === '/api/v1/wall'
    )
      posts.push(request)
  })
  return posts
}

const MAKE = 0x01_0f
const GPS_IFD = 0x88_25

/**
 * The tags in a JPEG's first EXIF directory. Safari's canvas encoder writes a
 * small EXIF block of its own, so the check is that nothing of the source's
 * survives, not that there is no block.
 */
function exifTags(exif: Buffer | undefined) {
  if (!exif) return []
  const tiff = exif.subarray(6)
  const little = tiff.toString('latin1', 0, 2) === 'II'
  const u16 = (at: number) =>
    little ? tiff.readUInt16LE(at) : tiff.readUInt16BE(at)
  const u32 = (at: number) =>
    little ? tiff.readUInt32LE(at) : tiff.readUInt32BE(at)
  const directory = u32(4)
  return Array.from({ length: u16(directory) }, (_, index) =>
    u16(directory + 2 + index * 12)
  )
}

/** A JPEG that carries GPS, as a phone's own camera would write it. */
function photoWithGps() {
  return sharp({
    create: {
      width: 900,
      height: 600,
      channels: 3,
      background: { r: 40, g: 90, b: 160 },
    },
  })
    .jpeg()
    .withExif({
      IFD0: { Make: 'TestPhone' },
      IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '41/1 24/1 12/1' },
    })
    .toBuffer()
}

test.describe('Camera (M7)', () => {
  test.skip(({ isMobile }) => !isMobile, 'Phones only')

  test('starts only on a tap, and its tracks end on going home', async ({
    page,
  }) => {
    await stubCamera(page, 'works')
    const turnOn = await openCamera(page)
    await expect(
      windowOf(page).getByRole('heading', { name: 'Camera' })
    ).toBeAttached()
    expect(await cameraCalls(page)).toBe(0)
    expect(await seriousViolations(page)).toEqual([])

    await turnOn.click()
    await viewfinderLive(page)
    expect(await cameraCalls(page)).toBe(1)
    await expect(
      windowOf(page).getByRole('button', { name: 'Take photo' })
    ).toBeEnabled()
    expect(await seriousViolations(page)).toEqual([])

    await windowOf(page)
      .getByRole('button', { name: 'Home screen', exact: true })
      .click()
    await expect.poll(() => allTracksEnded(page)).toBe(true)
  })

  test('hiding the tab stops the camera, and a tap starts it again', async ({
    page,
  }) => {
    await stubCamera(page, 'works')
    const turnOn = await openCamera(page)
    await turnOn.click()
    await viewfinderLive(page)

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect.poll(() => allTracksEnded(page)).toBe(true)
    await expect(turnOn).toBeVisible()
    expect(await cameraCalls(page)).toBe(1)

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      })
    })
    await turnOn.click()
    await viewfinderLive(page)
    expect(await cameraCalls(page)).toBe(2)
  })

  test('switches between the front and back cameras', async ({ page }) => {
    await stubCamera(page, 'works')
    const turnOn = await openCamera(page)
    await turnOn.click()
    await viewfinderLive(page)
    await windowOf(page).getByRole('button', { name: 'Back camera' }).click()
    await expect(
      windowOf(page).getByRole('button', { name: 'Front camera' })
    ).toBeVisible()
    await viewfinderLive(page)
    // The first stream stopped when the second started.
    expect(
      await page.evaluate(() =>
        window.cameraStreams[0]
          ?.getTracks()
          .every((track) => track.readyState === 'ended')
      )
    ).toBe(true)
  })

  test('a refused camera offers the picker, and the photo leaves without its GPS', async ({
    page,
  }) => {
    await stubCamera(page, 'refused')
    const turnOn = await openCamera(page)
    await turnOn.click()
    await expect(
      windowOf(page).getByText(/Camera access is off/u)
    ).toBeVisible()
    await expect(
      windowOf(page).getByRole('button', { name: 'Try again' })
    ).toBeVisible()

    const picker = page.locator('input[type="file"]')
    await expect(picker).toHaveAttribute('capture', 'user')
    const chooser = page.waitForEvent('filechooser')
    await windowOf(page)
      .getByRole('button', { name: 'Choose a photo instead' })
      .click()
    await (
      await chooser
    ).setFiles({
      name: 'holiday.jpg',
      mimeType: 'image/jpeg',
      buffer: await photoWithGps(),
    })

    const photo = sheet(page, 'Your photo')
    await expect(photo).toBeVisible()
    await expect(
      photo.getByRole('img', { name: 'Your shot in the HONEST frame' })
    ).toBeVisible()
    // The saved file is the shot itself, as Share and the wall post send it.
    const download = page.waitForEvent('download')
    await photo.getByRole('button', { name: 'Save' }).click()
    const saved = await (await download).path()
    const meta = await sharp(await readFile(saved)).metadata()
    expect(meta.format).toBe('jpeg')
    const tags = exifTags(meta.exif)
    expect(tags).not.toContain(GPS_IFD)
    expect(tags).not.toContain(MAKE)
    expect(meta.width).toBe(900)
    expect(meta.height).toBe(600)
  })

  test('takes a photo, saves it, and posts it once with the consent shown', async ({
    page,
  }) => {
    await stubCamera(page, 'works')
    const posts = wallPosts(page)
    const turnOn = await openCamera(page)
    await turnOn.click()
    await viewfinderLive(page)

    await windowOf(page).getByRole('button', { name: 'Take photo' }).click()
    const last = windowOf(page).getByRole('button', { name: 'Your last photo' })
    await expect(last).toBeVisible()
    expect(posts).toHaveLength(0)

    await last.click()
    const photo = sheet(page, 'Your photo')
    await expect(photo).toBeVisible()
    const download = page.waitForEvent('download')
    await photo.getByRole('button', { name: 'Save' }).click()
    expect((await download).suggestedFilename()).toMatch(/^honest-.+\.jpg$/u)
    expect(posts).toHaveLength(0)

    await photo.getByRole('button', { name: 'Post to the wall' }).click()
    const post = sheet(page, 'Post to the HONEST wall')
    const consent = post.getByRole('checkbox').first()
    const adult = post.getByRole('checkbox', { name: 'I’m 18 or over.' })
    await expect(consent).not.toBeChecked()
    await expect(adult).not.toBeChecked()
    expect(await seriousViolations(page)).toEqual([])

    const submit = post.getByRole('button', { name: 'Post to the wall' })
    await submit.click()
    await expect(post.getByRole('alert')).toHaveText(
      /Some details need attention/u
    )
    expect(posts).toHaveLength(0)

    const shown = await consent.evaluate(
      (box) => box.closest('label')?.textContent?.trim() ?? ''
    )
    expect(shown.length).toBeGreaterThan(10)
    await consent.check()
    await adult.check()
    // The mock answers 429 for this name.
    const name = post.getByRole('textbox', {
      name: 'Name or handle (optional)',
    })
    await name.fill('ratelimit')
    await submit.click()
    await expect(post.getByRole('alert')).toHaveText(/Wait a while/u)
    expect(posts).toHaveLength(1)

    await name.fill('Avery')
    await submit.dblclick()
    await expect(post.getByText('Waiting for approval')).toBeVisible()
    expect(posts).toHaveLength(2)

    const [first, second] = posts
    const firstKey = await first?.headerValue('idempotency-key')
    expect(firstKey).toMatch(/^[0-9a-f-]{36}$/u)
    expect(await second?.headerValue('idempotency-key')).toBe(firstKey)

    const sent = await page.evaluate(() => window.wallSent)
    expect(sent).toHaveLength(2)
    expect(sent.at(-1)?.consentText).toBe(shown)
    expect(sent.at(-1)?.adult).toBe('true')
    expect(sent.at(-1)?.displayName).toBe('Avery')

    await expect(
      post.getByRole('textbox', { name: 'Your removal link' })
    ).toHaveValue(/\/wall\/remove#[0-9a-f-]{36}\.[\w-]{32,}$/u)
  })

  test('Photos shows the shot, and posts it from the viewer', async ({
    page,
  }) => {
    await stubCamera(page, 'works')
    await page.goto('/')
    test.skip(
      (await page.locator('[data-phone-home]').count()) === 0,
      'Built without NEXT_PUBLIC_PHONE_LAYOUT=1'
    )
    const unlock = page.getByRole('button', { name: /unlock/u })
    await hydrated(unlock)
    await unlock.click()
    const apps = page.getByRole('navigation', { name: 'Apps' })
    await hydrated(apps.getByRole('link', { name: 'Camera' }))
    await apps.getByRole('link', { name: 'Camera' }).click()
    await windowOf(page).getByRole('button', { name: 'Turn on camera' }).click()
    await viewfinderLive(page)
    await windowOf(page).getByRole('button', { name: 'Take photo' }).click()
    await expect(
      windowOf(page).getByRole('button', { name: 'Your last photo' })
    ).toBeVisible()

    await windowOf(page)
      .getByRole('button', { name: 'Home screen', exact: true })
      .click()
    await page
      .locator('[data-phone-home]')
      .getByRole('link', { name: 'Photos', exact: true })
      .click()
    await windowOf(page)
      .getByRole('button', { name: 'Your shots', exact: true })
      .click()
    const shots = windowOf(page).getByRole('list', { name: 'Your shots' })
    await expect(shots.getByRole('listitem')).toHaveCount(1)
    await shots.getByRole('button').first().click()
    await page.getByRole('button', { name: 'Post to wall' }).click()
    await expect(sheet(page, 'Post to the HONEST wall')).toBeVisible()
  })
})
