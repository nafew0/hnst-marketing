'use client'

import { type ReactNode, useState } from 'react'

import { DeviceTierOverride } from '@/components/motion/device-tier'
import type { DeviceTier } from '@/components/motion/device-tier-rules'

const TIERS: DeviceTier[] = [0, 1, 2, 3]

/** Lab only. `key` remounts the page so each tier starts from a clean load. */
export function TierSwitch({
  initialTier,
  children,
}: {
  initialTier: string | undefined
  children: ReactNode
}) {
  const [tier, setTier] = useState(
    TIERS.find((value) => String(value) === initialTier)
  )

  return (
    <DeviceTierOverride key={tier ?? 'auto'} tier={tier}>
      {children}
      <div
        className="fixed right-gap bottom-gap z-10 flex dr-gap-4 rounded-full bg-void-deep dr-p-4"
        role="group"
        aria-label="Device tier"
      >
        {TIERS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={tier === value}
            className="min-h-[44px] min-w-[44px] rounded-full caption text-starlight aria-pressed:bg-gold aria-pressed:text-void"
            onClick={() => setTier(value)}
          >
            {`T${value}`}
          </button>
        ))}
      </div>
    </DeviceTierOverride>
  )
}
