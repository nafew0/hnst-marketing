'use client'

import type { TextSplitter } from 'animejs'
import { useIntersectionObserver } from 'hamo'
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
 * `onScroll` starts it when the element enters the viewport. It is an observer
 * and not anime's `onScroll`, whose initial state hides the text: a visitor
 * jumping past the entry point (a link, a restored scroll, a pinned section)
 * would be left with an invisible headline.
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
  const [setObserved, entry] = useIntersectionObserver({ once: true })
  const inView = entry?.isIntersecting === true
  const ready = !onScroll || inView

  useEffect(() => {
    if (onScroll) setObserved(ref.current)
  }, [onScroll, ref, setObserved])

  useEffect(() => {
    const element = ref.current
    if (!element || prefersReducedMotion || !ready) return

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
        })
      )
    })

    return () => {
      cancelled = true
      split?.revert()
    }
  }, [ref, prefersReducedMotion, delay, stagger, ready])
}
