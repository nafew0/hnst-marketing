'use client'

import { type ReactNode, useState } from 'react'

import { useDeviceTier } from '@/components/motion/device-tier'
import { PLATTER_CAMERA } from '@/components/sections/signature/golden-platter/platter-camera'
import { PlatterWorld } from '@/components/sections/signature/golden-platter/platter-world'
import { HERO_CAMERA } from '@/components/sections/signature/hero/hero-camera'
import { HeroWorld } from '@/components/sections/signature/hero/hero-world'
import type { CaptureFn, SceneCamera } from '@/components/three'
import { DuneTerrain } from '@/components/three/dune-terrain'
import { FilmWorld } from '@/components/three/film-world'
import { GoldGlintPlane } from '@/components/three/gold-glint-plane'
import { createPointerField } from '@/components/three/pointer-field'
import { ViewportScene } from '@/components/three/viewport-scene'
import { Button } from '@/components/ui/button'
import { Eyebrow, Heading } from '@/components/ui/heading'

const isDevelopment = process.env.NODE_ENV === 'development'

/** The emblem's intro and first idle sway have finished by now. */
const SETTLE_MS = 3200

const noScroll = { current: 0 }
const stillField = { current: createPointerField() }
const FILM_CAMERA: SceneCamera = { fov: 35, position: [0, 24, 10] }
const FILM_FRAMES = 72
const FILM_WIDTHS = { desktop: 1120, mobile: 620 } as const
/** One still per caption, for tier 0: early clutter, dense clutter, the ring. */
const STILL_AT = [0.11, 0.3, 0.64] as const

interface PosterSpec {
  id: string
  label: string
  /** Output width in pixels; the height follows `aspect`. */
  width: number
  aspect: string
  camera: SceneCamera
  world: ReactNode
}

const POSTERS: PosterSpec[] = [
  {
    id: 'hero',
    label: 'S1 hero, landscape',
    width: 1600,
    aspect: '16 / 9',
    camera: HERO_CAMERA,
    world: <HeroWorld progressRef={noScroll} fieldRef={stillField} />,
  },
  {
    id: 'hero-mobile',
    label: 'S1 hero, portrait',
    width: 780,
    aspect: '9 / 19',
    camera: HERO_CAMERA,
    world: <HeroWorld progressRef={noScroll} fieldRef={stillField} portrait />,
  },
  {
    id: 'platter-stage',
    label: 'S4 platter, desktop stage',
    width: 1600,
    aspect: '16 / 9',
    camera: PLATTER_CAMERA,
    world: <PlatterWorld progress={1} />,
  },
  {
    id: 'platter-dish',
    label: 'S4 platter, mobile',
    width: 780,
    aspect: '1',
    camera: PLATTER_CAMERA,
    world: <PlatterWorld progress={1} centred />,
  },
  {
    id: 'dunes',
    label: 'S3 dunes, landscape (end of the glide)',
    width: 1600,
    aspect: '16 / 9',
    camera: { fov: 35 },
    world: <DuneTerrain cameraGlide={1} />,
  },
  {
    id: 'dunes-mobile',
    label: 'S3 dunes, portrait',
    width: 780,
    aspect: '9 / 19',
    camera: { fov: 35 },
    world: <DuneTerrain cameraGlide={1} />,
  },
  {
    id: 'glint',
    label: 'S6 card gold',
    width: 640,
    aspect: '3 / 4',
    camera: { fov: 35, position: [0, 0, 1] },
    world: <GoldGlintPlane />,
  },
]

const filmProgress = { current: 0 }
const FILM_VARIANTS = [
  { key: 'desktop', suffix: '', aspect: '16 / 9', width: FILM_WIDTHS.desktop },
  {
    key: 'mobile',
    suffix: '-mobile',
    aspect: '9 / 19',
    width: FILM_WIDTHS.mobile,
  },
] as const

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

async function save(name: string, body: Blob | string, type = 'image/webp') {
  const response = await fetch(`/lab/3d/poster?name=${name}`, {
    method: 'POST',
    headers: { 'Content-Type': type },
    body,
  })
  return response.ok
}

const nextFrame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

const frameName = (key: string, index: number) =>
  `film/${key}-${String(index).padStart(3, '0')}`

function PosterCard({
  spec,
  captureRef,
}: {
  spec: PosterSpec
  captureRef: { current: CaptureFn | null }
}) {
  return (
    <figure className="flex flex-col dr-gap-8">
      <div style={{ aspectRatio: spec.aspect }}>
        <ViewportScene
          id={`poster-${spec.id}`}
          className="h-full w-full"
          camera={spec.camera}
          captureRef={captureRef}
          fallback={null}
        >
          {spec.world}
        </ViewportScene>
      </div>
      <figcaption className="caption text-silver">{spec.label}</figcaption>
    </figure>
  )
}

const captures = new Map<string, { current: CaptureFn | null }>()

function captureFor(id: string) {
  const existing = captures.get(id)
  if (existing) return existing
  const created = { current: null }
  captures.set(id, created)
  return created
}

/**
 * Renders the tier 0–1 posters from the homepage's own scenes, at the aspect
 * each layout shows them, into public/posters/ (development only). Re-render
 * after changing a scene so tiers 0–1 keep seeing what tiers 2–3 see.
 */
export function Posters() {
  const { state } = useDeviceTier()
  const [status, setStatus] = useState('Idle')
  async function renderAll() {
    setStatus('Waiting for the intros to settle')
    await wait(SETTLE_MS)
    for (const spec of POSTERS) {
      const blob = await captureFor(spec.id).current?.(spec.width)
      if (!blob || !(await save(spec.id, blob))) {
        setStatus(`Failed: ${spec.id}`)
        return
      }
      setStatus(`Saved ${spec.id}`)
    }
    setStatus('Done')
  }

  /** S2's tier 0 stills only, without touching the frames. */
  async function renderAllStills() {
    for (const variant of FILM_VARIANTS) {
      if (!(await renderStills(variant))) return
    }
    setStatus('Stills done')
  }

  async function renderStills(variant: (typeof FILM_VARIANTS)[number]) {
    const capture = captureFor(`film-${variant.key}`)
    for (const [index, at] of STILL_AT.entries()) {
      filmProgress.current = at
      await nextFrame()
      const blob = await capture.current?.(
        variant.key === 'desktop' ? 1600 : 780
      )
      const name = `film-${index + 1}${variant.suffix}`
      if (!blob || !(await save(name, blob))) {
        setStatus(`Failed: ${name}`)
        return false
      }
    }
    return true
  }

  /** S2: every frame of both layouts, the manifest, and the chapter stills. */
  async function renderFilm() {
    const desktopUrls: string[] = []
    const mobileUrls: string[] = []
    for (const variant of FILM_VARIANTS) {
      const capture = captureFor(`film-${variant.key}`)
      const list = variant.key === 'desktop' ? desktopUrls : mobileUrls
      for (let i = 0; i < FILM_FRAMES; i++) {
        filmProgress.current = i / (FILM_FRAMES - 1)
        await nextFrame()
        const blob = await capture.current?.(variant.width)
        const name = frameName(variant.key, i)
        if (!blob || !(await save(name, blob))) {
          setStatus(`Failed: ${name}`)
          return
        }
        list.push(`/posters/${name}.webp`)
        setStatus(`Film ${variant.key}: frame ${i + 1} of ${FILM_FRAMES}`)
      }
      if (!(await renderStills(variant))) return
    }
    const manifest = {
      chapter: 'homepage-film',
      fps: 12,
      frames: FILM_FRAMES,
      desktop: desktopUrls,
      mobile: mobileUrls,
      poster: '/posters/film-1.webp',
    }
    await save('film/manifest', JSON.stringify(manifest), 'application/json')
    setStatus('Film done')
  }

  return (
    <div className="dr-layout-block flex flex-col dr-gap-32 dr-pt-160 dr-pb-120">
      <header className="flex flex-col dr-gap-16">
        <Eyebrow>Lab · noindex · Phase 7</Eyebrow>
        <Heading as="h1">Homepage posters</Heading>
        <p className="max-w-[60ch] p text-silver">
          Tier {state?.tier ?? '…'}. Renders each homepage scene to
          public/posters/ at the aspect it is shown.
        </p>
        <div className="flex items-center dr-gap-16">
          {isDevelopment && (
            <>
              <Button onClick={() => void renderAll()}>Render all</Button>
              <Button variant="ghost" onClick={() => void renderFilm()}>
                Render film
              </Button>
              <Button variant="ghost" onClick={() => void renderAllStills()}>
                Render stills
              </Button>
            </>
          )}
          <p role="status" className="caption text-silver">
            {status}
          </p>
        </div>
      </header>
      <div className="grid dr-gap-24 dt:grid-cols-2">
        {POSTERS.map((spec) => (
          <PosterCard
            key={spec.id}
            spec={spec}
            captureRef={captureFor(spec.id)}
          />
        ))}
        {FILM_VARIANTS.map((variant) => (
          <PosterCard
            key={variant.key}
            spec={{
              id: `film-${variant.key}`,
              label: `S2 film, ${variant.key}`,
              width: variant.width,
              aspect: variant.aspect,
              camera: FILM_CAMERA,
              world: <FilmWorld progressRef={filmProgress} />,
            }}
            captureRef={captureFor(`film-${variant.key}`)}
          />
        ))}
      </div>
    </div>
  )
}
