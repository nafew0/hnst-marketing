'use client'

import type { JSAnimation } from 'animejs'
import cn from 'clsx'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { useDeviceTier } from '@/components/motion/device-tier'
import { loadAnime } from '@/components/motion/load-anime'
import { useScrollProgress } from '@/components/motion/use-scroll-progress'
import type { ProcessStep } from '@/components/sections/signature/copy'
import { HorizonDivider } from '@/components/ui/horizon-divider'
import { Logo } from '@/components/ui/logo'
import { useDeviceDetection } from '@/hooks/use-device-detection'

import s from './how-it-works.module.css'

/** The share of the (full-bleed) arc where a column's centre meets it, at 1440. */
const nodeAt = (index: number, count: number) =>
  0.028 + (0.944 * (index + 0.5)) / count

/** The logo has fully risen this far along; the steps finish after it. */
const RISE_END = 0.8

/** Lights each step as the line reaches its node. */
function lightSteps(list: HTMLOListElement | null, progress: number) {
  if (!list) return
  const items = list.children
  for (let i = 0; i < items.length; i++) {
    items[i]?.toggleAttribute('data-lit', progress >= nodeAt(i, items.length))
  }
}

export function StepsArc({
  steps,
  intro,
  note,
}: {
  steps: readonly ProcessStep[]
  intro: ReactNode
  note: string
}) {
  const { state } = useDeviceTier()
  const { isMobile } = useDeviceDetection()
  const animated = state?.motionMedia === true
  const arcRef = useRef<SVGSVGElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const riseRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const drawRef = useRef<JSAnimation>(null)
  const progressRef = useRef(0)
  const [scrubbing, setScrubbing] = useState(false)

  function seek() {
    const draw = drawRef.current
    if (draw) draw.seek(progressRef.current * draw.duration)
  }

  useEffect(() => {
    const paths =
      arcRef.current?.querySelectorAll<SVGGeometryElement>('[data-draw]')
    if (!animated || !paths?.length) return
    let cancelled = false
    let created: JSAnimation | undefined
    void loadAnime().then((anime) => {
      if (cancelled) return
      created = anime.animate(anime.svg.createDrawable(paths), {
        draw: ['0 0', '0 1'],
        duration: 1000,
        ease: 'linear',
        autoplay: false,
      })
      drawRef.current = created
      seek()
    })
    setScrubbing(true)
    return () => {
      cancelled = true
      drawRef.current = null
      created?.revert()
      setScrubbing(false)
    }
  }, [animated])

  const setTrackRef = useScrollProgress(
    (progress) => {
      progressRef.current = progress
      seek()
      lightSteps(listRef.current, progress)
      if (lineRef.current) {
        lineRef.current.style.transform = `scaleY(${progress.toFixed(3)})`
      }
      const risen = Math.min(1, progress / RISE_END)
      if (riseRef.current) {
        riseRef.current.style.transform = `translateY(${((1 - risen) * 112).toFixed(1)}%)`
      }
      if (glowRef.current) glowRef.current.style.opacity = risen.toFixed(2)
    },
    {
      start: isMobile ? 'top center' : 'top top',
      end: isMobile ? 'bottom center' : 'bottom bottom',
      disabled: !animated,
    }
  )

  return (
    <div ref={setTrackRef} className={s.track}>
      <div className={s.stage}>
        <div className="dr-layout-block">{intro}</div>
        {/* The logo comes up from behind the planet: the disc is drawn over it,
            so it shows only above the curve. Risen, it's the static version. */}
        <div className={s.horizon} aria-hidden="true">
          <div ref={glowRef} className={s.glow} />
          <div ref={riseRef} className={s.rise}>
            <Logo title={false} />
          </div>
          <svg
            className={s.planet}
            viewBox="0 0 1200 80"
            preserveAspectRatio="none"
          >
            <path d="M0 78 Q600 -6 1200 78 L1200 80 L0 80 Z" />
          </svg>
          <HorizonDivider ref={arcRef} className={s.arc} />
        </div>
        <div className={s.ground}>
          <div className={cn(s.steps, 'dr-layout-block')}>
            <div className={s.rail} aria-hidden="true">
              <div ref={lineRef} className={s.railFill} />
            </div>
            <ol
              ref={listRef}
              className={s.list}
              data-scrubbing={scrubbing || undefined}
            >
              {steps.map(({ title, description }, i) => (
                <li key={title} className={s.step}>
                  <span className={s.node} aria-hidden="true" />
                  <span className={cn(s.number, 'eyebrow')}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className={cn(s.title, 'h4')}>{title}</h3>
                  <p className="p text-pretty text-silver">{description}</p>
                </li>
              ))}
            </ol>
            <p className={cn(s.note, 'caption text-silver')}>{note}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
