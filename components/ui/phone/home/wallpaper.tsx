'use client'

import cn from 'clsx'
import { useEffect, useRef, useState } from 'react'

import { useDeviceTier } from '@/components/motion/device-tier'
import { Image } from '@/components/ui/image'

import s from './home.module.css'

const CLIP = 'lunar-walk'
const FOCUS = '42% 50%'

/**
 * The home screen's wallpaper: the lunar-walk poster, then its loop once the
 * device may play motion media. Tier 0 and reduced motion keep the poster.
 * Plays only while `active`: not behind an app, the story or the lock screen.
 */
export function Wallpaper({
  active,
  loop = true,
}: {
  active: boolean
  loop?: boolean
}) {
  const { state } = useDeviceTier()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const wanted = loop && active && state?.motionMedia === true
  // Once wanted, the video stays mounted, so it resumes where it paused.
  const [started, setStarted] = useState(false)
  if (wanted && !started) setStarted(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (wanted) void video.play().catch(() => undefined)
    else video.pause()
  }, [wanted, started])

  return (
    <div className={s.wallpaper} aria-hidden="true">
      <Image
        src={`/worlds/${CLIP}.webp`}
        alt=""
        fill
        mobileSize="100vw"
        desktopSize="1vw"
        style={{ objectPosition: FOCUS }}
      />
      {started && (
        <video
          ref={videoRef}
          className={cn(s.wallpaperVideo, playing && s.isPlaying)}
          style={{ objectPosition: FOCUS }}
          muted
          loop
          playsInline
          preload="metadata"
          tabIndex={-1}
          onPlaying={() => setPlaying(true)}
        >
          <source src={`/worlds/${CLIP}-m.mp4`} type="video/mp4" />
        </video>
      )}
    </div>
  )
}
