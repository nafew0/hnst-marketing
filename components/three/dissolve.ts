import type { Material, MeshPhysicalMaterial } from 'three'

import { brandColor } from './color'

/**
 * Patches a physical material so it dissolves in through object-space value
 * noise, with a molten gold edge. `reveal.value`: below 0 nothing shows, at 1
 * everything does. Each prop owns its uniform, so props appear one by one.
 */
export interface Dissolve {
  reveal: { value: number }
}

const EDGE = brandColor('gold-frontier')

const NOISE = /* glsl */ `
varying vec3 vDissolvePos;
uniform float uReveal;
uniform vec3 uDissolveEdge;
float dissolveHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float dissolveNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(dissolveHash(i), dissolveHash(i + vec3(1, 0, 0)), f.x),
        mix(dissolveHash(i + vec3(0, 1, 0)), dissolveHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(dissolveHash(i + vec3(0, 0, 1)), dissolveHash(i + vec3(1, 0, 1)), f.x),
        mix(dissolveHash(i + vec3(0, 1, 1)), dissolveHash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
`

export function withDissolve(material: MeshPhysicalMaterial): Dissolve {
  const reveal = { value: 1 }
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uReveal = reveal
    shader.uniforms.uDissolveEdge = { value: EDGE }
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vDissolvePos;'
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvDissolvePos = position;'
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${NOISE}`)
      .replace(
        '#include <clipping_planes_fragment>',
        /* glsl */ `#include <clipping_planes_fragment>
float dissolveValue = dissolveNoise(vDissolvePos * 7.0) * 0.98 + 0.01;
if (dissolveValue > uReveal) discard;
float dissolveEdge = 1.0 - smoothstep(0.0, 0.07, uReveal - dissolveValue);`
      )
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uDissolveEdge * dissolveEdge * 4.0 * step(uReveal, 0.999);'
      )
  }
  material.customProgramCacheKey = () => 'honest-dissolve'
  return { reveal }
}

export function disposeAll(materials: Material[]) {
  for (const material of materials) material.dispose()
}
