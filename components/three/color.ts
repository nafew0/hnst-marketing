import { Color } from 'three'

import { brand, type BrandColor } from '@/brand.config'

/**
 * three.js cannot parse `oklch()`, and every 3D colour must still come from
 * brand.config.ts. This converts the palette's OKLCH strings to linear sRGB,
 * which is what three's materials and our shaders compute in: scenes render
 * linear light into their own target and the composite pass tone-maps and
 * encodes once (see `viewport-renderer.tsx`).
 */

const OKLCH = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/u

/** OKLCH (L 0–1, C, H in degrees) to linear sRGB, clamped to 0–1. */
export function oklchToLinearRgb(
  l: number,
  c: number,
  h: number
): [number, number, number] {
  const hue = (h * Math.PI) / 180
  const a = c * Math.cos(hue)
  const b = c * Math.sin(hue)

  const lp = l + 0.396_337_777_4 * a + 0.215_803_757_3 * b
  const mp = l - 0.105_561_345_8 * a - 0.063_854_172_8 * b
  const sp = l - 0.089_484_177_5 * a - 1.291_485_548 * b
  const l3 = lp ** 3
  const m3 = mp ** 3
  const s3 = sp ** 3

  const clamp = (value: number) => Math.min(1, Math.max(0, value))
  return [
    clamp(4.076_741_662_1 * l3 - 3.307_711_591_3 * m3 + 0.230_969_929_2 * s3),
    clamp(-1.268_438_004_6 * l3 + 2.609_757_401_1 * m3 - 0.341_319_396_5 * s3),
    clamp(-0.004_196_086_3 * l3 - 0.703_418_614_7 * m3 + 1.707_614_701 * s3),
  ]
}

/** Parses `oklch(L C H)` as written in brand.config.ts. */
export function parseOklch(value: string): [number, number, number] {
  const match = OKLCH.exec(value)
  if (!match) throw new Error(`Not an oklch() colour: ${value}`)
  return oklchToLinearRgb(Number(match[1]), Number(match[2]), Number(match[3]))
}

/** A palette colour as a three `Color` in linear sRGB. */
export function brandColor(name: BrandColor): Color {
  const [r, g, b] = parseOklch(brand.palette[name])
  return new Color(r, g, b)
}
