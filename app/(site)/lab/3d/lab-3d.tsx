'use client'

import cn from 'clsx'
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'

import { brand } from '@/brand.config'
import {
  type DeviceTier,
  DeviceTierOverride,
  useDeviceTier,
  useScrollProgress,
} from '@/components/motion'
import { ScrollSequence } from '@/components/motion/scroll-sequence'
import {
  type CaptureFn,
  DuneTerrain,
  Emblem3D,
  GoldGlintPlane,
  GoldenPlatter,
  NebulaGas,
  readTriangles,
  type SceneCamera,
  Starfield,
  ViewportScene,
} from '@/components/three'
import { Button } from '@/components/ui/button'
import { Eyebrow, Heading } from '@/components/ui/heading'
import { Image } from '@/components/ui/image'

const TIERS: { label: string; tier: DeviceTier | undefined }[] = [
  { label: 'Auto', tier: undefined },
  { label: 'Tier 0', tier: 0 },
  { label: 'Tier 1', tier: 1 },
  { label: 'Tier 2', tier: 2 },
  { label: 'Tier 3', tier: 3 },
]

const isDevelopment = process.env.NODE_ENV === 'development'
const SEQUENCE_FRAMES = 48
const SEQUENCE_URL = '/posters/sequence'

const EMBLEM_CAMERA: SceneCamera = { fov: 35, position: [0, 0, 7.6] }
const PLATTER_CAMERA: SceneCamera = {
  fov: 38,
  position: [0, 2.3, 5.6],
  lookAt: [0, 0.3, 0],
}

interface Settings {
  nebulaSpeed: number
  nebulaDensity: number
  bloom: number
  roughness: number
  clearcoat: number
}

const DEFAULTS: Settings = {
  nebulaSpeed: brand.three.nebulaSpeed,
  nebulaDensity: brand.three.nebulaDensity,
  bloom: brand.three.bloomStrength,
  roughness: brand.three.goldRoughness,
  clearcoat: brand.three.goldClearcoat,
}

const nextFrame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

async function save(name: string, body: Blob | string, type: string) {
  const response = await fetch(`/lab/3d/poster?name=${name}`, {
    method: 'POST',
    headers: { 'Content-Type': type },
    body,
  })
  return response.ok
}

export function Lab3D() {
  const [tier, setTier] = useState<DeviceTier>()
  const [settings, setSettings] = useState(DEFAULTS)
  const [emblemDraw, setEmblemDraw] = useState<number | null>(null)
  const [emblemFlare, setEmblemFlare] = useState(0.35)
  const [introRun, setIntroRun] = useState(0)
  const [platterProgress, setPlatterProgress] = useState<number | null>(null)
  const [platterRun, setPlatterRun] = useState(0)
  const [glintHover, setGlintHover] = useState(0)
  const [glintReveal, setGlintReveal] = useState(1)

  const starScrollRef = useRef(0)
  const glideRef = useRef(0)
  const renderingSequenceRef = useRef(false)
  const duneCaptureRef = useRef<CaptureFn>(null)
  const [sequenceStatus, setSequenceStatus] = useState('')

  const setStarTrackRef = useScrollProgress((progress) => {
    starScrollRef.current = progress
  })
  const setDuneTrackRef = useScrollProgress((progress) => {
    if (!renderingSequenceRef.current) glideRef.current = progress
  })

  const update = (key: keyof Settings) => (value: number) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  async function renderSequence() {
    const capture = duneCaptureRef.current
    if (!capture) {
      setSequenceStatus('The dune scene is not live (tier 2+ on desktop).')
      return
    }
    renderingSequenceRef.current = true
    const urls: string[] = []
    for (let i = 0; i < SEQUENCE_FRAMES; i++) {
      glideRef.current = i / (SEQUENCE_FRAMES - 1)
      await nextFrame()
      const blob = await capture(960)
      const name = `frame-${String(i).padStart(3, '0')}`
      if (!blob || !(await save(`sequence/${name}`, blob, 'image/webp'))) {
        setSequenceStatus(`Failed at frame ${i}.`)
        renderingSequenceRef.current = false
        return
      }
      urls.push(`${SEQUENCE_URL}/${name}.webp`)
      setSequenceStatus(`Frame ${i + 1} of ${SEQUENCE_FRAMES}`)
    }
    const manifest = {
      chapter: 'lab-dunes',
      fps: 12,
      frames: SEQUENCE_FRAMES,
      desktop: urls,
      mobile: urls,
      poster: urls[0],
    }
    await save(
      'sequence/manifest',
      JSON.stringify(manifest),
      'application/json'
    )
    renderingSequenceRef.current = false
    setSequenceStatus(
      `Saved ${SEQUENCE_FRAMES} frames to public${SEQUENCE_URL}/.`
    )
  }

  return (
    <DeviceTierOverride tier={tier}>
      <div className="dr-layout-block flex flex-col dr-gap-48 dr-pt-160 dr-pb-120">
        <header className="flex flex-col dr-gap-16">
          <Eyebrow>Lab · noindex · Phase 4</Eyebrow>
          <Heading as="h1">3D world</Heading>
          <p className="max-w-[60ch] p-big text-pretty text-silver">
            Every scene renders into its own buffer on the shared canvas behind
            the page, with tier gating, a DPR cap and bloom at tier 3 only.
            Tiers 0–1 show the posters.
          </p>
        </header>

        <section
          aria-label="Controls"
          className="flex flex-col dr-gap-24 dr-rounded-16 border border-gold/20 dr-p-24"
        >
          <div
            className="flex flex-wrap items-center dr-gap-12"
            role="group"
            aria-label="Device tier"
          >
            {TIERS.map(({ label, tier: value }) => (
              <Button
                key={label}
                variant={tier === value ? 'gold' : 'ghost'}
                aria-pressed={tier === value}
                onClick={() => setTier(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="grid dr-gap-16 dt:grid-cols-5">
            <Slider
              label="Nebula speed"
              value={settings.nebulaSpeed}
              min={0}
              max={0.2}
              step={0.005}
              onChange={update('nebulaSpeed')}
            />
            <Slider
              label="Nebula density"
              value={settings.nebulaDensity}
              min={0.3}
              max={1.6}
              step={0.02}
              onChange={update('nebulaDensity')}
            />
            <Slider
              label="Bloom (tier 3)"
              value={settings.bloom}
              min={0}
              max={1.5}
              step={0.02}
              onChange={update('bloom')}
            />
            <Slider
              label="Gold roughness"
              value={settings.roughness}
              min={0.05}
              max={0.8}
              step={0.01}
              onChange={update('roughness')}
            />
            <Slider
              label="Gold clearcoat"
              value={settings.clearcoat}
              min={0}
              max={1}
              step={0.02}
              onChange={update('clearcoat')}
            />
          </div>
          <Stats />
        </section>

        <div className="grid dr-gap-24 dt:grid-cols-2">
          <SceneCard
            id="hero-preview"
            preload
            title="Hero preview"
            note="Nebula gas, starfield and the emblem together, as S1 will compose them."
            camera={EMBLEM_CAMERA}
            bloom={settings.bloom}
            className="dt:col-span-2"
          >
            <NebulaGas
              speed={settings.nebulaSpeed}
              density={settings.nebulaDensity}
              light={0.25}
            />
            <Starfield scrollRef={starScrollRef} />
            <Emblem3D
              roughness={settings.roughness}
              clearcoat={settings.clearcoat}
            />
          </SceneCard>

          <SceneCard
            id="emblem"
            title="Emblem3D"
            note="The logo's starburst and H, N, S, T in brushed gold. Intro: draw on, flare, idle yaw."
            camera={EMBLEM_CAMERA}
            bloom={settings.bloom}
            controls={
              <>
                <Button
                  variant="link"
                  onClick={() => {
                    setEmblemDraw(null)
                    setIntroRun((run) => run + 1)
                  }}
                >
                  Replay intro
                </Button>
                <Slider
                  label="Draw"
                  value={emblemDraw ?? 1}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setEmblemDraw}
                />
                <Slider
                  label="Flare"
                  value={emblemFlare}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => {
                    setEmblemFlare(value)
                    setEmblemDraw((draw) => draw ?? 1)
                  }}
                />
              </>
            }
          >
            <Emblem3D
              key={introRun}
              roughness={settings.roughness}
              clearcoat={settings.clearcoat}
              {...(emblemDraw === null
                ? {}
                : { drawProgress: emblemDraw, flare: emblemFlare })}
            />
          </SceneCard>

          <div ref={setStarTrackRef}>
            <SceneCard
              id="nebula"
              title="NebulaGas + Starfield"
              note="Domain-warped fbm in the nebula palette, mouse parallax, 3,000 stars with scroll parallax."
              camera={EMBLEM_CAMERA}
              bloom={settings.bloom}
            >
              <NebulaGas
                speed={settings.nebulaSpeed}
                density={settings.nebulaDensity}
              />
              <Starfield scrollRef={starScrollRef} />
            </SceneCard>
          </div>

          <SceneCard
            id="platter"
            title="GoldenPlatter"
            note="Six deliverables dissolve in, then 26 bots orbit (shader-driven). The timeline is scrubbable."
            camera={PLATTER_CAMERA}
            bloom={settings.bloom}
            controls={
              <>
                <Button
                  variant="link"
                  onClick={() => {
                    setPlatterProgress(null)
                    setPlatterRun((run) => run + 1)
                  }}
                >
                  Play timeline
                </Button>
                <Slider
                  label="Progress"
                  value={platterProgress ?? 1}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setPlatterProgress}
                />
              </>
            }
          >
            <GoldenPlatter
              key={platterRun}
              {...(platterProgress === null
                ? {}
                : { progress: platterProgress })}
            />
          </SceneCard>

          <div ref={setDuneTrackRef}>
            <SceneCard
              id="dunes"
              title="DuneTerrain"
              note="Simplex-displaced dunes, golden-hour sun and fog. The camera glides with this card's scroll."
              bloom={settings.bloom}
              captureRef={duneCaptureRef}
              controls={
                isDevelopment ? (
                  <>
                    <Button
                      variant="link"
                      onClick={() => void renderSequence()}
                    >
                      Render demo sequence
                    </Button>
                    <span className="caption text-silver">
                      {sequenceStatus}
                    </span>
                  </>
                ) : null
              }
            >
              <DuneTerrain cameraGlideRef={glideRef} />
            </SceneCard>
          </div>

          <div
            onPointerEnter={() => setGlintHover(1)}
            onPointerLeave={() => setGlintHover(0)}
          >
            <SceneCard
              id="glint"
              title="GoldGlintPlane"
              note="Anisotropic streak for the package cards: it follows the pointer on hover; molten reveal."
              bloom={settings.bloom}
              controls={
                <Slider
                  label="Reveal"
                  value={glintReveal}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setGlintReveal}
                />
              }
            >
              <GoldGlintPlane hover={glintHover} reveal={glintReveal} />
            </SceneCard>
          </div>
        </div>

        <section
          aria-labelledby="sequence-title"
          className="flex flex-col dr-gap-16"
        >
          <Heading id="sequence-title" as="h2" size="h3">
            ScrollSequence
          </Heading>
          <p className="max-w-[60ch] p text-pretty text-silver">
            Frames rendered from the dune scene (development: “Render demo
            sequence”). Every 10th frame loads first, at most 120 stay decoded,
            grain and vignette on top. Tier 0 shows the poster.
          </p>
        </section>
      </div>
      <ScrollSequence
        manifestUrl={`${SEQUENCE_URL}/manifest.json`}
        poster={`${SEQUENCE_URL}/frame-000.webp`}
        alt="Golden dunes under a dusk sky"
        className="h-[300svh]"
      />
    </DeviceTierOverride>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex flex-col dr-gap-6 caption text-silver">
      <span>
        {label}: <span className="text-starlight">{value.toFixed(3)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="accent-gold"
      />
    </label>
  )
}

function Stats() {
  const { state } = useDeviceTier()
  const [triangles, setTriangles] = useState(0)
  const [fps, setFps] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setTriangles(readTriangles().total), 500)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let frames = 0
    let since = performance.now()
    let handle = requestAnimationFrame(function tick(now) {
      frames++
      if (now - since >= 500) {
        setFps(Math.round((frames * 1000) / (now - since)))
        frames = 0
        since = now
      }
      handle = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(handle)
  }, [])

  return (
    <dl className="grid grid-cols-2 dr-gap-12 dt:grid-cols-5">
      <Stat
        label="Tier"
        value={state ? `${state.tier} (${state.reason})` : 'detecting…'}
      />
      <Stat label="Live WebGL" value={state ? String(state.liveWebGL) : '…'} />
      <Stat label="Max DPR" value={state ? String(state.maxDpr) : '…'} />
      <Stat
        label="Triangles drawn"
        value={`${triangles.toLocaleString('en-US')} / 60,000`}
      />
      <Stat label="FPS" value={String(fps)} />
    </dl>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col dr-gap-4">
      <dt className="eyebrow text-contrast uppercase">{label}</dt>
      <dd className="p">{value}</dd>
    </div>
  )
}

function SceneCard({
  id,
  title,
  note,
  camera,
  bloom,
  controls,
  captureRef,
  preload = false,
  className,
  children,
}: {
  id: string
  title: string
  note: string
  camera?: SceneCamera
  bloom: number
  controls?: ReactNode
  captureRef?: RefObject<CaptureFn | null>
  /** The first card's poster is the page's largest paint. */
  preload?: boolean
  className?: string
  children: ReactNode
}) {
  const ownCaptureRef = useRef<CaptureFn>(null)
  const capture = captureRef ?? ownCaptureRef
  const [status, setStatus] = useState('')

  async function renderPoster() {
    const blob = await capture.current?.(1600)
    if (!blob) {
      setStatus('Not live at this tier.')
      return
    }
    setStatus(
      (await save(id, blob, 'image/webp'))
        ? `Saved /posters/${id}.webp`
        : 'Save failed.'
    )
  }

  return (
    <article className={cn('flex flex-col dr-gap-12', className)}>
      <ViewportScene
        id={id}
        className="aspect-[16/9] w-full overflow-clip dr-rounded-16 border border-gold/15"
        captureRef={capture}
        bloom={bloom}
        {...(camera ? { camera } : {})}
        fallback={
          <Image
            src={`/posters/${id}.webp`}
            alt=""
            fill
            sizes="(min-width: 800px) 50vw, 100vw"
            className="object-cover"
            preload={preload}
          />
        }
      >
        {children}
      </ViewportScene>
      <div className="flex flex-col dr-gap-6">
        <Heading as="h2" size="h4">
          {title}
        </Heading>
        <p className="caption text-pretty text-silver">{note}</p>
      </div>
      <div className="flex flex-wrap items-center dr-gap-12">
        {controls}
        {isDevelopment && (
          <>
            <Button variant="link" onClick={() => void renderPoster()}>
              Render poster
            </Button>
            <span className="caption text-silver">{status}</span>
          </>
        )}
      </div>
    </article>
  )
}
