'use client'

import type { Timeline } from 'animejs'
import cn from 'clsx'
import { useRect } from 'hamo'
import { type ReactNode, useRef } from 'react'

import { useDeviceTier } from '@/components/motion/device-tier'
import { useScrollProgress } from '@/components/motion/use-scroll-progress'
import type { PlatterLabelPoint } from '@/components/three/golden-platter'
import { useLazyWorld } from '@/components/three/use-lazy-world'
import { ViewportScene } from '@/components/three/viewport-scene'
import { Image } from '@/components/ui/image'

import { PLATTER_CAMERA } from './platter-camera'

import s from './golden-platter.module.css'

const loadWorld = () =>
  import('./platter-world').then((mod) => mod.PlatterWorld)

/** The reveal is complete this far down the track; the rest is a held look. */
const REVEAL_END = 0.85

function moveLabel(
  label: Element | undefined,
  point: PlatterLabelPoint,
  width: number,
  height: number
) {
  if (!(label instanceof HTMLElement)) return
  const x = ((point.x + 1) / 2) * width
  const y = ((1 - point.y) / 2) * height
  label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`
  label.style.opacity = point.reveal.toFixed(2)
}

function PlatterPoster() {
  return (
    <>
      <div className="absolute inset-0 desktop-only">
        <Image src="/posters/platter-stage.webp" alt="" fill sizes="100vw" />
      </div>
      <div className="absolute inset-0 mobile-only">
        <Image src="/posters/platter-dish.webp" alt="" fill sizes="100vw" />
      </div>
    </>
  )
}

/**
 * The pinned stage: scroll scrubs `platterTimeline` directly (no React state),
 * and each frame the scene reports where its props are, which moves the list
 * items over them. Below 800 px and under reduced motion the CSS drops the pin.
 */
export function PlatterStage({
  intro,
  deliverables,
}: {
  intro: ReactNode
  deliverables: readonly { name: string; description: string }[]
}) {
  const { state } = useDeviceTier()
  const { setNearRef, World } = useLazyWorld(loadWorld)
  const [setStageRef, stage] = useRect()
  const [setTrackRectRef, track] = useRect({ ignoreTransform: true })
  const timelineRef = useRef<Timeline>(null)
  const progressRef = useRef(0)
  const listRef = useRef<HTMLOListElement>(null)

  function seek() {
    const timeline = timelineRef.current
    if (!timeline) return
    timeline.seek(
      Math.min(1, progressRef.current / REVEAL_END) * timeline.duration
    )
  }

  const setProgressRef = useScrollProgress(
    (progress) => {
      progressRef.current = progress
      seek()
    },
    {
      start: 'top top',
      end: 'bottom bottom',
      disabled: state?.liveWebGL !== true,
    }
  )

  const live = World !== null

  return (
    <div
      ref={(element) => {
        setProgressRef(element)
        setTrackRectRef(element)
      }}
      className={s.track}
      data-live={live || undefined}
    >
      <div ref={setStageRef} className={s.stage}>
        <div ref={setNearRef} className={s.scene} aria-hidden="true">
          <ViewportScene
            id="platter"
            enabled={live}
            className="h-full w-full"
            camera={PLATTER_CAMERA}
            pinTrack={track}
            fallback={<PlatterPoster />}
          >
            {World && (
              <World
                onTimeline={(timeline) => {
                  timelineRef.current = timeline
                  seek()
                }}
                onLabels={(points) => {
                  const items = listRef.current?.children
                  if (!items || !stage.width || !stage.height) return
                  points.forEach((point, i) => {
                    moveLabel(
                      items[i],
                      point,
                      stage.width ?? 0,
                      stage.height ?? 0
                    )
                  })
                }}
              />
            )}
          </ViewportScene>
        </div>

        {intro}

        <div className={cn(s.listWrap, !live && 'dr-layout-block')}>
          <ol ref={listRef} className={s.list}>
            {deliverables.map(({ name, description }) => (
              <li key={name} className={s.item}>
                <span className={cn(s.name, 'eyebrow uppercase')}>{name}</span>
                <span className={cn(s.description, 'p text-silver')}>
                  {description}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
