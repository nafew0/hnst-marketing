'use client'

import { useFrame } from '@react-three/fiber'
import { type RefObject, useEffect, useState } from 'react'
import {
  CustomBlending,
  OneFactor,
  OneMinusSrcAlphaFactor,
  PerspectiveCamera,
  ShaderMaterial,
  Vector2,
} from 'three'

import { brandColor } from './color'
import { FULLSCREEN_VERTEX, SIMPLEX_3D } from './glsl'
import type { PointerField } from './pointer-field'

const LANDSCAPE = { centre: [0.62, -1.02], radius: 1.28, moon: [0.45, 0.84] }
// The crest sits just under the logo; the text below reads on the dark disc.
const PORTRAIT = { centre: [0.5, -0.22], radius: 0.84, moon: [0.82, 0.9] }

const FRAGMENT = /* glsl */ `
uniform float uAspect;
uniform vec2 uCentre;
uniform float uRadius;
uniform vec2 uMoon;
uniform float uLightShift;
uniform vec3 uSurface;
uniform vec3 uGold;
uniform vec3 uHot;
uniform vec3 uTeal;
uniform vec3 uMoonLit;
varying vec2 vUv;
${SIMPLEX_3D}
void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  vec2 centre = vec2(uCentre.x * uAspect, uCentre.y);
  vec2 toP = p - centre;
  float dist = length(toP);
  float edge = dist - uRadius;
  float inside = smoothstep(0.0015, -0.0015, edge);

  // Light comes over the crest and leans towards the pointer.
  vec2 lightDir = normalize(vec2(uLightShift * 0.5, 1.0));
  float lit = pow(max(dot(toP / dist, lightDir), 0.0), 26.0);

  // Thin hot rim, gold atmosphere above it, a teal haze further out.
  float rim = exp(-abs(edge) * 240.0) * (0.2 + lit * 2.2);
  float atmosphere = exp(-max(edge, 0.0) * 13.0) * (1.0 - inside) * (0.05 + lit * 0.5);
  float haze = exp(-max(edge, 0.0) * 5.0) * (1.0 - inside) * 0.05;
  vec3 glow = mix(uGold, uHot, lit * rim * 0.5) * (rim + atmosphere) + uTeal * haze;

  // Night side: nearly black, with faint bands catching the light near the rim.
  float bands = snoise(vec3(toP.x * 3.0, toP.y * 16.0, 2.0)) * 0.5 + 0.5;
  vec3 surface = uSurface * (0.55 + bands * 0.45) + uGold * exp(edge * 22.0) * lit * 0.45;

  // A small far-off moon, lit from the same side.
  vec2 toMoon = p - vec2(uMoon.x * uAspect, uMoon.y);
  float moonSize = 0.026;
  float moonEdge = length(toMoon) - moonSize;
  float moon = smoothstep(0.0015, -0.0015, moonEdge);
  float phase = smoothstep(-0.4, 0.75, dot(toMoon / moonSize, normalize(vec2(0.55, -0.6))));
  vec3 moonColor = uMoonLit * phase * (0.7 + 0.3 * snoise(vec3(toMoon * 90.0, 1.0)));

  float alpha = max(inside, moon);
  vec3 color = surface * inside + moonColor * moon * (1.0 - inside) + glow;
  gl_FragColor = vec4(color, alpha);
}
`

function createMaterial() {
  return new ShaderMaterial({
    uniforms: {
      uAspect: { value: 1 },
      uCentre: { value: new Vector2() },
      uRadius: { value: 1 },
      uMoon: { value: new Vector2() },
      uLightShift: { value: 0 },
      uSurface: { value: brandColor('void-2') },
      uGold: { value: brandColor('gold') },
      uHot: { value: brandColor('starlight') },
      uTeal: { value: brandColor('nebula-teal') },
      uMoonLit: { value: brandColor('dust') },
    },
    vertexShader: FULLSCREEN_VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    // Premultiplied, as the scene target expects: the glow adds, the disc covers.
    blending: CustomBlending,
    blendSrc: OneFactor,
    blendDst: OneMinusSrcAlphaFactor,
    depthWrite: false,
    depthTest: false,
  })
}

function place(
  material: ShaderMaterial,
  aspect: number,
  field: PointerField | undefined
) {
  const { uniforms } = material
  const layout = aspect < 1 ? PORTRAIT : LANDSCAPE
  if (uniforms.uAspect) uniforms.uAspect.value = aspect
  if (uniforms.uRadius) uniforms.uRadius.value = layout.radius
  uniforms.uCentre?.value.set(layout.centre[0], layout.centre[1])
  uniforms.uMoon?.value.set(layout.moon[0], layout.moon[1])
  if (uniforms.uLightShift && field) {
    uniforms.uLightShift.value = (field.x - 0.5) * field.hover
  }
}

/**
 * A dark planet low in the frame, its horizon traced by a thin line of gold
 * light (the brand's planet-rim motif), and one small moon. A full-view shader,
 * so it costs no triangles and stays sharp at any size.
 */
export function PlanetRim({
  fieldRef,
}: {
  fieldRef?: RefObject<PointerField>
}) {
  const [material] = useState(createMaterial)
  useEffect(() => () => material.dispose(), [material])

  useFrame(({ camera }) => {
    if (camera instanceof PerspectiveCamera) {
      place(material, camera.aspect, fieldRef?.current)
    }
  })

  return (
    <mesh frustumCulled={false} renderOrder={-40} material={material}>
      <planeGeometry />
    </mesh>
  )
}
