'use client'

import type { JSAnimation } from 'animejs'
import cn from 'clsx'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { useDeviceTier } from '@/components/motion/device-tier'
import { loadAnime } from '@/components/motion/load-anime'
import { useScrollProgress } from '@/components/motion/use-scroll-progress'
import type { ProcessStep } from '@/components/sections/signature/copy'
import { HorizonDivider } from '@/components/ui/horizon-divider'
import { useDeviceDetection } from '@/hooks/use-device-detection'

import s from './how-it-works.module.css'

/** Lights each step as the line reaches its node, mid-column on the arc. */
function lightSteps(list: HTMLOListElement | null, progress: number) {
  if (!list) return
  const items = list.children
  for (let i = 0; i < items.length; i++) {
    const threshold = (i + 0.5) / items.length
    items[i]?.toggleAttribute('data-lit', progress >= threshold)
  }
}

export function StepsArc({
  steps,
  intro,
}: {
  steps: readonly ProcessStep[]
  intro: ReactNode
}) {
  const { state } = useDeviceTier()
  const { isMobile } = useDeviceDetection()
  const animated = state?.motionMedia === true
  const arcRef = useRef<SVGSVGElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
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
    },
    {
      start: isMobile ? 'top center' : 'top top',
      end: isMobile ? 'bottom center' : 'bottom bottom',
      disabled: !animated,
    }
  )

  return (
    <div ref={setTrackRef} className={s.track}>
      <div className={cn(s.stage, 'dr-layout-block')}>
        {intro}
        <div className={s.arc} aria-hidden="true">
          <HorizonDivider ref={arcRef} flare={false} />
        </div>
        <div className={s.steps}>
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
        </div>
      </div>
    </div>
  )
}
