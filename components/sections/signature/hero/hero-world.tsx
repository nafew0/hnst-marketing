'use client'

import { useFrame } from '@react-three/fiber'
import type { RefObject } from 'react'

import { NebulaGas, PlanetRim, Starfield } from '@/components/three'
import {
  type PointerField,
  stepPointerField,
} from '@/components/three/pointer-field'

/** Where the gas gathers, in view coordinates: above the logo, so it stays legible. */
const CORE_LANDSCAPE = [0.76, 0.74] as const
const CORE_PORTRAIT = [0.6, 0.86] as const

export function HeroWorld({
  progressRef,
  fieldRef,
  portrait = false,
}: {
  progressRef: RefObject<number>
  fieldRef: RefObject<PointerField>
  /** Set for the mobile poster, the only portrait render. */
  portrait?: boolean
}) {
  useFrame((_, delta) => {
    stepPointerField(fieldRef.current, delta)
  })

  return (
    <>
      <NebulaGas
        light={0.2}
        lightPosition={portrait ? CORE_PORTRAIT : CORE_LANDSCAPE}
        fieldRef={fieldRef}
      />
      <Starfield scrollRef={progressRef} fieldRef={fieldRef} />
      <PlanetRim fieldRef={fieldRef} />
    </>
  )
}
