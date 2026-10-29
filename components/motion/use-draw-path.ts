'use client'

import type { JSAnimation } from 'animejs'
import { type RefObject, useEffect } from 'react'

import { brand } from '@/brand.config'
import { usePreferredReducedMotion } from '@/hooks/use-sync-external'

import { loadAnime } from './load-anime'

interface UseDrawPathOptions {
  delay?: number
  duration?: number
  /** Scrub with scroll instead of playing once on entry. */
  scrub?: boolean
}

/**
 * Draws every `[data-draw]` stroke inside the referenced SVG (anime.js
 * `svg.createDrawable`), e.g. the HONEST logo arc. Without JS or under
 * reduced motion the strokes are simply fully drawn.
 */
export function useDrawPath(
  ref: RefObject<SVGSVGElement | null>,
  {
    delay = 0,
    duration = brand.motion.durSlow,
    scrub = false,
  }: UseDrawPathOptions = {}
) {
  const prefersReducedMotion = usePreferredReducedMotion()

  useEffect(() => {
    const svg = ref.current
    if (!svg || prefersReducedMotion) return

    const paths = svg.querySelectorAll<SVGGeometryElement>('[data-draw]')
    if (paths.length === 0) return

    let animation: JSAnimation | undefined
    let cancelled = false

    void loadAnime().then((anime) => {
      if (cancelled) return
      animation = anime.animate(anime.svg.createDrawable(paths), {
        draw: ['0 0', '0 1'],
        duration,
        delay,
        ease: brand.motion.easeInOut,
        autoplay: scrub
          ? anime.onScroll({
              target: svg,
              enter: 'bottom top',
              leave: 'top bottom',
              sync: true,
            })
          : anime.onScroll({ target: svg, enter: 'bottom top' }),
      })
    })

    return () => {
      cancelled = true
      animation?.revert()
    }
  }, [ref, prefersReducedMotion, delay, duration, scrub])
}
