'use client'

import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { Timeline } from 'animejs'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import {
  BoxGeometry,
  type Group,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  MeshPhysicalMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector2,
} from 'three'

import { brand } from '@/brand.config'
import { type Anime, loadAnime } from '@/components/motion/load-anime'

import { brandColor } from './color'
import { type Dissolve, disposeAll, withDissolve } from './dissolve'
import {
  goldMaterial,
  seededRandom,
  smokedGlassMaterial,
} from './gold-material'
import { StudioLights } from './studio-lights'

const PROP_COUNT = 6
const BOT_COUNT = 26
/** Deliverables sit on a ring this far out, at this size, so they read. */
const PROP_RING = 1.36
const PROP_SCALE = 1.35

/** 20-point half-profile (radius, height) of a shallow dish with a lip and foot. */
const PLATTER_PROFILE: [number, number][] = [
  [0, -0.27],
  [0.2, -0.27],
  [0.5, -0.26],
  [0.6, -0.24],
  [0.7, -0.18],
  [1.2, -0.14],
  [1.7, -0.1],
  [2, -0.04],
  [2.12, 0.04],
  [2.18, 0.12],
  [2.2, 0.2],
  [2.18, 0.22],
  [2.15, 0.2],
  [2.12, 0.15],
  [2.05, 0.1],
  [1.9, 0.06],
  [1.6, 0.03],
  [1.2, 0.01],
  [0.6, 0],
  [0, 0],
]

const FUNNEL_PROFILE: [number, number][] = [
  [0.05, -0.3],
  [0.07, -0.1],
  [0.1, 0],
  [0.2, 0.08],
  [0.32, 0.16],
  [0.4, 0.24],
  [0.42, 0.28],
  [0.39, 0.28],
  [0.3, 0.18],
  [0.04, -0.3],
]

const BAR_HEIGHTS = [0.32, 0.5, 0.4, 0.68, 0.86] as const

interface PlatterParts {
  platter: LatheGeometry
  funnel: LatheGeometry
  bar: BoxGeometry
  tile: BoxGeometry
  sphere: SphereGeometry
  ring: TorusGeometry
  platterGold: MeshPhysicalMaterial
  /** Per prop: its gold and glass materials and their shared dissolve. */
  props: {
    gold: MeshPhysicalMaterial
    glass: MeshPhysicalMaterial
    dissolve: Dissolve[]
  }[]
  bots: InstancedMesh
  botUniforms: { uTime: { value: number }; uAppear: { value: number } }
}

const BOTS_VERTEX_HEAD = /* glsl */ `
attribute vec4 aOrbit;
uniform float uTime;
uniform float uAppear;
`

// Orbits run in the shader: radius, angular speed, phase, height per bot.
const BOTS_VERTEX_BODY = /* glsl */ `
float botAngle = aOrbit.z + uTime * aOrbit.y;
vec3 botCenter = vec3(cos(botAngle) * aOrbit.x, aOrbit.w + sin(botAngle * 2.0) * 0.06, sin(botAngle) * aOrbit.x);
vec3 transformed = position * uAppear + botCenter;
`

function createBots(uniforms: PlatterParts['botUniforms']): InstancedMesh {
  const random = seededRandom(26)
  const orbits = new Float32Array(BOT_COUNT * 4)
  for (let i = 0; i < BOT_COUNT; i++) {
    orbits[i * 4] = 2.45 + random() * 0.9
    orbits[i * 4 + 1] = (0.18 + random() * 0.22) * (i % 2 === 0 ? 1 : -1)
    orbits[i * 4 + 2] = (i / BOT_COUNT) * Math.PI * 2
    orbits[i * 4 + 3] = 0.25 + random() * 1.1
  }
  const geometry = new IcosahedronGeometry(0.035, 1)
  geometry.setAttribute('aOrbit', new InstancedBufferAttribute(orbits, 4))
  // Polished gold beads with a faint inner light: bloom turns them into glints.
  const material = new MeshPhysicalMaterial({
    color: brandColor('gold'),
    emissive: brandColor('gold-frontier'),
    emissiveIntensity: 0.55,
    roughness: 0.22,
    metalness: 1,
  })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime
    shader.uniforms.uAppear = uniforms.uAppear
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${BOTS_VERTEX_HEAD}`)
      .replace('#include <begin_vertex>', BOTS_VERTEX_BODY)
  }
  const bots = new InstancedMesh(geometry, material, BOT_COUNT)
  const identity = new Matrix4()
  for (let i = 0; i < BOT_COUNT; i++) bots.setMatrixAt(i, identity)
  bots.frustumCulled = false
  return bots
}

/**
 * Lathe UVs turn the brushed lines into rings; kept faint, they read as
 * turned metal.
 */
function turnedGold() {
  const material = goldMaterial()
  material.normalScale.setScalar(0.18)
  return material
}

function createParts(): PlatterParts {
  const botUniforms = { uTime: { value: 0 }, uAppear: { value: 0 } }
  const props = Array.from({ length: PROP_COUNT }, () => {
    const gold = goldMaterial()
    const glass = smokedGlassMaterial()
    return { gold, glass, dissolve: [withDissolve(gold), withDissolve(glass)] }
  })
  return {
    platter: new LatheGeometry(
      PLATTER_PROFILE.map(([x, y]) => new Vector2(x, y)),
      72
    ),
    funnel: new LatheGeometry(
      FUNNEL_PROFILE.map(([x, y]) => new Vector2(x, y)),
      32
    ),
    bar: new BoxGeometry(0.12, 1, 0.12),
    tile: new BoxGeometry(0.1, 0.025, 0.1),
    sphere: new SphereGeometry(0.2, 24, 16),
    ring: new TorusGeometry(0.3, 0.012, 6, 40),
    platterGold: turnedGold(),
    props,
    bots: createBots(botUniforms),
    botUniforms,
  }
}

function disposeParts(parts: PlatterParts) {
  for (const geometry of [
    parts.platter,
    parts.funnel,
    parts.bar,
    parts.tile,
    parts.sphere,
    parts.ring,
    parts.bots.geometry,
  ]) {
    geometry.dispose()
  }
  disposeAll([
    parts.platterGold,
    ...parts.props.flatMap((prop) => [prop.gold, prop.glass]),
  ])
  parts.bots.dispose()
}

/** Platter reveal state: what `platterTimeline` animates. */
export interface PlatterState {
  rise: { value: number }
  props: { value: number }[]
  bots: { value: number }
}

function createState(): PlatterState {
  return {
    rise: { value: 0 },
    props: Array.from({ length: PROP_COUNT }, () => ({ value: 0 })),
    bots: { value: 0 },
  }
}

/**
 * The platter rises (1 s), the six deliverables dissolve in one after another,
 * then the 26 bots spin up. Created paused: P7 seeks it with scroll progress
 * (`timeline.seek(progress * timeline.duration)`).
 *
 * Synchronous on purpose: a timeline is a thenable that settles on complete,
 * so an async function returning it would wait for a paused timeline forever.
 */
function createPlatterTimeline(anime: Anime, state: PlatterState): Timeline {
  return anime
    .createTimeline({ autoplay: false })
    .add(state.rise, { value: [0, 1], duration: 1000, ease: 'out(3)' })
    .add(
      state.props,
      {
        value: [0, 1],
        duration: 900,
        delay: anime.stagger(220),
        ease: brand.motion.easeInOut,
      },
      '-=300'
    )
    .add(state.bots, { value: [0, 1], duration: 1200, ease: 'out(2)' }, '-=400')
}

function apply(
  parts: PlatterParts,
  group: Group | null,
  state: PlatterState,
  delta: number
) {
  if (group) {
    const rise = state.rise.value
    group.position.y = -0.8 * (1 - rise)
    group.rotation.y += delta * 0.12
  }
  parts.props.forEach((prop, i) => {
    const reveal = (state.props[i]?.value ?? 0) * 1.02 - 0.01
    for (const dissolve of prop.dissolve) dissolve.reveal.value = reveal
  })
  parts.botUniforms.uTime.value += delta
  parts.botUniforms.uAppear.value = state.bots.value
}

export interface GoldenPlatterProps {
  /** 0–1. Controls the timeline directly (scroll); omit to play it once. */
  progress?: number
  /** Receives the `platterTimeline` once anime.js has loaded. */
  onPlatterTimeline?: (timeline: Timeline) => void
  lights?: boolean
}

/**
 * The golden platter with the six deliverables (Brand Bible, Research Lab,
 * Content calendar, Website, Funnel, Bot) and 26 orbiting bots.
 */
export function GoldenPlatter({
  progress,
  onPlatterTimeline,
  lights = true,
}: GoldenPlatterProps) {
  const [parts] = useState(createParts)
  const [state] = useState(createState)
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const groupRef = useRef<Group>(null)

  useEffect(() => () => disposeParts(parts), [parts])

  useEffect(() => {
    let cancelled = false
    let created: Timeline | null = null
    void loadAnime().then((anime) => {
      if (cancelled) return
      created = createPlatterTimeline(anime, state)
      setTimeline(created)
    })
    return () => {
      cancelled = true
      created?.revert()
    }
  }, [state])

  useEffect(() => {
    if (!timeline) return
    onPlatterTimeline?.(timeline)
    if (progress === undefined) timeline.play()
  }, [timeline, onPlatterTimeline, progress])

  useEffect(() => {
    if (timeline && progress !== undefined) {
      timeline.seek(progress * timeline.duration)
    }
  }, [timeline, progress])

  useFrame((_, delta) => {
    apply(parts, groupRef.current, state, delta)
  })

  const [bible, lab, calendar, website, funnel, bot] = parts.props

  return (
    <>
      {lights && <StudioLights />}
      <group ref={groupRef} rotation={[0.18, 0, 0]}>
        <mesh geometry={parts.platter} material={parts.platterGold} />

        {bible && (
          <Slot index={0} rotation={0.4}>
            {[0, 1, 2].map((page) => (
              <RoundedBox
                key={page}
                args={[0.46, 0.05, 0.6]}
                radius={0.02}
                smoothness={2}
                position={[0, 0.05 + page * 0.065, 0]}
                rotation={[0, page * 0.08, 0]}
                material={page === 1 ? bible.glass : bible.gold}
              />
            ))}
          </Slot>
        )}

        {lab && (
          <Slot index={1}>
            {BAR_HEIGHTS.map((height, i) => (
              <mesh
                key={height}
                geometry={parts.bar}
                material={i % 2 === 0 ? lab.gold : lab.glass}
                position={[(i - 2) * 0.15, height / 2, 0]}
                scale={[1, height, 1]}
              />
            ))}
          </Slot>
        )}

        {calendar && (
          <Slot index={2} rotation={0.9}>
            <CalendarGrid prop={calendar} tile={parts.tile} />
          </Slot>
        )}

        {website && (
          <Slot index={3} rotation={-0.6}>
            <RoundedBox
              args={[0.86, 0.56, 0.03]}
              radius={0.02}
              smoothness={2}
              position={[0, 0.33, 0]}
              material={website.glass}
            />
            <mesh
              geometry={parts.bar}
              material={website.gold}
              position={[0, 0.58, 0.02]}
              scale={[7, 0.05, 0.25]}
            />
          </Slot>
        )}

        {funnel && (
          <Slot index={4}>
            <mesh
              geometry={parts.funnel}
              material={funnel.gold}
              position={[0, 0.3, 0]}
            />
          </Slot>
        )}

        {bot && (
          <Slot index={5}>
            <group position={[0, 0.26, 0]}>
              <mesh geometry={parts.sphere} material={bot.glass} />
              <mesh
                geometry={parts.ring}
                material={bot.gold}
                rotation={[1.2, 0, 0.3]}
              />
              <mesh
                geometry={parts.ring}
                material={bot.gold}
                rotation={[0.4, 0.9, -0.6]}
              />
            </group>
          </Slot>
        )}

        <primitive object={parts.bots} />
      </group>
    </>
  )
}

/** One deliverable's place on the dish, evenly spaced around the ring. */
function Slot({
  index,
  rotation = 0,
  children,
}: {
  index: number
  rotation?: number
  children: ReactNode
}) {
  const angle = (index / PROP_COUNT) * Math.PI * 2
  return (
    <group
      position={[
        Math.cos(angle) * PROP_RING,
        0.02,
        Math.sin(angle) * PROP_RING,
      ]}
      rotation={[0, rotation, 0]}
      scale={PROP_SCALE}
    >
      {children}
    </group>
  )
}

const CALENDAR_COLUMNS = 7
const CALENDAR_ROWS = 5

/** 7×5 instanced tiles: every third day gold, the rest smoked glass. */
function CalendarGrid({
  prop,
  tile,
}: {
  prop: { gold: MeshPhysicalMaterial; glass: MeshPhysicalMaterial }
  tile: BoxGeometry
}) {
  const goldRef = useRef<InstancedMesh>(null)
  const glassRef = useRef<InstancedMesh>(null)

  useEffect(() => {
    const gold = goldRef.current
    const glass = glassRef.current
    if (!gold || !glass) return
    layoutTiles(gold, glass)
  }, [])

  const total = CALENDAR_COLUMNS * CALENDAR_ROWS
  return (
    <>
      <instancedMesh ref={goldRef} args={[tile, prop.gold, total]} />
      <instancedMesh ref={glassRef} args={[tile, prop.glass, total]} />
    </>
  )
}

function layoutTiles(gold: InstancedMesh, glass: InstancedMesh) {
  const matrix = new Matrix4()
  let goldCount = 0
  let glassCount = 0
  for (let row = 0; row < CALENDAR_ROWS; row++) {
    for (let column = 0; column < CALENDAR_COLUMNS; column++) {
      matrix.makeTranslation(
        (column - (CALENDAR_COLUMNS - 1) / 2) * 0.12,
        0.03,
        (row - (CALENDAR_ROWS - 1) / 2) * 0.12
      )
      if ((row * CALENDAR_COLUMNS + column) % 3 === 0) {
        gold.setMatrixAt(goldCount++, matrix)
      } else {
        glass.setMatrixAt(glassCount++, matrix)
      }
    }
  }
  gold.count = goldCount
  glass.count = glassCount
  gold.instanceMatrix.needsUpdate = true
  glass.instanceMatrix.needsUpdate = true
}
