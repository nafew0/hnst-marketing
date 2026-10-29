import { describe, expect, it } from 'bun:test'

import { capabilitiesFor, resolveDeviceTier } from './device-tier-rules'

// Failure modes this guards: a phone getting live WebGL, reduced motion
// getting autoplay, a slow GPU getting bloom, and deciding before the GPU
// benchmark when the answer depends on it.

const desktop = { reducedMotion: false, saveData: false, liveWebGL: true }

describe('resolveDeviceTier', () => {
  it('reduced motion and Save-Data win over everything', () => {
    expect(
      resolveDeviceTier({ ...desktop, reducedMotion: true, gpuTier: 3 })?.tier
    ).toBe(0)
    expect(
      resolveDeviceTier({ ...desktop, saveData: true, gpuTier: 3 })
    ).toEqual({ tier: 0, reason: 'save-data' })
  })

  it('touch or narrow devices never get live WebGL', () => {
    expect(resolveDeviceTier({ ...desktop, liveWebGL: false })).toEqual({
      tier: 1,
      reason: 'no-live-webgl',
    })
  })

  it('waits for the GPU benchmark only when it decides the tier', () => {
    expect(resolveDeviceTier(desktop)).toBeUndefined()
  })

  it('maps GPU tiers and the low-memory mobile rule', () => {
    expect(resolveDeviceTier({ ...desktop, gpuTier: 0 })?.tier).toBe(1)
    expect(resolveDeviceTier({ ...desktop, gpuTier: 1 })?.tier).toBe(1)
    expect(resolveDeviceTier({ ...desktop, gpuTier: 2 })?.tier).toBe(2)
    expect(resolveDeviceTier({ ...desktop, gpuTier: 3 })?.tier).toBe(3)
    expect(
      resolveDeviceTier({
        ...desktop,
        gpuTier: 3,
        gpuIsMobile: true,
        deviceMemory: 4,
      })
    ).toEqual({ tier: 1, reason: 'low-memory' })
  })
})

describe('capabilitiesFor', () => {
  it('only tier 3 gets bloom, only tiers 2+ get live WebGL', () => {
    expect(capabilitiesFor(0, 'reduced-motion')).toMatchObject({
      motionMedia: false,
      liveWebGL: false,
      bloom: false,
      maxDpr: 1,
    })
    expect(capabilitiesFor(1, 'weak-gpu').motionMedia).toBe(true)
    expect(capabilitiesFor(2, 'gpu-tier-2')).toMatchObject({
      liveWebGL: true,
      bloom: false,
    })
    expect(capabilitiesFor(3, 'gpu-tier-3').bloom).toBe(true)
  })
})
