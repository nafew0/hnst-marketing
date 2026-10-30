'use client'

import type { AutoLayout } from 'animejs'
import cn from 'clsx'
import { useIntersectionObserver } from 'hamo'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { brand } from '@/brand.config'
import { useDeviceTier } from '@/components/motion/device-tier'
import { loadAnime } from '@/components/motion/load-anime'
import type { PackageFacts } from '@/components/sections/signature/copy'
import { useLazyWorld } from '@/components/three/use-lazy-world'
import { Button } from '@/components/ui/button'
import type { OffersResponse } from '@/lib/contracts'
import { api } from '@/lib/contracts/client'

import { withOffers } from './offers'
import { type GlintWorldProps, PackageCard } from './package-card'

import s from './package-reveal.module.css'

export type { PackageFacts as PackageRevealItem } from '@/components/sections/signature/copy'

const loadGlint = () => import('./glint-world').then((mod) => mod.GlintWorld)

interface PackageRevealProps {
  /** Package facts, from the CMS on `/packages` and `copy.ts` on the homepage. */
  items: readonly PackageFacts[]
  /** Label for the view toggle. Hide it with `compareToggle={false}`. */
  compareLabel?: string
  compareToggle?: boolean
  className?: string
}

/**
 * S6, and the package grid on `/packages`. Cards rise over molten gold (tiers
 * 2–3; a rendered still below that), prices come from `GET /api/v1/offers` with
 * the passed-in facts as the fallback, and the compare toggle re-flows the same
 * cards with the Layout module. Everything is readable before JavaScript and
 * under reduced motion: the numbers are server-rendered, not counted into.
 */
export function PackageReveal({
  items,
  compareLabel = 'Compare packages',
  compareToggle = true,
  className,
}: PackageRevealProps) {
  const { state } = useDeviceTier()
  const animated = state?.motionMedia === true
  const { setNearRef, World } = useLazyWorld<GlintWorldProps>(loadGlint)
  const [setNearOffersRef, near] = useIntersectionObserver({
    rootMargin: '100% 0px',
    once: true,
  })
  const [setSeenRef, seen] = useIntersectionObserver({
    threshold: 0.2,
    once: true,
  })
  const shouldFetch = near?.isIntersecting === true
  const [offers, setOffers] = useState<OffersResponse | null>(null)
  const [settled, setSettled] = useState(false)
  const [compare, setCompare] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const layoutRef = useRef<AutoLayout>(null)
  const pendingRef = useRef(false)

  useEffect(() => {
    if (!shouldFetch) return
    let cancelled = false
    void api.getOffers().then((result) => {
      if (cancelled) return
      if (result.ok) setOffers(result.data)
      setSettled(true)
    })
    return () => {
      cancelled = true
    }
  }, [shouldFetch])

  const shown = withOffers(items, offers)
  // The rise and the count wait for the real prices, so a number never jumps.
  const entering = animated && settled && seen?.isIntersecting === true

  useEffect(() => {
    const grid = gridRef.current
    if (!grid || !animated) return
    let cancelled = false
    let layout: AutoLayout | undefined
    void loadAnime().then((anime) => {
      if (cancelled) return
      layout = anime.createLayout(grid, {
        duration: brand.motion.durBase,
        ease: brand.motion.easeInOut,
      })
      layoutRef.current = layout
    })
    return () => {
      cancelled = true
      layoutRef.current = null
      layout?.revert()
    }
  }, [animated])

  // After React has re-flowed the cards, play from the recorded positions.
  useLayoutEffect(() => {
    if (!pendingRef.current) return
    pendingRef.current = false
    layoutRef.current?.animate()
  }, [compare])

  function toggleCompare() {
    layoutRef.current?.record()
    pendingRef.current = true
    setCompare((value) => !value)
  }

  return (
    <div
      ref={(element) => {
        setNearRef(element)
        setNearOffersRef(element)
      }}
      className={cn(s.root, className)}
    >
      {offers?.banner && <p className={cn(s.banner, 'p')}>{offers.banner}</p>}
      {compareToggle && (
        <div className={s.controls}>
          <Button
            variant="ghost"
            aria-pressed={compare}
            onClick={toggleCompare}
          >
            {compare ? 'Show cards' : compareLabel}
          </Button>
        </div>
      )}
      <div
        ref={(element) => {
          gridRef.current = element
          setSeenRef(element)
        }}
        className={s.grid}
        data-view={compare ? 'compare' : 'cards'}
      >
        {shown.map((item, index) => (
          <PackageCard
            key={item.tier}
            item={item}
            index={index}
            compare={compare}
            entering={entering}
            World={compare ? null : World}
          />
        ))}
      </div>
    </div>
  )
}
