import { brand } from '@/brand.config'

/**
 * What each device may render. Tiers only ever add: a tier-3 device also gets
 * everything tier 1 gets.
 *
 * | Tier | Rule                                                                | Gets                                    |
 * | ---- | ------------------------------------------------------------------- | --------------------------------------- |
 * | 0    | Reduced motion or Save-Data                                         | Static posters, no autoplay, no 3D      |
 * | 1    | No live WebGL (touch-only, < 800px, software GPU), GPU tier ≤ 1, or | Video loops and frame sequences, SVG    |
 * |      | a mobile GPU with ≤ 4 GB memory                                     | emblem, no 3D                           |
 * | 2    | detect-gpu tier 2                                                   | Live 3D, no bloom, DPR ≤ 1.25           |
 * | 3    | detect-gpu tier 3                                                   | Live 3D + bloom, DPR ≤ 1.5              |
 *
 * Tier 1 follows Satus's `isWebGL` gate (lib/webgl/README.md § Device
 * gating): touch-only devices never get live WebGL, even fast phones. Cost:
 * a flagship phone sees the video version of the hero, not the live emblem;
 * in exchange the canvas never fights scroll on touch screens, and Lighthouse
 * (no GPU) measures the light version.
 */

export type DeviceTier = 0 | 1 | 2 | 3

export type DeviceTierReason =
  | 'reduced-motion'
  | 'save-data'
  | 'no-live-webgl'
  | 'weak-gpu'
  | 'low-memory'
  | 'gpu-tier-2'
  | 'gpu-tier-3'
  /** Forced by `<DeviceTierOverride>` (the /lab/3d tier switcher). */
  | 'override'

export interface DeviceTierInput {
  reducedMotion: boolean
  saveData: boolean
  /** Satus `useDeviceDetection().isWebGL`. */
  liveWebGL: boolean
  /** detect-gpu `tier` (0–3). Only needed when `liveWebGL` is true. */
  gpuTier?: number | undefined
  /** detect-gpu `isMobile`. */
  gpuIsMobile?: boolean | undefined
  /** `navigator.deviceMemory` in GB, where the browser exposes it. */
  deviceMemory?: number | undefined
}

export interface DeviceCapabilities {
  tier: DeviceTier
  reason: DeviceTierReason
  /** Autoplaying video loops and scroll-scrubbed frame sequences. */
  motionMedia: boolean
  /** Live three.js scenes in the root canvas. */
  liveWebGL: boolean
  /** Post-processing bloom. */
  bloom: boolean
  /** Device-pixel-ratio ceiling for the canvas. */
  maxDpr: number
}

export function resolveDeviceTier(
  input: DeviceTierInput
): { tier: DeviceTier; reason: DeviceTierReason } | undefined {
  if (input.reducedMotion) return { tier: 0, reason: 'reduced-motion' }
  if (input.saveData) return { tier: 0, reason: 'save-data' }
  if (!input.liveWebGL) return { tier: 1, reason: 'no-live-webgl' }
  // Live WebGL is possible: wait for the GPU benchmark before deciding.
  if (input.gpuTier === undefined) return undefined
  if (input.gpuTier <= 1) return { tier: 1, reason: 'weak-gpu' }
  const lowMemory = input.deviceMemory !== undefined && input.deviceMemory <= 4
  if (input.gpuIsMobile && lowMemory) {
    return { tier: 1, reason: 'low-memory' }
  }
  return input.gpuTier === 2
    ? { tier: 2, reason: 'gpu-tier-2' }
    : { tier: 3, reason: 'gpu-tier-3' }
}

export function capabilitiesFor(
  tier: DeviceTier,
  reason: DeviceTierReason
): DeviceCapabilities {
  return {
    tier,
    reason,
    motionMedia: tier >= 1,
    liveWebGL: tier >= 2,
    bloom: tier === 3,
    maxDpr: maxDprFor(tier),
  }
}

function maxDprFor(tier: DeviceTier) {
  if (tier === 3) return brand.three.maxDprDesktop
  if (tier === 2) return brand.three.maxDprMobile
  return 1
}
