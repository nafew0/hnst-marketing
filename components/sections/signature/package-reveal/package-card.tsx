'use client'

import cn from 'clsx'
import { useRect } from 'hamo'
import {
  type ComponentType,
  type PointerEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'

import { brand } from '@/brand.config'
import { loadAnime } from '@/components/motion/load-anime'
import type { PackageFacts } from '@/components/sections/signature/copy'
import { ViewportScene } from '@/components/three/viewport-scene'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Image } from '@/components/ui/image'

import s from './package-reveal.module.css'

const CAMERA = { fov: 35, position: [0, 0, 1] } as const

/** How long a card keeps drawing after the pointer leaves, for the ease back. */
const SETTLE_MS = 900

export interface GlintWorldProps {
  hoverRef: RefObject<number>
  revealRef: RefObject<number>
  pointerRef: RefObject<{ x: number; y: number }>
}

const dollars = new Intl.NumberFormat('en-US')

function formatPrice(price: number, from: boolean | undefined) {
  return `${from ? 'from ' : ''}$${dollars.format(price)}`
}

/**
 * One package. The gold plane sits behind the card on the shared canvas; the
 * card's translucent face lets it through, and on hover the streak follows the
 * pointer, inside the card's own border (the plane is sized to it).
 */
export function PackageCard({
  item,
  index,
  compare,
  entering,
  World,
}: {
  item: PackageFacts
  index: number
  compare: boolean
  entering: boolean
  World: ComponentType<GlintWorldProps> | null
}) {
  const { name, summary, price, value, priceFrom, turnaround, href, ctaLabel } =
    item
  const cardRef = useRef<HTMLElement>(null)
  const [setRectRef, rect] = useRect({ ignoreTransform: true })
  const priceRef = useRef<HTMLSpanElement>(null)
  const hoverRef = useRef(0)
  const revealRef = useRef(1)
  const pointerRef = useRef({ x: 0.5, y: 0.5 })
  const settleRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [drawing, setDrawing] = useState(false)
  const [struck, setStruck] = useState(true)
  const finalPrice = formatPrice(price, priceFrom)

  useEffect(() => {
    if (!entering) return
    const card = cardRef.current
    const priceEl = priceRef.current
    if (!card || !priceEl) return
    let cancelled = false
    const reverts: (() => void)[] = []
    const delay = index * brand.motion.stagger * 2
    revealRef.current = 0
    setDrawing(true)
    setStruck(false)

    void loadAnime().then((anime) => {
      if (cancelled) return
      const rise = anime.animate(card, {
        y: ['2.5rem', 0],
        opacity: [0.01, 1],
        duration: brand.motion.durSlow,
        delay,
        ease: brand.motion.ease,
      })
      const count = { price: 0 }
      const counter = anime.animate(count, {
        price,
        duration: brand.motion.durSlow,
        delay: delay + 200,
        ease: brand.motion.ease,
        onUpdate: () => {
          priceEl.textContent = formatPrice(Math.round(count.price), priceFrom)
        },
        onComplete: () => {
          priceEl.textContent = formatPrice(price, priceFrom)
          setStruck(true)
        },
      })
      const molten = { value: 0 }
      const forge = anime.animate(molten, {
        value: 1,
        duration: brand.motion.durSlow,
        delay,
        ease: brand.motion.easeInOut,
        onUpdate: () => {
          revealRef.current = molten.value
        },
        onComplete: () => {
          setDrawing(false)
        },
      })
      reverts.push(
        () => {
          rise.revert()
        },
        () => {
          counter.revert()
        },
        () => {
          forge.revert()
        }
      )
    })

    return () => {
      cancelled = true
      revealRef.current = 1
      priceEl.textContent = formatPrice(price, priceFrom)
      for (const revert of reverts) revert()
    }
  }, [entering, index, price, priceFrom])

  useEffect(() => () => clearTimeout(settleRef.current), [])

  // The streak only follows the pointer across, so scroll never enters into it.
  function trackPointer(event: PointerEvent<HTMLElement>) {
    if (rect.left === undefined || !rect.width) return
    pointerRef.current.x = (event.clientX - rect.left) / rect.width
  }

  return (
    <article
      ref={(element) => {
        cardRef.current = element
        setRectRef(element)
      }}
      className={cn(s.card, item.highlight && s.featured)}
      data-compare={compare || undefined}
      onPointerEnter={() => {
        clearTimeout(settleRef.current)
        hoverRef.current = 1
        setDrawing(true)
      }}
      onPointerMove={trackPointer}
      onPointerLeave={() => {
        hoverRef.current = 0
        settleRef.current = setTimeout(() => setDrawing(false), SETTLE_MS)
      }}
    >
      {!compare && (
        <div className={s.gold} aria-hidden="true">
          <ViewportScene
            id={`glint-${item.tier}`}
            enabled={World !== null}
            className="h-full w-full"
            camera={CAMERA}
            animate={drawing}
            bloom={0}
            fallback={
              <Image
                src="/posters/glint.webp"
                alt=""
                fill
                sizes="(min-width: 800px) 25vw, 100vw"
              />
            }
          >
            {World && (
              <World
                hoverRef={hoverRef}
                revealRef={revealRef}
                pointerRef={pointerRef}
              />
            )}
          </ViewportScene>
        </div>
      )}

      <div className={s.face}>
        <div className={s.head}>
          {item.badge && <Badge className={s.badge}>{item.badge}</Badge>}
          <h3 className={cn(s.name, 'h4')}>{name}</h3>
        </div>
        <p className={cn(s.price, 'h2')}>
          <span ref={priceRef}>{finalPrice}</span>
          {value !== undefined && (
            <span
              className={cn(s.value, 'p')}
              data-struck={struck || undefined}
            >
              <span className="sr-only">Stated value </span>$
              {dollars.format(value)}
            </span>
          )}
        </p>
        <p className={cn(s.summary, 'p text-pretty')}>{summary}</p>
        {compare ? (
          <dl className={s.compare}>
            {item.compare.map((row) => (
              <div key={row.label} className={s.compareRow}>
                <dt className="caption text-silver">{row.label}</dt>
                <dd className="p">
                  {row.label === 'Delivery' ? turnaround : row.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className={cn(s.turnaround, 'caption')}>{turnaround}</p>
        )}
        <Button
          href={href}
          variant={item.highlight ? 'gold' : 'ghost'}
          className={cn(s.cta)}
        >
          {ctaLabel}
        </Button>
      </div>
    </article>
  )
}
