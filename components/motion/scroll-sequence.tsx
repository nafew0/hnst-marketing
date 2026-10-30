'use client'

import cn from 'clsx'
import { useIntersectionObserver, useRect } from 'hamo'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { Image } from '@/components/ui/image'
import { useDeviceDetection } from '@/hooks/use-device-detection'

import { useDeviceTier } from './device-tier'
import { type FrameManifest, frameManifestSchema } from './frame-manifest'
import { decodeFrame, FrameStore } from './frame-store'
import { useScrollProgress } from './use-scroll-progress'

import s from './scroll-sequence.module.css'

/** Canvas resolution ceiling: frames are 1280w (desktop) / 720w (mobile). */
const MAX_DPR = 1.5

interface Player {
  store: FrameStore
  progress: number
  drawn: number
}

function drawCover(
  context: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  width: number,
  height: number
) {
  const scale = Math.max(width / bitmap.width, height / bitmap.height)
  const drawWidth = bitmap.width * scale
  const drawHeight = bitmap.height * scale
  context.drawImage(
    bitmap,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight
  )
}

function render(player: Player, canvas: HTMLCanvasElement | null) {
  const context = canvas?.getContext('2d')
  if (!canvas || !context) return
  const target = Math.round(player.progress * (player.store.length - 1))
  player.store.seek(target)
  const frame = player.store.nearest(target)
  if (!frame || frame.index === player.drawn) return
  player.drawn = frame.index
  drawCover(context, frame.bitmap, canvas.width, canvas.height)
}

interface ScrollSequenceProps {
  manifestUrl: string
  /** Shown at tier 0, before frames arrive, and to no-JS visitors. */
  poster: string
  alt: string
  /** Defaults to mobile frames on mobile viewports. */
  variant?: 'desktop' | 'mobile'
  /** Sets the scroll length, e.g. `h-[600svh]`; the stage stays pinned. */
  className?: string
  /** Captions over the film. */
  children?: ReactNode
}

/**
 * Scroll-scrubbed film: a pinned stage whose canvas shows frame
 * `progress × (frames − 1)` of a P5 frame manifest, with film grain and a
 * vignette on top. Tier 0 (reduced motion, Save-Data) shows only the poster.
 */
export function ScrollSequence({
  manifestUrl,
  poster,
  alt,
  variant,
  className,
  children,
}: ScrollSequenceProps) {
  const { state } = useDeviceTier()
  const { isMobile, dpr = 1 } = useDeviceDetection()
  const live = state?.motionMedia === true
  const chosen = variant ?? (isMobile ? 'mobile' : 'desktop')

  // Frames download once the film is within a viewport of the screen.
  const [setNearRef, near] = useIntersectionObserver({
    rootMargin: '100% 0px',
    once: true,
  })
  const loading = live && near?.isIntersecting === true

  const [manifest, setManifest] = useState<FrameManifest | null>(null)
  const [setStageRef, stage] = useRect()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<Player>(null)

  useEffect(() => {
    if (!loading) return
    let cancelled = false
    void fetch(manifestUrl)
      .then(async (response) =>
        frameManifestSchema.safeParse(await response.json())
      )
      .then((parsed) => {
        if (!cancelled && parsed.success) setManifest(parsed.data)
      })
      .catch(() => {
        // No manifest: the poster stays up.
      })
    return () => {
      cancelled = true
    }
  }, [loading, manifestUrl])

  useEffect(() => {
    if (!manifest) return
    const player: Player = {
      store: new FrameStore(manifest[chosen], decodeFrame, (index) => {
        // A newly decoded frame closer to the playhead replaces the stand-in.
        const target = Math.round(player.progress * (manifest.frames - 1))
        if (Math.abs(index - target) < Math.abs(player.drawn - target)) {
          player.drawn = -1
          render(player, canvasRef.current)
        }
      }),
      progress: 0,
      drawn: -1,
    }
    playerRef.current = player
    render(player, canvasRef.current)
    return () => {
      player.store.dispose()
      playerRef.current = null
    }
  }, [manifest, chosen])

  // Match the canvas buffer to the stage size at the capped DPR.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !stage.width || !stage.height) return
    const ratio = Math.min(dpr, MAX_DPR)
    canvas.width = Math.round(stage.width * ratio)
    canvas.height = Math.round(stage.height * ratio)
    const player = playerRef.current
    if (player) {
      player.drawn = -1
      render(player, canvas)
    }
  }, [stage.width, stage.height, dpr, manifest])

  const setTrackRef = useScrollProgress(
    (progress) => {
      const player = playerRef.current
      if (!player) return
      player.progress = progress
      render(player, canvasRef.current)
    },
    { start: 'top top', end: 'bottom bottom', disabled: !live }
  )

  return (
    <div ref={setTrackRef} className={cn(s.track, className)}>
      <div
        ref={setNearRef}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <div ref={setStageRef} className={s.stage}>
        {/* Image fill needs a relative/absolute parent; sticky doesn't count. */}
        <div className="absolute inset-0">
          <Image
            src={poster}
            alt={alt}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        {live && manifest && (
          <canvas
            ref={canvasRef}
            className={cn(s.canvas, 'absolute inset-0')}
            aria-hidden="true"
          />
        )}
        <div className={s.grain} aria-hidden="true" />
        <div className={s.vignette} aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}
