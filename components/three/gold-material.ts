import {
  DataTexture,
  LinearMipmapLinearFilter,
  MeshPhysicalMaterial,
  RepeatWrapping,
  RGBAFormat,
  Vector2,
} from 'three'

import { brand } from '@/brand.config'

import { brandColor } from './color'

/** Deterministic PRNG (mulberry32): posters render the same every time. */
export function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d_2b_79_f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

let brushed: DataTexture | null = null

/**
 * 256² tangent-space normal map of fine streaks running along X: the
 * brushed-metal feel. Built once and shared by every gold material.
 */
export function brushedNormalMap(): DataTexture {
  if (brushed) return brushed
  const size = 256
  const random = seededRandom(7)
  const rows = Float32Array.from({ length: size }, () => random() * 2 - 1)
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    const slope = ((rows[(y + 1) % size] ?? 0) - (rows[y] ?? 0)) * 0.6
    for (let x = 0; x < size; x++) {
      const dx = (random() * 2 - 1) * 0.04
      const dy = slope + (random() * 2 - 1) * 0.05
      const length = Math.hypot(dx, dy, 1)
      const index = (y * size + x) * 4
      data[index] = Math.round(((dx / length) * 0.5 + 0.5) * 255)
      data[index + 1] = Math.round(((dy / length) * 0.5 + 0.5) * 255)
      data[index + 2] = Math.round(((1 / length) * 0.5 + 0.5) * 255)
      data[index + 3] = 255
    }
  }
  brushed = new DataTexture(data, size, size, RGBAFormat)
  brushed.wrapS = RepeatWrapping
  brushed.wrapT = RepeatWrapping
  brushed.generateMipmaps = true
  brushed.minFilter = LinearMipmapLinearFilter
  brushed.needsUpdate = true
  return brushed
}

export interface GoldOptions {
  roughness?: number
  clearcoat?: number
}

/** Brushed brand gold: metalness 1, roughness and clearcoat from brand.three. */
export function goldMaterial({
  roughness = brand.three.goldRoughness,
  clearcoat = brand.three.goldClearcoat,
}: GoldOptions = {}): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: brandColor('gold'),
    metalness: 1,
    roughness,
    clearcoat,
    clearcoatRoughness: 0.18,
    normalMap: brushedNormalMap(),
    normalScale: new Vector2(0.18, 0.18),
    envMapIntensity: 1.15,
  })
}

/** Lab sliders and scroll-driven looks retune a material in place. */
export function tuneGold(
  material: MeshPhysicalMaterial,
  { roughness, clearcoat }: GoldOptions
) {
  if (roughness !== undefined) material.roughness = roughness
  if (clearcoat !== undefined) material.clearcoat = clearcoat
}

/** Dark, glossy, see-through: the "smoked glass" half of the platter props. */
export function smokedGlassMaterial(): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: brandColor('void-3'),
    metalness: 0,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.45,
    envMapIntensity: 1.4,
  })
}
