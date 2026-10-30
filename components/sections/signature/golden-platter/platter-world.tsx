'use client'

import type { Timeline } from 'animejs'

import {
  GoldenPlatter,
  type PlatterLabelPoint,
} from '@/components/three/golden-platter'

/** How far right the dish sits on the desktop stage, leaving room for the text. */
const STAGE_OFFSET = 1.55
const STAGE_SCALE = 0.68
const DISH_SCALE = 0.72

export function PlatterWorld({
  onTimeline,
  onLabels,
  progress = 0,
  centred = false,
}: {
  onTimeline?: (timeline: Timeline) => void
  onLabels?: (points: readonly PlatterLabelPoint[]) => void
  /** 0 holds the reveal for scroll to scrub; 1 is the poster's final state. */
  progress?: number
  /** Set for the mobile poster, which shows the dish alone. */
  centred?: boolean
}) {
  return (
    <group
      position={[centred ? 0 : STAGE_OFFSET, 0.1, 0]}
      scale={centred ? DISH_SCALE : STAGE_SCALE}
    >
      <GoldenPlatter
        progress={progress}
        onPlatterTimeline={onTimeline}
        onLabels={onLabels}
      />
    </group>
  )
}
