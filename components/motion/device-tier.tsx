'use client'

import type { TierResult } from 'detect-gpu'
import { createContext, type ReactNode, use, useEffect, useState } from 'react'

import { useAfterLoad } from '@/hooks/use-after-load'
import { useDeviceDetection } from '@/hooks/use-device-detection'

import {
  capabilitiesFor,
  type DeviceCapabilities,
  resolveDeviceTier,
} from './device-tier-rules'

/**
 * detect-gpu's benchmark data, self-hosted (copied from
 * node_modules/detect-gpu/dist/benchmarks): the default fetches it from
 * unpkg.com, a third-party request on every first visit.
 */
const BENCHMARKS_URL = '/gpu-benchmarks'

// One benchmark per session: client navigations remount the provider's
// children, not the module.
let gpuTierPromise: Promise<TierResult> | undefined

function detectGpuTier() {
  gpuTierPromise ??= import('detect-gpu').then(({ getGPUTier }) =>
    getGPUTier({ benchmarksURL: BENCHMARKS_URL })
  )
  return gpuTierPromise
}

interface NavigatorHints {
  connection?: { saveData?: boolean }
  deviceMemory?: number
}

function readNavigatorHints() {
  // SAFETY: Network Information (`connection`) and Device Memory are
  // Chromium-only and absent from the DOM lib types; both fields are read as
  // optional, so a browser without them yields `undefined`.
  const hints = navigator as Navigator & NavigatorHints
  return {
    saveData: hints.connection?.saveData === true,
    deviceMemory: hints.deviceMemory,
  }
}

export interface DeviceTierContextValue {
  /** `undefined` until detection finishes (always on the server). */
  state: DeviceCapabilities | undefined
  meta: { ready: boolean }
}

const DeviceTierContext = createContext<DeviceTierContextValue | null>(null)

/**
 * Decides once per visit how rich the experience may be (see
 * `device-tier-rules.ts`). Mounted in the site layout so the GPU benchmark is
 * not re-run on navigation. Runs after `window.load`: detection creates a
 * WebGL context and may fetch benchmark data, which would otherwise compete
 * with hydration.
 */
export function DeviceTierProvider({ children }: { children: ReactNode }) {
  const loaded = useAfterLoad()
  const { isReducedMotion, isWebGL } = useDeviceDetection()
  const [gpu, setGpu] = useState<TierResult>()

  const hints = loaded ? readNavigatorHints() : undefined
  const decided =
    hints && isReducedMotion !== undefined && isWebGL !== undefined
      ? resolveDeviceTier({
          reducedMotion: isReducedMotion,
          saveData: hints.saveData,
          liveWebGL: isWebGL,
          gpuTier: gpu?.tier,
          gpuIsMobile: gpu?.isMobile,
          deviceMemory: hints.deviceMemory,
        })
      : undefined

  // Only benchmark when the answer depends on it (desktop, live WebGL).
  const needsGpu =
    loaded &&
    isWebGL === true &&
    isReducedMotion === false &&
    hints?.saveData === false
  useEffect(() => {
    if (!needsGpu) return
    let cancelled = false
    void detectGpuTier()
      .then((result) => {
        if (!cancelled) setGpu(result)
      })
      .catch(() => {
        // Benchmark unavailable: treat as a weak GPU (video, no live 3D).
        if (!cancelled) setGpu({ tier: 1, type: 'FALLBACK' })
      })
    return () => {
      cancelled = true
    }
  }, [needsGpu])

  const value: DeviceTierContextValue = {
    state: decided ? capabilitiesFor(decided.tier, decided.reason) : undefined,
    meta: { ready: decided !== undefined },
  }

  return <DeviceTierContext value={value}>{children}</DeviceTierContext>
}

/**
 * `state` is `undefined` while detecting and on the server: render the
 * static version until it resolves, then upgrade.
 *
 * ```tsx
 * const { state } = useDeviceTier()
 * return state?.liveWebGL ? <Emblem3D /> : <EmblemSvg />
 * ```
 */
export function useDeviceTier(): DeviceTierContextValue {
  const context = use(DeviceTierContext)
  if (!context) {
    throw new Error('useDeviceTier must be used within <DeviceTierProvider>')
  }
  return context
}
