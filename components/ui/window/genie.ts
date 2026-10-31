import type { JSAnimation } from 'animejs'
import { useRect } from 'hamo'

import { loadAnime } from '@/components/motion/load-anime'

/**
 * The genie: a window funnels down into its dock icon, and back out of it.
 *
 * A page can't be cheaply sliced into strips, so one element gets two changes a
 * frame: `clip-path` draws the funnel with its curved sides, and `transform`
 * squeezes the content into it. Boxes come from hamo's `useRect`, whose numbers
 * all carry the same page scroll, so only differences between them are used.
 */
export interface Box {
  left: number
  top: number
  width: number
  height: number
}

type Measure = () => Box | null

export interface GenieSurface {
  element: HTMLElement
  measure: Measure
  /** Fades as the window leaves. */
  backdrop?: HTMLElement | null
}

const SAMPLES = 24
const OUT_MS = 560
const IN_MS = 460
// Outlasts the window's own close, so the box never flashes back at full size.
const RESET_AFTER_MS = 400

const tiles = new Map<string, Measure>()
let viewport: Measure | null = null
let surface: GenieSurface | null = null
let leaving = false
let playing: JSAnimation | null = null
let resetTimer: ReturnType<typeof setTimeout> | undefined

export function registerTile(href: string, measure: Measure) {
  tiles.set(href, measure)
  return () => {
    tiles.delete(href)
  }
}

export function registerViewport(measure: Measure) {
  viewport = measure
  return () => {
    viewport = null
  }
}

/** The dialog's window, which a restore animates. */
export function registerSurface(next: GenieSurface) {
  surface = next
  return () => {
    surface = null
  }
}

/** Red and Esc wait: the window is already on its way into the dock. */
export function isGenieLeaving() {
  return leaving
}

/** A window pouring back out answers its controls straight away. */
export function stopGenie() {
  playing?.cancel()
  playing = null
  if (surface) clear(surface)
}

/** A measuring ref, and a read that is fresh at the moment of the call. */
export function useMeasure() {
  const [ref, getRect] = useRect({ lazy: true, ignoreSticky: false })
  const measure: Measure = () => {
    getRect().resize?.()
    const { left, top, width, height } = getRect()
    if (
      left === undefined ||
      top === undefined ||
      width === undefined ||
      height === undefined
    )
      return null
    return { left, top, width, height }
  }
  return [ref, measure] as const
}

/** A tier page's window goes to its parent's icon until it has a tile of its own. */
function tileFor(href: string) {
  let path = href
  while (path.length > 1) {
    const tile = tiles.get(path)
    if (tile) return tile
    path = path.slice(0, path.lastIndexOf('/')) || '/'
  }
  return tiles.get('/')
}

const lerp = (from: number, to: number, amount: number) =>
  from + (to - from) * amount
const clamp = (value: number) => Math.min(1, Math.max(0, value))
const smooth = (value: number) => value * value * (3 - 2 * value)

/** Everything relative to the element's own top-left corner. */
interface Path {
  top: number
  bottom: number
  left: number
  right: number
  iconTop: number
  iconBottom: number
  iconLeft: number
  iconRight: number
}

function pathOf(box: Box, icon: Box, view: Box | null): Path {
  const top = view ? Math.max(box.top, view.top) : box.top
  const bottom = view
    ? Math.min(box.top + box.height, view.top + view.height)
    : box.top + box.height
  return {
    top: top - box.top,
    bottom: bottom - box.top,
    left: 0,
    right: box.width,
    iconTop: icon.top - box.top,
    iconBottom: icon.top + icon.height * 0.6 - box.top,
    iconLeft: icon.left - box.left,
    iconRight: icon.left + icon.width - box.left,
  }
}

function draw(target: GenieSurface, path: Path, progress: number) {
  const { top, bottom, left, right } = path
  // The bottom edge reaches the icon first, then the rest pours in after it.
  const funnel = smooth(clamp(progress / 0.5))
  const pour = smooth(clamp((progress - 0.22) / 0.78))
  const pourTop = lerp(top, path.iconTop, pour)
  const pourBottom = lerp(bottom, path.iconBottom, funnel)
  const curve = (y: number) =>
    funnel * smooth(clamp((y - top) / (path.iconTop - top)))
  const leftAt = (y: number) => lerp(left, path.iconLeft, curve(y))
  const rightAt = (y: number) => lerp(right, path.iconRight, curve(y))

  // The content fills the funnel's widest row, which is always the top one.
  const scaleX = Math.max(
    (rightAt(pourTop) - leftAt(pourTop)) / (right - left),
    0.001
  )
  const scaleY = Math.max((pourBottom - pourTop) / (bottom - top), 0.001)
  const shiftX =
    (leftAt(pourTop) + rightAt(pourTop)) / 2 - (scaleX * (left + right)) / 2
  const shiftY = pourTop - scaleY * top

  const leftSide: string[] = []
  const rightSide: string[] = []
  for (let index = 0; index <= SAMPLES; index += 1) {
    const y = lerp(pourTop, pourBottom, index / SAMPLES)
    const localY = ((y - shiftY) / scaleY).toFixed(1)
    leftSide.push(`${((leftAt(y) - shiftX) / scaleX).toFixed(1)}px ${localY}px`)
    rightSide.unshift(
      `${((rightAt(y) - shiftX) / scaleX).toFixed(1)}px ${localY}px`
    )
  }

  const { style } = target.element
  style.transform = `translate(${shiftX}px, ${shiftY}px) scale(${scaleX}, ${scaleY})`
  style.clipPath = `polygon(${[...leftSide, ...rightSide].join(',')})`
  style.opacity = String(clamp((1 - progress) / 0.08))
  if (target.backdrop) target.backdrop.style.opacity = String(1 - pour)
}

function prepare({ element }: GenieSurface) {
  const { style } = element
  style.transition = 'none'
  style.transformOrigin = '0 0'
  style.willChange = 'transform, clip-path'
  style.pointerEvents = 'none'
}

function clear({ element, backdrop }: GenieSurface) {
  const { style } = element
  for (const property of [
    'transition',
    'transform-origin',
    'will-change',
    'pointer-events',
    'transform',
    'clip-path',
    'opacity',
  ])
    style.removeProperty(property)
  backdrop?.style.removeProperty('opacity')
}

async function play(
  target: GenieSurface,
  path: Path,
  from: number,
  to: number,
  duration: number
) {
  const { animate } = await loadAnime()
  const proxy = { progress: from }
  await new Promise<void>((resolve) => {
    playing = animate(proxy, {
      progress: to,
      duration,
      ease: 'linear',
      onUpdate: () => draw(target, path, proxy.progress),
      onComplete: () => resolve(),
    })
  })
}

/** Funnels `target` into `href`'s icon, then calls `done` to really minimise. */
export async function genieOut(
  target: GenieSurface,
  href: string,
  done: () => void
) {
  if (leaving) return
  stopGenie()
  const box = target.measure()
  const icon = tileFor(href)?.()
  if (!box || !icon) {
    done()
    return
  }
  leaving = true
  clearTimeout(resetTimer)
  prepare(target)
  await play(target, pathOf(box, icon, viewport?.() ?? null), 0, 1, OUT_MS)
  leaving = false
  done()
  resetTimer = setTimeout(() => clear(target), RESET_AFTER_MS)
}

async function pour(target: GenieSurface, href: string) {
  const box = target.measure()
  const icon = tileFor(href)?.()
  if (!box || !icon) return
  prepare(target)
  const path = pathOf(box, icon, null)
  draw(target, path, 1)
  await play(target, path, 1, 0, IN_MS)
  clear(target)
}

/**
 * Pours the dialog's window back out of `href`'s icon. Call right after showing
 * it: this hides it again before the browser paints.
 */
export function genieIn(href: string) {
  const target = surface
  if (leaving || !target) return
  clearTimeout(resetTimer)
  clear(target)
  requestAnimationFrame(() => void pour(target, href))
}
