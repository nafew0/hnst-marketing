'use client'

import cn from 'clsx'
import { useIntersectionObserver } from 'hamo'
import { useEffect, useRef, useState } from 'react'

import { useDeviceTier } from '@/components/motion/device-tier'
import { Image } from '@/components/ui/image'
import { useWindows } from '@/components/ui/window/store'
import { useAfterLoad } from '@/hooks/use-after-load'

import { CLIP_FOCUS, type WorldClip } from './worlds'

import s from './world.module.css'

interface WorldSceneProps {
  clip: WorldClip
  /** The first screen's scene: its poster is the page's largest paint. */
  priority?: boolean
}

/**
 * A poster, then the loop over it once the page has loaded. Tier 0 keeps the
 * poster. Plays only while on screen and not behind or inside a hidden window.
 */
export function WorldScene({ clip, priority = false }: WorldSceneProps) {
  const { state } = useDeviceTier()
  const loaded = useAfterLoad()
  const [setSeenRef, seen] = useIntersectionObserver({ rootMargin: '25% 0px' })
  const rootRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [paneHref, setPaneHref] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const activeHref = useWindows((windows) => windows.activeHref)

  useEffect(() => {
    const pane = rootRef.current?.closest<HTMLElement>('[data-window-scroller]')
    setPaneHref(pane?.dataset.href ?? null)
  }, [])

  const inView = activeHref === paneHref
  const wanted =
    state?.motionMedia === true &&
    loaded &&
    seen?.isIntersecting === true &&
    inView

  // Once wanted, the video stays mounted, so it resumes where it paused.
  if (wanted && !started) setStarted(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (wanted) void video.play().catch(() => undefined)
    else video.pause()
  }, [wanted, started])

  return (
    <div
      ref={(element) => {
        rootRef.current = element
        setSeenRef(element)
      }}
      className={s.scene}
      aria-hidden="true"
    >
      <Image
        src={`/worlds/${clip}.webp`}
        alt=""
        fill
        sizes="100vw"
        {...(priority ? { preload: true } : {})}
        style={{ objectPosition: CLIP_FOCUS[clip] }}
      />
      {started && (
        <video
          ref={videoRef}
          className={cn(s.video, playing && s.isPlaying)}
          style={{ objectPosition: CLIP_FOCUS[clip] }}
          muted
          loop
          playsInline
          preload="metadata"
          tabIndex={-1}
          onPlaying={() => setPlaying(true)}
        >
          <source
            src={`/worlds/${clip}.mp4`}
            type="video/mp4"
            media="(min-width: 800px)"
          />
          <source src={`/worlds/${clip}-m.mp4`} type="video/mp4" />
        </video>
      )}
    </div>
  )
}
