'use client'

import { useScrollTrigger } from 'hamo'

/** `'<element edge> <viewport edge>'`, edges `top | center | bottom | <px>`. */
type TriggerEdges = NonNullable<
  NonNullable<Parameters<typeof useScrollTrigger>[0]>['start']
>

interface UseScrollProgressOptions {
  /**
   * When progress is 0, element edge first: `'top bottom'` = the element's top
   * meets the viewport's bottom (it starts entering).
   */
  start?: TriggerEdges
  /** When progress is 1. `'bottom top'` = the element has fully left. */
  end?: TriggerEdges
  disabled?: boolean
}

/**
 * Calls `onProgress(0..1)` as the element scrolls through the viewport. Reads
 * Lenis's scroll through hamo's shared observer, so it never forces layout and
 * it re-renders nothing: write to refs (`style.transform`, a canvas frame,
 * `uniforms.uProgress.value`) inside the callback, not to React state.
 *
 * For a sticky scene, put the ref on the tall outer wrapper and use
 * `start: 'top top', end: 'bottom bottom'`: progress then runs exactly while
 * the inner `position: sticky` panel is pinned.
 *
 * ```tsx
 * const setRef = useScrollProgress((p) => {
 *   frameRef.current?.draw(p)
 * }, { start: 'top top', end: 'bottom bottom' })
 * return <section ref={setRef} className="h-[300svh]">…</section>
 * ```
 */
export function useScrollProgress(
  onProgress: (progress: number) => void,
  {
    start = 'top bottom',
    end = 'bottom top',
    disabled = false,
  }: UseScrollProgressOptions = {}
) {
  const [setRef] = useScrollTrigger({
    start,
    end,
    disabled,
    onProgress: ({ progress }) => onProgress(progress),
  })
  return setRef
}
