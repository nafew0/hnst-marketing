'use client'

import { useIntersectionObserver } from 'hamo'
import { type ComponentType, useEffect, useState } from 'react'

import { useDeviceTier } from '@/components/motion/device-tier'

/**
 * Loads a section's three.js content only when it can be shown: at a live
 * WebGL tier, once the section is within a viewport of the screen. three.js
 * stays out of the page's initial JavaScript, and shaders compile just before
 * they are needed instead of all at load.
 *
 * `load` must be module-level (React Compiler cannot compile a component that
 * contains `import()`). Pass `enabled={World !== null}` to `ViewportScene`, so
 * the poster stays up until the scene can really draw.
 */
export function useLazyWorld<Props>(load: () => Promise<ComponentType<Props>>) {
  const { state } = useDeviceTier()
  const [setNearRef, near] = useIntersectionObserver({
    rootMargin: '100% 0px',
    once: true,
  })
  const wanted = state?.liveWebGL === true && near?.isIntersecting === true
  const [World, setWorld] = useState<ComponentType<Props> | null>(null)

  useEffect(() => {
    if (!wanted) return
    let cancelled = false
    void load().then((component) => {
      if (!cancelled) setWorld(() => component)
    })
    return () => {
      cancelled = true
    }
  }, [wanted, load])

  return { setNearRef, World: wanted ? World : null }
}
