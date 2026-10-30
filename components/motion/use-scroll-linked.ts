'use client'

import type { AnimationParams, JSAnimation } from 'animejs'
import { type RefObject, useEffect, useEffectEvent } from 'react'

import { usePreferredReducedMotion } from '@/hooks/use-sync-external'

import { type Anime, loadAnime } from './load-anime'

interface UseScrollLinkedOptions {
  /** Viewport edge first: `'bottom top'` = viewport bottom meets element top. */
  enter?: string
  leave?: string
  /** `true` = 1:1 with scroll; a number (0–1) smooths it. */
  sync?: boolean | number
}

/**
 * `animate(target, params)` scrubbed by scroll through anime.js `onScroll`,
 * fed by Lenis on the Tempus loop. `params` is a function so it can use
 * anime helpers (`stagger`, `utils`). Animate `transform` and `opacity` only.
 * Under reduced motion nothing runs and the element keeps its CSS state, so
 * style the resting (end) state in CSS.
 *
 * ```tsx
 * useScrollLinked(ref, () => ({ y: ['0%', '-20%'], opacity: [1, 0] }))
 * ```
 */
export function useScrollLinked(
  ref: RefObject<HTMLElement | SVGElement | null>,
  params: (anime: Anime) => AnimationParams,
  {
    enter = 'bottom top',
    leave = 'top bottom',
    sync = true,
  }: UseScrollLinkedOptions = {}
) {
  const prefersReducedMotion = usePreferredReducedMotion()
  // Latest `params` without rebuilding the animation on every render.
  const buildParams = useEffectEvent((anime: Anime) => params(anime))

  useEffect(() => {
    const element = ref.current
    if (!element || prefersReducedMotion) return

    let animation: JSAnimation | undefined
    let cancelled = false

    void loadAnime().then((anime) => {
      if (cancelled) return
      animation = anime.animate(element, {
        ...buildParams(anime),
        ease: 'linear',
        autoplay: anime.onScroll({ target: element, enter, leave, sync }),
      })
    })

    return () => {
      cancelled = true
      animation?.revert()
    }
  }, [ref, prefersReducedMotion, enter, leave, sync])
}
