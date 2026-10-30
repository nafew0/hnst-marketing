import { describe, expect, it } from 'bun:test'

import { parseOklch } from './color'

// The palette keeps the approved hex values in comments; the conversion must
// land on them, or every 3D scene drifts off-brand.

function toSrgb8([r, g, b]: [number, number, number]): [
  number,
  number,
  number,
] {
  const encode = (c: number) =>
    Math.round(
      255 * (c <= 0.003_130_8 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
    )
  return [encode(r), encode(g), encode(b)]
}

describe('parseOklch', () => {
  it('converts the approved gold to its hex value (193, 179, 141)', () => {
    const [r, g, b] = toSrgb8(parseOklch('oklch(0.7689 0.0539 90.21)'))
    expect(Math.abs(r - 193)).toBeLessThanOrEqual(1)
    expect(Math.abs(g - 179)).toBeLessThanOrEqual(1)
    expect(Math.abs(b - 141)).toBeLessThanOrEqual(1)
  })

  it('converts nebula glow to (139, 111, 192)', () => {
    const [r, g, b] = toSrgb8(parseOklch('oklch(0.6026 0.1228 298.59)'))
    expect(Math.abs(r - 139)).toBeLessThanOrEqual(1)
    expect(Math.abs(g - 111)).toBeLessThanOrEqual(1)
    expect(Math.abs(b - 192)).toBeLessThanOrEqual(1)
  })

  it('rejects anything that is not oklch()', () => {
    expect(() => parseOklch('rgb(1, 2, 3)')).toThrow()
  })
})
