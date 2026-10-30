'use client'

import cn from 'clsx'
import { type Rect, useRect } from 'hamo'
import dynamic from 'next/dynamic'
import { type ReactNode, type RefObject, useRef, useState } from 'react'

import { brand } from '@/brand.config'
import { useDeviceTier } from '@/components/motion/device-tier'
import { useRootCanvasMounted } from '@/webgl/components/canvas'
import { WebGLTunnel } from '@/webgl/components/tunnel'

import type { CaptureFn, SceneCamera } from './viewport-renderer'

const ViewportRenderer = dynamic(
  () => import('./viewport-renderer').then((mod) => mod.ViewportRenderer),
  { ssr: false }
)

const DEFAULT_CAMERA: SceneCamera = {}

interface ViewportSceneProps {
  /** Stable name: keys the triangle readout and the poster file. */
  id: string
  /** three.js content, rendered with this scene's own perspective camera. */
  children: ReactNode
  /**
   * Shown until the live scene has drawn, and instead of it at tiers 0–1, on
   * touch devices and under reduced motion: a poster image or SVG.
   */
  fallback: ReactNode
  className?: string
  camera?: SceneCamera
  /** Keep drawing every frame while visible. Defaults to true. */
  animate?: boolean
  /** Bloom strength at tier 3; defaults to `brand.three.bloomStrength`. */
  bloom?: number
  exposure?: number
  /** Receives a function that renders the current frame to a WebP blob. */
  captureRef?: RefObject<CaptureFn | null>
  /** False keeps the poster up: the scene's content isn't loaded yet. */
  enabled?: boolean
  /**
   * The tall track of a `position: sticky; top: 0` scene. hamo measures a
   * sticky element where it would sit unpinned, so the scene needs the track
   * to stay on the pinned element.
   */
  pinTrack?: Rect
}

/**
 * A 3D scene that occupies this element's box (the r3f-scroll-rig pattern on
 * Satus's root canvas): the element is measured with hamo, and the scene is
 * portalled into the shared canvas, which sits behind the page. Sections that
 * show a scene keep a transparent background.
 */
export function ViewportScene({
  id,
  children,
  fallback,
  className,
  camera = DEFAULT_CAMERA,
  animate = true,
  bloom,
  exposure = 1,
  captureRef,
  enabled = true,
  pinTrack,
}: ViewportSceneProps) {
  const { state } = useDeviceTier()
  const rootCanvasMounted = useRootCanvasMounted()
  const [setRectRef, rect] = useRect({ ignoreTransform: true })
  const ownCaptureRef = useRef<CaptureFn>(null)

  const live = enabled && rootCanvasMounted && state?.liveWebGL === true
  const bloomStrength = state?.bloom ? (bloom ?? brand.three.bloomStrength) : 0
  // One renderer per live configuration; bloom on/off rebuilds its passes.
  const rendererKey = `${id}:${bloomStrength > 0 ? 'bloom' : 'plain'}`
  const [drawnKey, setDrawnKey] = useState<string | null>(null)
  const drawn = live && drawnKey === rendererKey

  return (
    <div ref={setRectRef} className={cn('relative', className)}>
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-500',
          drawn && 'opacity-0'
        )}
        aria-hidden={drawn || undefined}
      >
        {fallback}
      </div>
      {live && (
        <WebGLTunnel>
          <ViewportRenderer
            key={rendererKey}
            id={id}
            rect={rect}
            pinTrack={pinTrack}
            camera={camera}
            bloomStrength={bloomStrength}
            maxDpr={state.maxDpr}
            animate={animate}
            exposure={exposure}
            onFirstFrame={() => setDrawnKey(rendererKey)}
            captureRef={captureRef ?? ownCaptureRef}
          >
            {children}
          </ViewportRenderer>
        </WebGLTunnel>
      )}
    </div>
  )
}
