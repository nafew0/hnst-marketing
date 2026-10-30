'use client'

import type { ReactNode } from 'react'
import { useRef } from 'react'

import { useDeviceTier } from '@/components/motion/device-tier'
import { useScrollProgress } from '@/components/motion/use-scroll-progress'

import s from './scroll-hairline.module.css'

/**
 * Gold hairline along the top of the viewport, tracking the whole story. Tier 0
 * has no scroll-linked motion, so it doesn't render.
 */
export function ScrollHairline({ children }: { children: ReactNode }) {
  const { state } = useDeviceTier()
  const animated = state?.motionMedia === true
  const lineRef = useRef<HTMLDivElement>(null)
  const setTrackRef = useScrollProgress(
    (progress) => {
      if (lineRef.current) {
        lineRef.current.style.transform = `scaleX(${progress.toFixed(4)})`
      }
    },
    { start: 'top top', end: 'bottom bottom', disabled: !animated }
  )

  return (
    <div ref={setTrackRef} className={s.story}>
      {animated && <div ref={lineRef} className={s.line} aria-hidden="true" />}
      {children}
    </div>
  )
}
