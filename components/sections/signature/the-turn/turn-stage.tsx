'use client'

import cn from 'clsx'
import { useRect } from 'hamo'
import { useRef } from 'react'

import { useDeviceTier } from '@/components/motion/device-tier'
import { useScrollProgress } from '@/components/motion/use-scroll-progress'
import { useLazyWorld } from '@/components/three/use-lazy-world'
import { ViewportScene } from '@/components/three/viewport-scene'
import { Heading } from '@/components/ui/heading'
import { Image } from '@/components/ui/image'

import s from './the-turn.module.css'

const loadWorld = () => import('./turn-world').then((mod) => mod.TurnWorld)

/**
 * The stage pins this much (in viewports) before the film has left: it starts
 * behind the film's last stretch, so the film dissolves straight into it.
 */
const FILM_OVERLAP = 0.14

function setTurn(stage: HTMLElement | null, progress: number) {
  stage?.style.setProperty('--turn', progress.toFixed(2))
}

/**
 * Pinned dunes. `--turn` (0–1, quantized) drives the CSS: the headline's
 * entrance and the wash from the nebula's violet to frontier gold. Tier 0 leaves
 * it at the stylesheet's 1, so the static picture is the end state.
 */
export function TurnStage({ heading }: { heading: string }) {
  const { state } = useDeviceTier()
  const { setNearRef, World } = useLazyWorld(loadWorld)
  const [setTrackRectRef, track] = useRect({ ignoreTransform: true })
  const stageRef = useRef<HTMLDivElement>(null)
  const glideRef = useRef(0)

  const setProgressRef = useScrollProgress(
    (progress) => {
      const turn = Math.max(0, (progress - FILM_OVERLAP) / (1 - FILM_OVERLAP))
      glideRef.current = turn
      setTurn(stageRef.current, turn)
    },
    {
      start: 'top top',
      end: 'bottom bottom',
      disabled: state?.motionMedia !== true,
    }
  )

  return (
    <section
      ref={(element) => {
        setTrackRectRef(element)
        setProgressRef(element)
      }}
      className={s.track}
      data-static={state?.motionMedia === false || undefined}
      aria-labelledby="turn-title"
      data-theme="frontier"
    >
      <div
        ref={stageRef}
        className={s.stage}
        data-scrubbed={state?.motionMedia === true || undefined}
      >
        <div ref={setNearRef} className={s.scene} aria-hidden="true">
          <ViewportScene
            id="dunes"
            enabled={World !== null}
            className="h-full w-full"
            pinTrack={track}
            fallback={
              <>
                <div className="absolute inset-0 desktop-only">
                  <Image src="/posters/dunes.webp" alt="" fill sizes="100vw" />
                </div>
                <div className="absolute inset-0 mobile-only">
                  <Image
                    src="/posters/dunes-mobile.webp"
                    alt=""
                    fill
                    sizes="100vw"
                  />
                </div>
              </>
            }
          >
            {World && <World glideRef={glideRef} />}
          </ViewportScene>
        </div>
        <div className={s.wash} aria-hidden="true" />
        <div className={s.exit} aria-hidden="true" />
        <div className={cn(s.copy, 'dr-layout-block')}>
          <Heading as="h2" id="turn-title" size="display" className={s.heading}>
            {heading}
          </Heading>
        </div>
      </div>
    </section>
  )
}
