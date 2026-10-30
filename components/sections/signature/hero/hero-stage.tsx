'use client'

import { useRect } from 'hamo'
import { useEffect, useRef, useState } from 'react'

import { useDeviceTier } from '@/components/motion/device-tier'
import { loadAnime } from '@/components/motion/load-anime'
import { useScrollProgress } from '@/components/motion/use-scroll-progress'
import { createPointerField, pulseAt } from '@/components/three/pointer-field'
import { useLazyWorld } from '@/components/three/use-lazy-world'
import { ViewportScene } from '@/components/three/viewport-scene'
import { Image } from '@/components/ui/image'

import { HERO_CAMERA } from './hero-camera'

import s from './hero.module.css'

const loadHeroWorld = () => import('./hero-world').then((mod) => mod.HeroWorld)

/** The fade to S2 starts this far through the hero's exit. */
const FADE_START = 0.3
/** How far the logo turns towards the pointer, in degrees. */
const TILT = 9

/**
 * Tier 0–1 picture: the scene's own still, art-directed for each layout. Served
 * as rendered: at this size the optimizer's output is larger than the file.
 */
function HeroPoster() {
  return (
    <div className={s.sky}>
      <div className="absolute inset-0 desktop-only">
        <Image src="/posters/hero.webp" alt="" fill sizes="100vw" unoptimized />
      </div>
      <div className="absolute inset-0 mobile-only">
        <Image
          src="/posters/hero-mobile.webp"
          alt=""
          fill
          sizes="100vw"
          unoptimized
        />
      </div>
    </div>
  )
}

/**
 * Everything behind the headline, and what makes the hero respond. Hover turns
 * the logo, parts the stars and lights the gas; a click (a tap on a phone) sends
 * a gold ring out and, on the live scene, blows the stars away from that point.
 * Scrolling past pushes the logo back and fades the stage to the void S2 starts
 * from. It all goes through CSS variables and a shared field, so nothing here
 * re-renders on a pointer move. Tier 0 keeps it still.
 */
export function HeroStage() {
  const { state } = useDeviceTier()
  const animated = state?.motionMedia === true
  const { setNearRef, World } = useLazyWorld(loadHeroWorld)
  const progressRef = useRef(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const fadeRef = useRef<HTMLDivElement>(null)
  const rippleRef = useRef<HTMLDivElement>(null)
  const [setRectRef, { left = 0, top = 0, width = 0, height = 0 }] = useRect({
    ignoreTransform: true,
  })
  const [field] = useState(createPointerField)
  const fieldRef = useRef(field)

  const setTrackRef = useScrollProgress(
    (progress) => {
      progressRef.current = progress
      const fade = (progress - FADE_START) / (1 - FADE_START)
      if (fadeRef.current) fadeRef.current.style.opacity = String(fade)
      stageRef.current?.parentElement?.style.setProperty(
        '--out',
        progress.toFixed(2)
      )
    },
    { start: 'top top', end: 'bottom top', disabled: !animated }
  )

  useEffect(() => {
    const hero = stageRef.current?.parentElement
    if (!hero || !animated || !width || !height) return
    const box = hero

    function locate(event: PointerEvent) {
      const px = event.pageX - left
      const py = event.pageY - top
      return { px, py, x: px / width, y: 1 - py / height }
    }

    function onMove(event: PointerEvent) {
      if (event.pointerType === 'touch') return
      const { x, y } = locate(event)
      field.x = x
      field.y = y
      field.over = true
      box.style.setProperty('--ry', `${((x - 0.5) * TILT * 2).toFixed(2)}deg`)
      box.style.setProperty('--rx', `${((y - 0.5) * TILT * 2).toFixed(2)}deg`)
      box.style.setProperty('--sheen', `${(x * 100).toFixed(1)}%`)
    }

    function onLeave() {
      field.over = false
      box.style.setProperty('--ry', '0deg')
      box.style.setProperty('--rx', '0deg')
    }

    function onDown(event: PointerEvent) {
      // A press on a link or button is about that control, not the scene.
      if (
        event.target instanceof Element &&
        event.target.closest('a, button')
      ) {
        return
      }
      const { px, py, x, y } = locate(event)
      pulseAt(field, x, y)
      const ripple = rippleRef.current
      if (!ripple) return
      ripple.style.left = `${px}px`
      ripple.style.top = `${py}px`
      void loadAnime().then((anime) => {
        anime.animate(ripple, {
          scale: [0, 1],
          opacity: [0.8, 0],
          duration: 1100,
          ease: 'out(3)',
        })
      })
    }

    box.addEventListener('pointermove', onMove, { passive: true })
    box.addEventListener('pointerleave', onLeave)
    box.addEventListener('pointerdown', onDown, { passive: true })
    return () => {
      box.removeEventListener('pointermove', onMove)
      box.removeEventListener('pointerleave', onLeave)
      box.removeEventListener('pointerdown', onDown)
    }
  }, [animated, field, left, top, width, height])

  return (
    <div
      ref={(element) => {
        stageRef.current = element
        setTrackRef(element)
        setRectRef(element)
      }}
      className={s.stage}
      aria-hidden="true"
    >
      <div ref={setNearRef} className="absolute inset-0">
        <ViewportScene
          id="hero"
          enabled={World !== null}
          className="h-full w-full"
          camera={HERO_CAMERA}
          fallback={<HeroPoster />}
        >
          {World && <World progressRef={progressRef} fieldRef={fieldRef} />}
        </ViewportScene>
      </div>
      <div className={s.scrim} />
      <div ref={rippleRef} className={s.ripple} />
      <div ref={fadeRef} className={s.fade} />
    </div>
  )
}
