'use client'

import { useRef } from 'react'

import { useDeviceTier } from '@/components/motion/device-tier'
import { useScrollProgress } from '@/components/motion/use-scroll-progress'
import { useLazyWorld } from '@/components/three/use-lazy-world'
import { ViewportScene } from '@/components/three/viewport-scene'
import { Image } from '@/components/ui/image'

import { HERO_CAMERA } from './hero-camera'

import s from './hero.module.css'

const loadHeroWorld = () => import('./hero-world').then((mod) => mod.HeroWorld)

/** The fade to S2 starts this far through the hero's exit. */
const FADE_START = 0.3

/** Tier 0–1 picture: the scene's own still, art-directed for each layout. */
function HeroPoster() {
  return (
    <div className={s.sky}>
      <div className="absolute inset-0 desktop-only">
        <Image src="/posters/hero.webp" alt="" fill sizes="100vw" />
      </div>
      <div className="absolute inset-0 mobile-only">
        <Image src="/posters/hero-mobile.webp" alt="" fill sizes="100vw" />
      </div>
    </div>
  )
}

/**
 * Everything behind the headline. Scrolling past the hero pushes the emblem
 * back and fades the whole stage to the void S2 starts from.
 */
export function HeroStage() {
  const { state } = useDeviceTier()
  const { setNearRef, World } = useLazyWorld(loadHeroWorld)
  const progressRef = useRef(0)
  const fadeRef = useRef<HTMLDivElement>(null)

  const setTrackRef = useScrollProgress(
    (progress) => {
      progressRef.current = progress
      const fade = (progress - FADE_START) / (1 - FADE_START)
      if (fadeRef.current) fadeRef.current.style.opacity = String(fade)
    },
    {
      start: 'top top',
      end: 'bottom top',
      disabled: state?.motionMedia !== true,
    }
  )

  return (
    <div ref={setTrackRef} className={s.stage} aria-hidden="true">
      <div ref={setNearRef} className="absolute inset-0">
        <ViewportScene
          id="hero"
          enabled={World !== null}
          className="h-full w-full"
          camera={HERO_CAMERA}
          fallback={<HeroPoster />}
        >
          {World && <World progressRef={progressRef} />}
        </ViewportScene>
      </div>
      <div className={s.scrim} />
      <div ref={fadeRef} className={s.fade} />
    </div>
  )
}
