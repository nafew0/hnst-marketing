import { describe, expect, it } from 'bun:test'

import {
  SHOT_ASPECT,
  SHOT_MAX_EDGE,
  coverCrop,
  fitWithin,
  frameGeometry,
} from './frame'

describe('shot sizing', () => {
  it('never makes a side longer than the wall post sends', () => {
    for (const [width, height] of [
      [4032, 3024],
      [3024, 4032],
      [1920, 1440],
      [800, 600],
    ] as const) {
      const size = fitWithin(width, height, SHOT_MAX_EDGE)
      expect(Math.max(size.width, size.height)).toBeLessThanOrEqual(
        SHOT_MAX_EDGE
      )
      expect(size.width / size.height).toBeCloseTo(width / height, 2)
    }
  })

  it('leaves small photos at their size', () => {
    expect(fitWithin(640, 480, SHOT_MAX_EDGE)).toEqual({
      width: 640,
      height: 480,
    })
  })

  it('crops the camera to the viewfinder’s 3:4, centred, from either orientation', () => {
    const landscape = coverCrop(1920, 1080, SHOT_ASPECT)
    expect(landscape.width / landscape.height).toBeCloseTo(SHOT_ASPECT, 5)
    expect(landscape.x).toBeCloseTo((1920 - landscape.width) / 2, 5)
    expect(landscape.y).toBe(0)

    const portrait = coverCrop(1080, 1920, SHOT_ASPECT)
    expect(portrait.width / portrait.height).toBeCloseTo(SHOT_ASPECT, 5)
    expect(portrait.x).toBe(0)
    expect(portrait.y).toBeCloseTo((1920 - portrait.height) / 2, 5)
  })
})

describe('the frame', () => {
  it('scales with the shorter side, so the overlay and the photo match', () => {
    const overlay = frameGeometry(1200, 1600)
    const photo = frameGeometry(1536, 2048)
    const ratio = 1536 / 1200
    expect(photo.inset).toBeCloseTo(overlay.inset * ratio, 5)
    expect(photo.fontSize).toBeCloseTo(overlay.fontSize * ratio, 5)
  })

  it('keeps the label inside the picture', () => {
    const { baseline, fontSize } = frameGeometry(1536, 2048)
    expect(baseline).toBeLessThan(2048)
    expect(baseline - fontSize).toBeGreaterThan(0)
  })
})
