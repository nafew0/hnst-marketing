'use client'

import { Environment, Lightformer } from '@react-three/drei'

import { brandColor } from './color'

const KEY = brandColor('starlight')
const RIM = brandColor('nebula-glow')
const FILL = brandColor('silver')

/**
 * Studio reflections for the gold: a warm key, a violet rim (nebula glow),
 * broad front and back panels, two tall side strips and two soft fills, baked
 * once into the scene's environment map. Gold has no diffuse colour, so this is what makes it read
 * as gold.
 */
export function StudioLights({ intensity = 1 }: { intensity?: number }) {
  return (
    <Environment frames={1} resolution={256}>
      <Lightformer
        form="rect"
        color={KEY}
        intensity={5 * intensity}
        position={[2.5, 2, 3]}
        scale={[3, 1.5, 1]}
        target={[0, 0, 0]}
      />
      <Lightformer
        form="ring"
        color={RIM}
        intensity={9 * intensity}
        position={[-3, 1.5, -3]}
        scale={2.5}
        target={[0, 0, 0]}
      />
      <Lightformer
        form="rect"
        color={FILL}
        intensity={1.4 * intensity}
        position={[-3, -0.5, 2.5]}
        scale={[2.5, 2.5, 1]}
        target={[0, 0, 0]}
      />
      {/* Behind the camera: flat faces mirror it, so without it they read black. */}
      <Lightformer
        form="rect"
        color={KEY}
        intensity={1.6 * intensity}
        position={[0, 1.6, 7]}
        scale={[13, 6, 1]}
        target={[0, 0, 0]}
      />
      {/* Tall strips either side: vertical faces (letters, bars) mirror these. */}
      {[-1, 1].map((side) => (
        <Lightformer
          key={side}
          form="rect"
          color={FILL}
          intensity={1.1 * intensity}
          position={[side * 5, 0.8, 1.5]}
          scale={[1.2, 7, 1]}
          target={[0, 0.5, 0]}
        />
      ))}
      {/* Low and behind: what a surface seen from above (the platter) mirrors. */}
      <Lightformer
        form="rect"
        color={FILL}
        intensity={0.9 * intensity}
        position={[0, 3.5, -5]}
        scale={[12, 5, 1]}
        target={[0, 0, 0]}
      />
      <Lightformer
        form="rect"
        color={FILL}
        intensity={1 * intensity}
        position={[0, 4, 1]}
        scale={[5, 2, 1]}
        target={[0, 0, 0]}
      />
    </Environment>
  )
}
