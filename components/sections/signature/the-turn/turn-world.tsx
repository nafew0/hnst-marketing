'use client'

import type { RefObject } from 'react'

import { DuneTerrain } from '@/components/three/dune-terrain'

export function TurnWorld({ glideRef }: { glideRef: RefObject<number> }) {
  return <DuneTerrain cameraGlideRef={glideRef} />
}
