import type { JSAnimation } from 'animejs'

import { loadAnime } from '@/components/motion/load-anime'
import type { Box } from '@/components/ui/window/genie'

/**
 * An app opens out of its icon and goes home into it, as on iOS. One element,
 * transform and opacity only, with the corners rounded to the icon's as it
 * shrinks. Boxes come from hamo's `useRect` and share one page scroll, so only
 * differences are used. M1 spike; M2 tunes the curve and timing.
 */

const OPEN_MS = 420
const HOME_MS = 340
const ICON_RADIUS = 0.225

let playing: JSAnimation | null = null

interface Path {
  x: number
  y: number
  sx: number
  sy: number
  radius: number
}

function pathOf(frame: Box, icon: Box): Path {
  return {
    x: icon.left - frame.left,
    y: icon.top - frame.top,
    sx: icon.width / frame.width,
    sy: icon.height / frame.height,
    radius: icon.width * ICON_RADIUS,
  }
}

const lerp = (from: number, to: number, amount: number) =>
  from + (to - from) * amount

/** `progress` 0 is the full window, 1 is the icon. */
function draw(element: HTMLElement, path: Path, progress: number) {
  const sx = lerp(1, path.sx, progress)
  const sy = lerp(1, path.sy, progress)
  const { style } = element
  style.transformOrigin = '0 0'
  style.transform = `translate(${path.x * progress}px, ${path.y * progress}px) scale(${sx}, ${sy})`
  // Undo the scale, so the corners match the icon's at the end.
  style.borderRadius = `${(path.radius * progress) / sx}px / ${(path.radius * progress) / sy}px`
  style.opacity = String(lerp(1, 0.2, progress ** 3))
}

export function clearZoom(element: HTMLElement) {
  playing?.cancel()
  playing = null
  for (const property of [
    'transform-origin',
    'transform',
    'border-radius',
    'opacity',
  ])
    element.style.removeProperty(property)
}

async function play(
  element: HTMLElement,
  path: Path,
  from: number,
  to: number,
  duration: number
) {
  // The first frame before anything else: anime.js loads lazily, and the app
  // must not show at full size while it does.
  playing?.cancel()
  draw(element, path, from)
  const { animate } = await loadAnime()
  const proxy = { progress: from }
  // Wrapped: an anime.js animation is a thenable, and a paused one never resolves.
  await new Promise<void>((resolve) => {
    playing = animate(proxy, {
      progress: to,
      duration,
      ease: 'outExpo',
      onUpdate: () => draw(element, path, proxy.progress),
      onComplete: () => resolve(),
    })
  })
  playing = null
}

/** Grows the open app out of its icon. Call before the browser paints it. */
export async function zoomOpen(element: HTMLElement, frame: Box, icon: Box) {
  await play(element, pathOf(frame, icon), 1, 0, OPEN_MS)
  clearZoom(element)
}

/** Shrinks the app into its icon; the caller then really goes home. */
export async function zoomHome(element: HTMLElement, frame: Box, icon: Box) {
  await play(element, pathOf(frame, icon), 0, 1, HOME_MS)
}
