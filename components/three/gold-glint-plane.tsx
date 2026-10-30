'use client'

import { type RootState, useFrame } from '@react-three/fiber'
import { type RefObject, useEffect, useState } from 'react'
import { PerspectiveCamera, ShaderMaterial, Vector2 } from 'three'

import { brandColor } from './color'
import { FULLSCREEN_VERTEX, SIMPLEX_3D } from './glsl'

const FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uHover;
uniform float uReveal;
uniform float uAspect;
uniform float uCorner;
uniform vec2 uPointer;
uniform vec3 uDark;
uniform vec3 uGold;
uniform vec3 uLight;
varying vec2 vUv;
${SIMPLEX_3D}
void main() {
  vec2 p = vUv;
  // Brushed base: noise stretched hard along x.
  float brush = snoise(vec3(p.x * 2.0, p.y * 150.0, 0.0)) * 0.5 + 0.5;
  vec3 color = mix(uDark, uGold, 0.32 + 0.3 * brush);

  // Anisotropic streak: a band across the brushing that drifts on its own and
  // follows the pointer on hover; brighter where the grain catches it.
  float drift = 0.5 + 0.38 * sin(uTime * 0.45);
  float center = mix(drift, uPointer.x, uHover);
  float across = (p.x - center) * uAspect + (p.y - 0.5) * 0.35;
  float band = exp(-across * across * 40.0);
  // Faint and gold-tinted at rest; hover turns it into a starlight streak.
  vec3 glint = mix(uGold, uLight, 0.35 + 0.65 * uHover);
  color += glint * band * (0.5 + 0.5 * brush) * (0.3 + 1.2 * uHover);

  // Reveal: a molten edge rising from the bottom.
  float wobble = snoise(vec3(p * 4.0, uTime * 0.3)) * 0.05;
  float edge = uReveal * 1.12 - 0.06;
  float shown = step(p.y + wobble, edge);
  float rim = smoothstep(0.045, 0.0, abs(p.y + wobble - edge)) * step(uReveal, 0.999);
  vec3 molten = uLight * rim * 2.4;
  // The canvas sits behind the page, so a card's overflow can't clip this: the
  // rounded corners are cut here. Premultiplied, like the rest of the output.
  vec2 half_ = vec2(uAspect, 1.0) * 0.5;
  vec2 corner = abs((p - 0.5) * vec2(uAspect, 1.0)) - half_ + uCorner;
  float outside = length(max(corner, 0.0)) + min(max(corner.x, corner.y), 0.0) - uCorner;
  float mask = uCorner > 0.0 ? smoothstep(0.0, -0.003, outside) : 1.0;
  gl_FragColor = vec4(color * shown + molten, max(shown, rim)) * mask;
}
`

function createMaterial() {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uHover: { value: 0 },
      uReveal: { value: 1 },
      uAspect: { value: 1 },
      uCorner: { value: 0 },
      uPointer: { value: new Vector2(0.5, 0.5) },
      uDark: { value: brandColor('gold-metal-1') },
      uGold: { value: brandColor('gold') },
      uLight: { value: brandColor('starlight') },
    },
    vertexShader: FULLSCREEN_VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  })
}

function setCorner(material: ShaderMaterial, corner: number) {
  const uniform = material.uniforms.uCorner
  if (uniform) uniform.value = corner
}

function step(
  material: ShaderMaterial,
  state: RootState,
  delta: number,
  hover: number,
  reveal: number,
  pointer: RefObject<{ x: number; y: number }> | undefined
) {
  const { uniforms } = material
  if (uniforms.uTime) uniforms.uTime.value += delta
  if (uniforms.uHover) {
    // Ease hover so a pointer entering or leaving never snaps.
    uniforms.uHover.value +=
      (hover - uniforms.uHover.value) * Math.min(1, delta * 6)
  }
  if (uniforms.uReveal) uniforms.uReveal.value = reveal
  if (uniforms.uAspect && state.camera instanceof PerspectiveCamera) {
    uniforms.uAspect.value = state.camera.aspect
  }
  uniforms.uPointer?.value.set(
    pointer ? pointer.current.x : state.pointer.x * 0.5 + 0.5,
    pointer ? pointer.current.y : state.pointer.y * 0.5 + 0.5
  )
}

export interface GoldGlintPlaneProps {
  /** 0–1: pointer over the card. */
  hover?: number
  /** 0–1: molten reveal from the bottom. */
  reveal?: number
  /** Read every frame instead of `hover`, so moving it costs no renders. */
  hoverRef?: RefObject<number>
  /** Read every frame instead of `reveal`. */
  revealRef?: RefObject<number>
  /** The pointer over this plane (0–1, y up); defaults to the whole window. */
  pointerRef?: RefObject<{ x: number; y: number }>
  /** Rounded corners, as a share of the plane's height. Default none. */
  corner?: number
}

/** Package-card surface: brushed gold with an anisotropic glint. */
export function GoldGlintPlane({
  hover = 0,
  reveal = 1,
  hoverRef,
  revealRef,
  pointerRef,
  corner = 0,
}: GoldGlintPlaneProps) {
  const [material] = useState(createMaterial)
  useEffect(() => () => material.dispose(), [material])
  useEffect(() => {
    setCorner(material, corner)
  }, [material, corner])

  useFrame((state, delta) => {
    step(
      material,
      state,
      delta,
      hoverRef?.current ?? hover,
      revealRef?.current ?? reveal,
      pointerRef
    )
  })

  return (
    <mesh frustumCulled={false} material={material}>
      <planeGeometry />
    </mesh>
  )
}
