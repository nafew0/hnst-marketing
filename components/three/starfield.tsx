'use client'

import { type RootState, useFrame } from '@react-three/fiber'
import { type RefObject, useEffect, useState } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  PerspectiveCamera,
  ShaderMaterial,
  Vector2,
} from 'three'

import { brandColor } from './color'
import { seededRandom } from './gold-material'
import type { PointerField } from './pointer-field'

const COUNT = 3000
const DEPTH_NEAR = 2
const DEPTH_FAR = 30
const HALF_HEIGHT = 9

const VERTEX = /* glsl */ `
uniform float uTime;
uniform float uScroll;
uniform float uPixelRatio;
uniform float uAspect;
uniform vec2 uPointer;
uniform float uHover;
uniform float uPulse;
uniform vec2 uPulsePos;
attribute float aSize;
attribute float aPhase;
attribute float aHue;
varying float vTwinkle;
varying float vHue;
varying float vSpikes;
void main() {
  vec3 p = position;
  // Parallax depth: near stars travel further with scroll than far ones.
  float depth = clamp((-p.z - ${DEPTH_NEAR.toFixed(1)}) / ${(DEPTH_FAR - DEPTH_NEAR).toFixed(1)}, 0.0, 1.0);
  p.y = mod(p.y + uScroll * mix(7.0, 1.2, depth) + ${HALF_HEIGHT.toFixed(1)}, ${(HALF_HEIGHT * 2).toFixed(1)}) - ${HALF_HEIGHT.toFixed(1)};
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  // In screen space, so a star moves the same however far away it is, with the
  // near ones reacting most. They part around the pointer, and a click blows them
  // away from where it landed; both ease back on their own.
  vec2 aspect = vec2(uAspect, 1.0);
  vec2 here = gl_Position.xy / gl_Position.w;
  float reach = mix(1.25, 0.55, depth);
  vec2 fromPointer = (here - (uPointer * 2.0 - 1.0)) * aspect;
  vec2 shift = fromPointer * exp(-dot(fromPointer, fromPointer) * 7.0) * 0.5 * uHover * reach;
  vec2 fromPulse = (here - (uPulsePos * 2.0 - 1.0)) * aspect;
  float pulseRadius = length(fromPulse);
  float spent = 1.0 - uPulse;
  float blast = exp(-pulseRadius * 1.6) * spent * spent * 1.3;
  float ring = exp(-pow((pulseRadius - uPulse * 3.0) * 2.4, 2.0)) * spent;
  shift += fromPulse / max(pulseRadius, 0.001) * (blast + ring * 0.35) * reach;
  gl_Position.xy += shift / aspect * gl_Position.w;

  vTwinkle = (0.6 + 0.4 * sin(uTime * (0.6 + aPhase * 1.6) + aPhase * 6.2831)) * (1.0 + ring * 1.5);
  vHue = aHue;
  vSpikes = smoothstep(2.6, 4.2, aSize);
  // Never under about a pixel and a half, or the far layer vanishes.
  gl_PointSize = max(aSize * (1.0 + vSpikes * 2.4) * uPixelRatio * (24.0 / -mv.z), 1.6 * uPixelRatio);
}
`

const FRAGMENT = /* glsl */ `
uniform vec3 uStar;
uniform vec3 uTeal;
uniform vec3 uRose;
uniform vec3 uGold;
varying float vTwinkle;
varying float vHue;
varying float vSpikes;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float core = smoothstep(0.5 - vSpikes * 0.34, 0.0, d);
  core *= core;
  // The brightest stars get a four-point diffraction cross.
  float spikes = (exp(-abs(c.x) * 70.0) + exp(-abs(c.y) * 70.0)) * smoothstep(0.5, 0.05, d) * vSpikes * 0.8;
  float a = (core + spikes) * vTwinkle;
  vec3 color = vHue < 0.62 ? uStar : (vHue < 0.8 ? uTeal : (vHue < 0.92 ? uRose : uGold));
  color = mix(color, uStar, core * 0.5);
  gl_FragColor = vec4(color * a * 2.0, a);
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
    sizes[i] = 0.7 + random() ** 7 * 4
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
      uAspect: { value: 1 },
      uPointer: { value: new Vector2(0.5, 0.5) },
      uHover: { value: 0 },
      uPulse: { value: 1 },
      uPulsePos: { value: new Vector2(0.5, 0.5) },
      uStar: { value: brandColor('starlight') },
      uTeal: { value: brandColor('nebula-teal') },
      uRose: { value: brandColor('nebula-rose') },
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
  scroll: number,
  field: PointerField | undefined
) {
  const { uniforms } = material
  if (uniforms.uTime) uniforms.uTime.value += delta
  if (uniforms.uScroll) uniforms.uScroll.value = scroll
  if (uniforms.uPixelRatio) uniforms.uPixelRatio.value = state.viewport.dpr
  if (uniforms.uAspect && state.camera instanceof PerspectiveCamera) {
    uniforms.uAspect.value = state.camera.aspect
  }
  if (field) {
    uniforms.uPointer?.value.set(field.x, field.y)
    uniforms.uPulsePos?.value.set(field.pulseX, field.pulseY)
    if (uniforms.uHover) uniforms.uHover.value = field.hover
    if (uniforms.uPulse) uniforms.uPulse.value = field.pulse
  }
}

export interface StarfieldProps {
  /** 0–1 scroll progress of the section (e.g. from useScrollProgress). */
  scrollRef?: RefObject<number>
  /** Makes the stars part around the pointer and scatter on a click. */
  fieldRef?: RefObject<PointerField>
  /** Draw order; raise it to land over something transparent. */
  renderOrder?: number
}

/**
 * About 3,000 twinkling stars, drawn as points (no triangles), spread in
 * depth so scroll gives them parallax.
 */
export function Starfield({
  scrollRef,
  fieldRef,
  renderOrder = -50,
}: StarfieldProps) {
  const [stars] = useState(createStars)
  useEffect(
    () => () => {
      stars.geometry.dispose()
      stars.material.dispose()
    },
    [stars]
  )

  useFrame((state, delta) => {
    step(
      stars.material,
      state,
      delta,
      scrollRef?.current ?? 0,
      fieldRef?.current
    )
  })

  return (
    <points
      geometry={stars.geometry}
      material={stars.material}
      frustumCulled={false}
      renderOrder={renderOrder}
    />
  )
}
