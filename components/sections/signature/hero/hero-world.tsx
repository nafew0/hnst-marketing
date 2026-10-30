'use client'

import { type RootState, useFrame } from '@react-three/fiber'
import { type RefObject, useRef } from 'react'
import { type Group, MathUtils, PerspectiveCamera } from 'three'

import { Emblem3D, NebulaGas, Starfield } from '@/components/three'

/** Where the gas is lit from: behind the emblem on each layout (0–1, y up). */
const LIGHT_LANDSCAPE = [0.77, 0.55] as const
const LIGHT_PORTRAIT = [0.5, 0.74] as const

/**
 * Keeps the emblem centred in the right half (landscape) or the top half
 * (portrait) whatever the aspect, and pushes it back as the hero scrolls away.
 */
function placeEmblem(group: Group | null, state: RootState, progress: number) {
  const { camera } = state
  if (!group || !(camera instanceof PerspectiveCamera)) return
  const halfHeight =
    Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.position.z
  const halfWidth = halfHeight * camera.aspect
  const portrait = camera.aspect < 1
  group.position.set(
    portrait ? 0 : halfWidth * 0.55,
    portrait ? halfHeight * 0.42 : 0,
    -progress * 6
  )
  group.scale.setScalar(portrait ? halfWidth * 0.4 : 0.66)
}

export function HeroWorld({
  progressRef,
  portrait = false,
}: {
  progressRef: RefObject<number>
  /** Set for the mobile poster, the only portrait render. */
  portrait?: boolean
}) {
  const emblemRef = useRef<Group>(null)
  useFrame((state) => {
    placeEmblem(emblemRef.current, state, progressRef.current)
  })

  return (
    <>
      <NebulaGas
        light={0.25}
        lightPosition={portrait ? LIGHT_PORTRAIT : LIGHT_LANDSCAPE}
      />
      <Starfield scrollRef={progressRef} />
      <group ref={emblemRef}>
        <Emblem3D />
      </group>
    </>
  )
}
