'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import {
  type Group,
  type Mesh,
  type MeshPhysicalMaterial,
  Plane,
  Vector3,
  type WebGLRenderer,
} from 'three'

import { brand } from '@/brand.config'
import { loadAnime } from '@/components/motion/load-anime'

import { brandColor } from './color'
import { buildEmblemGeometry, type EmblemGeometry } from './emblem-geometry'
import { goldMaterial, tuneGold } from './gold-material'
import { StudioLights } from './studio-lights'

interface EmblemParts {
  geometry: EmblemGeometry
  letters: MeshPhysicalMaterial
  starburst: MeshPhysicalMaterial
  /** Draw-on sweep in the emblem's local space; copied to world each frame. */
  localPlane: Plane
}

/** Intro timeline state, animated by anime.js. */
interface EmblemMotion {
  draw: { value: number }
  flare: { value: number }
}

function createParts(): EmblemParts {
  const starburst = goldMaterial()
  starburst.emissive = brandColor('gold-frontier')
  starburst.emissiveIntensity = 0
  starburst.clippingPlanes = [new Plane()]
  return {
    geometry: buildEmblemGeometry(),
    letters: goldMaterial(),
    starburst,
    localPlane: new Plane(new Vector3(0, 1, 0), 0),
  }
}

function disposeParts(parts: EmblemParts) {
  parts.geometry.letters.dispose()
  parts.geometry.starburst.dispose()
  parts.letters.dispose()
  parts.starburst.dispose()
}

function enableLocalClipping(gl: WebGLRenderer) {
  gl.localClippingEnabled = true
}

/**
 * drawProgress 0–1 sweeps a clipping plane down the starburst, so the rays
 * appear first and the crescent draws downwards. flare 0–1 scales the
 * starburst about its rays and lights it (bloom picks it up at tier 3).
 */
function applyMotion(
  parts: EmblemParts,
  burst: Mesh | null,
  drawProgress: number,
  flare: number
) {
  if (!burst) return
  const { starburstTop, starburstBottom, flarePivot } = parts.geometry
  const margin = 0.05
  const threshold =
    starburstTop +
    margin -
    drawProgress * (starburstTop - starburstBottom + margin * 2)
  parts.localPlane.constant = -threshold
  const [worldPlane] = parts.starburst.clippingPlanes ?? []
  if (worldPlane) {
    worldPlane.copy(parts.localPlane).applyMatrix4(burst.matrixWorld)
  }

  const scale = 1 + flare * 0.08
  burst.scale.setScalar(scale)
  burst.position.set(flarePivot.x * (1 - scale), flarePivot.y * (1 - scale), 0)
  parts.starburst.emissiveIntensity = flare * 2.4
}

export interface Emblem3DProps {
  /** 0–1. Omit to let the intro timeline draw the starburst on. */
  drawProgress?: number
  /** 0–1 flare. Omit to let the intro timeline flare and settle. */
  flare?: number
  /** ±12° idle yaw (anime.js through its Three adapter). Default true. */
  idle?: boolean
  roughness?: number
  clearcoat?: number
  /** Studio reflections; turn off when the parent scene lights itself. */
  lights?: boolean
}

/**
 * The gold HNST emblem: the logo's starburst-and-crescent mark and the H, N,
 * S, T of its wordmark, extruded in brushed gold. Intro: the starburst draws
 * on (0–1.2 s), flares (1.2–1.8 s), then the emblem idles.
 */
export function Emblem3D({
  drawProgress,
  flare,
  idle = true,
  roughness = brand.three.goldRoughness,
  clearcoat = brand.three.goldClearcoat,
  lights = true,
}: Emblem3DProps) {
  const [parts] = useState(createParts)
  const [motion] = useState<EmblemMotion>(() => ({
    draw: { value: 0 },
    flare: { value: 0 },
  }))
  const groupRef = useRef<Group>(null)
  const burstRef = useRef<Mesh>(null)
  const gl = useThree((state) => state.gl)
  const intro = drawProgress === undefined && flare === undefined

  useEffect(() => {
    enableLocalClipping(gl)
  }, [gl])
  useEffect(() => () => disposeParts(parts), [parts])
  useEffect(() => {
    tuneGold(parts.letters, { roughness, clearcoat })
    tuneGold(parts.starburst, { roughness, clearcoat })
  }, [parts, roughness, clearcoat])

  useEffect(() => {
    const group = groupRef.current
    let cancelled = false
    const reverts: (() => void)[] = []

    void loadAnime().then(async (anime) => {
      await import('animejs/adapters/three')
      if (cancelled) return
      if (intro) {
        const timeline = anime
          .createTimeline()
          .add(motion.draw, {
            value: [0, 1],
            duration: 1200,
            ease: brand.motion.easeInOut,
          })
          .add(motion.flare, { value: [0, 1], duration: 300, ease: 'out(3)' })
          .add(motion.flare, {
            value: 0.35,
            duration: 300,
            ease: brand.motion.easeInOut,
          })
        reverts.push(() => {
          timeline.revert()
        })
      }
      if (idle && group) {
        const sway = anime.animate(group, {
          rotateY: [-12, 12],
          duration: 5200,
          loop: true,
          alternate: true,
          ease: 'inOut(2)',
        })
        reverts.push(() => {
          sway.revert()
        })
      }
    })

    return () => {
      cancelled = true
      for (const revert of reverts) revert()
    }
  }, [intro, idle, motion])

  useFrame(() => {
    applyMotion(
      parts,
      burstRef.current,
      drawProgress ?? motion.draw.value,
      flare ?? motion.flare.value
    )
  })

  return (
    <>
      {lights && <StudioLights />}
      <group ref={groupRef}>
        <mesh geometry={parts.geometry.letters} material={parts.letters} />
        <mesh
          ref={burstRef}
          geometry={parts.geometry.starburst}
          material={parts.starburst}
        />
      </group>
    </>
  )
}
