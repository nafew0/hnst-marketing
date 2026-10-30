'use client'

import { type RootState, useFrame } from '@react-three/fiber'
import { type RefObject, useEffect, useState } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  ShaderMaterial,
} from 'three'

import { brandColor } from './color'
import { seededRandom } from './gold-material'

const COUNT = 3000
const DEPTH_NEAR = 2
const DEPTH_FAR = 30
const HALF_HEIGHT = 9

const VERTEX = /* glsl */ `
uniform float uTime;
uniform float uScroll;
uniform float uPixelRatio;
attribute float aSize;
attribute float aPhase;
attribute float aHue;
varying float vTwinkle;
varying float vHue;
void main() {
  vec3 p = position;
  // Parallax depth: near stars travel further with scroll than far ones.
  float depth = clamp((-p.z - ${DEPTH_NEAR.toFixed(1)}) / ${(DEPTH_FAR - DEPTH_NEAR).toFixed(1)}, 0.0, 1.0);
  p.y = mod(p.y + uScroll * mix(7.0, 1.2, depth) + ${HALF_HEIGHT.toFixed(1)}, ${(HALF_HEIGHT * 2).toFixed(1)}) - ${HALF_HEIGHT.toFixed(1)};
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vTwinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aPhase * 1.6) + aPhase * 6.2831);
  vHue = aHue;
  gl_PointSize = aSize * uPixelRatio * (14.0 / -mv.z);
}
`

const FRAGMENT = /* glsl */ `
uniform vec3 uStar;
uniform vec3 uTint;
uniform vec3 uGold;
varying float vTwinkle;
varying float vHue;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a *= a * vTwinkle;
  vec3 color = vHue < 0.75 ? uStar : (vHue < 0.92 ? uTint : uGold);
  gl_FragColor = vec4(color * a * 1.8, a);
}
`

function createStars() {
  const random = seededRandom(11)
  const positions = new Float32Array(COUNT * 3)
  const sizes = new Float32Array(COUNT)
  const phases = new Float32Array(COUNT)
  const hues = new Float32Array(COUNT)
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (random() * 2 - 1) * 14
    positions[i * 3 + 1] = (random() * 2 - 1) * HALF_HEIGHT
    positions[i * 3 + 2] = -(DEPTH_NEAR + random() * (DEPTH_FAR - DEPTH_NEAR))
    // Mostly faint, a few bright.
    sizes[i] = 0.6 + random() ** 4 * 2.6
    phases[i] = random()
    hues[i] = random()
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
  geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))
  geometry.setAttribute('aHue', new BufferAttribute(hues, 1))
  const material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uPixelRatio: { value: 1 },
      uStar: { value: brandColor('starlight') },
      uTint: { value: brandColor('nebula-tint') },
      uGold: { value: brandColor('gold') },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  return { geometry, material }
}

function step(
  material: ShaderMaterial,
  state: RootState,
  delta: number,
  scroll: number
) {
  const { uniforms } = material
  if (uniforms.uTime) uniforms.uTime.value += delta
  if (uniforms.uScroll) uniforms.uScroll.value = scroll
  if (uniforms.uPixelRatio) uniforms.uPixelRatio.value = state.viewport.dpr
}

export interface StarfieldProps {
  /** 0–1 scroll progress of the section (e.g. from useScrollProgress). */
  scrollRef?: RefObject<number>
}

/**
 * About 3,000 twinkling stars, drawn as points (no triangles), spread in
 * depth so scroll gives them parallax.
 */
export function Starfield({ scrollRef }: StarfieldProps) {
  const [stars] = useState(createStars)
  useEffect(
    () => () => {
      stars.geometry.dispose()
      stars.material.dispose()
    },
    [stars]
  )

  useFrame((state, delta) => {
    step(stars.material, state, delta, scrollRef?.current ?? 0)
  })

  return (
    <points
      geometry={stars.geometry}
      material={stars.material}
      frustumCulled={false}
      renderOrder={-50}
    />
  )
}
