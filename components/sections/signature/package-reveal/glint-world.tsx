'use client'

import { GoldGlintPlane } from '@/components/three/gold-glint-plane'

import type { GlintWorldProps } from './package-card'

/** Slightly over the card's radius (24 of ~500 px), so no gold shows outside. */
const CARD_CORNER = 0.054

export function GlintWorld({
  hoverRef,
  revealRef,
  pointerRef,
}: GlintWorldProps) {
  return (
    <GoldGlintPlane
      hoverRef={hoverRef}
      revealRef={revealRef}
      pointerRef={pointerRef}
      corner={CARD_CORNER}
    />
  )
}
