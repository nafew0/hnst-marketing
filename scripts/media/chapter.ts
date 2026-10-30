import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

/** Scroll-film frames. A chapter over either budget fails before publish. */
export const DESKTOP_FRAME_BUDGET = 8 * 1024 * 1024
export const MOBILE_FRAME_BUDGET = 4 * 1024 * 1024

export interface FrameBudgets {
  desktop: number
  mobile: number
}

export interface ChapterBytes {
  desktop: number
  mobile: number
  poster: number
}

export interface ChapterManifest {
  chapter: string
  fps: number
  frames: number
  desktop: string[]
  mobile: string[]
  poster: string
  bytes: ChapterBytes
}

export function assertWithinBudget(
  bytes: { desktop: number; mobile: number },
  limits: FrameBudgets = {
    desktop: DESKTOP_FRAME_BUDGET,
    mobile: MOBILE_FRAME_BUDGET,
  }
): void {
  if (bytes.desktop > limits.desktop) {
    throw new Error(
      `Desktop frames are ${bytes.desktop} bytes; the budget is ${limits.desktop}.`
    )
  }
  if (bytes.mobile > limits.mobile) {
    throw new Error(
      `Mobile frames are ${bytes.mobile} bytes; the budget is ${limits.mobile}.`
    )
  }
}

async function sumBytes(dir: string, names: string[]): Promise<number> {
  let total = 0
  for (const name of names) {
    const info = await stat(path.join(dir, name))
    total += info.size
  }
  return total
}

export async function buildManifest(
  root: string,
  chapter: string,
  urlFor: (relative: string) => string,
  limits?: FrameBudgets
): Promise<ChapterManifest> {
  const dir = path.join(root, chapter)
  const names = await readdir(dir)
  const desktop = names.filter((name) => /^d_\d{4}\.webp$/u.test(name)).sort()
  const mobile = names.filter((name) => /^m_\d{4}\.webp$/u.test(name)).sort()
  if (desktop.length === 0) throw new Error(`No desktop frames for ${chapter}.`)
  if (mobile.length === 0) throw new Error(`No mobile frames for ${chapter}.`)
  if (desktop.length !== mobile.length) {
    throw new Error(
      `${chapter} has ${desktop.length} desktop frames and ${mobile.length} mobile frames.`
    )
  }
  if (!names.includes('poster.webp'))
    throw new Error(`No poster for ${chapter}.`)

  const desktopBytes = await sumBytes(dir, desktop)
  const mobileBytes = await sumBytes(dir, mobile)
  const posterBytes = (await stat(path.join(dir, 'poster.webp'))).size
  const measured = { desktop: desktopBytes, mobile: mobileBytes }
  if (limits) assertWithinBudget(measured, limits)
  else assertWithinBudget(measured)

  return {
    chapter,
    fps: 12,
    frames: desktop.length,
    desktop: desktop.map((name) => urlFor(`${chapter}/${name}`)),
    mobile: mobile.map((name) => urlFor(`${chapter}/${name}`)),
    poster: urlFor(`${chapter}/poster.webp`),
    bytes: { desktop: desktopBytes, mobile: mobileBytes, poster: posterBytes },
  }
}
