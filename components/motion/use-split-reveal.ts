'use client'

import type { TextSplitter } from 'animejs'
import { type RefObject, useEffect } from 'react'

import { brand } from '@/brand.config'
import { usePreferredReducedMotion } from '@/hooks/use-sync-external'

import { loadAnime } from './load-anime'

interface UseSplitRevealOptions {
  /** Delay before the first line, ms. */
  delay?: number
  /** Gap between lines, ms. */
  stagger?: number
  /** Start when the element enters the viewport instead of on mount. */
  onScroll?: boolean
}

/**
 * Headline entrance: `splitText` into lines, each line rises out of a clip
 * mask. The text is server-rendered and readable before anime.js arrives;
 * the split happens after load, so it never delays LCP.
 *
 * Reduced motion: no split, no movement; the text simply stays visible.
 * Static after mount: remount with a `key` to change the text.
 */
export function useSplitReveal(
  ref: RefObject<HTMLElement | null>,
  {
    delay = 0,
    stagger = brand.motion.stagger,
    onScroll = false,
  }: UseSplitRevealOptions = {}
) {
  const prefersReducedMotion = usePreferredReducedMotion()

  useEffect(() => {
    const element = ref.current
    if (!element || prefersReducedMotion) return

    let split: TextSplitter | undefined
    let cancelled = false

    void loadAnime().then((anime) => {
      if (cancelled) return
      split = anime.splitText(element, {
        lines: { wrap: 'clip' },
        accessible: true,
      })
      // Re-runs after a resize re-split; revert() undoes it all.
      split.addEffect(({ lines }) =>
        anime.animate(lines, {
          y: ['105%', '0%'],
          opacity: [0, 1],
          duration: brand.motion.durSlow,
          ease: brand.motion.ease,
          delay: anime.stagger(stagger, { start: delay }),
          autoplay: onScroll
            ? anime.onScroll({ target: element, enter: 'bottom top' })
            : true,
        })
      )
    })

    return () => {
      cancelled = true
      split?.revert()
    }
  }, [ref, prefersReducedMotion, delay, stagger, onScroll])
}
