'use client'

import { type RootState, useFrame } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import {
  HalfFloatType,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  type WebGLRenderer,
} from 'three'

import { brand } from '@/brand.config'

import { brandColor } from './color'
import { FBM_5, FULLSCREEN_VERTEX, SIMPLEX_3D } from './glsl'

// Domain-warped fbm (5 octaves): one warp field q, then the density sampled
// through it. Three fbm calls per pixel keep the full-view pass at 60 fps; a
// second warp level (five calls) looked the same at this drift speed.
const FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uDensity;
uniform float uAspect;
uniform vec2 uParallax;
uniform float uLight;
uniform vec2 uLightPos;
uniform vec3 uVoid;
uniform vec3 uDeep;
uniform vec3 uHaze;
uniform vec3 uGlow;
uniform vec3 uTint;
varying vec2 vUv;
${SIMPLEX_3D}
${FBM_5}
void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0) * 1.1 + uParallax;
  float t = uTime;
  // The warp field is sampled at half frequency so cloud edges stay soft.
  vec2 q = vec2(fbm(vec3(p * 0.5, t)), fbm(vec3(p * 0.5 + vec2(5.2, 1.3), t)));
  float f = fbm(vec3(p + 2.4 * q, t * 0.7));
  // fbm sits around 0.5: below ~0.42 is open void, the bright tail is the gas.
  float density = clamp((f - 0.42) * 2.6 * uDensity, 0.0, 1.0);

  vec3 color = mix(uVoid, uDeep, smoothstep(0.02, 0.32, density));
  color = mix(color, uHaze, smoothstep(0.22, 0.66, density));
  color = mix(color, uGlow, smoothstep(0.58, 1.0, density) * 0.9);
  // Lavender light along the thin edges of each cloud.
  float edge = smoothstep(0.16, 0.0, abs(density - 0.42)) * smoothstep(0.2, 0.8, q.x);
  color += uTint * edge * 0.28;
  // "Light from behind": a soft core that brightens the gas when the arc flares.
  vec2 aspect = vec2(uAspect, 1.0);
  float d = distance(vUv * aspect, uLightPos * aspect);
  color += uGlow * uLight * exp(-d * 3.5) * (0.5 + density);

  gl_FragColor = vec4(color, 1.0);
}
`

const DISPLAY = /* glsl */ `
uniform sampler2D uGas;
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(texture2D(uGas, vUv).rgb, 1.0);
}
`

/**
 * The gas renders at a third of the scene's resolution and is upsampled with
 * linear filtering: it has no hard edges, and at full size its fbm cost the
 * hero half its frame rate.
 */
const GAS_SCALE = 1 / 3

interface Gas {
  material: ShaderMaterial
  scene: Scene
  camera: OrthographicCamera
  target: WebGLRenderTarget
  display: ShaderMaterial
}

function createGas(): Gas {
  const material = createMaterial()
  const target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    depthBuffer: false,
  })
  const quad = new Mesh(new PlaneGeometry(), material)
  quad.frustumCulled = false
  const scene = new Scene()
  scene.add(quad)
  return {
    material,
    scene,
    // The vertex shader ignores it; render() just needs a camera.
    camera: new OrthographicCamera(),
    target,
    display: new ShaderMaterial({
      uniforms: { uGas: { value: target.texture } },
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader: DISPLAY,
      depthWrite: false,
      depthTest: false,
    }),
  }
}

function disposeGas(gas: Gas) {
  for (const child of gas.scene.children) {
    if (child instanceof Mesh) child.geometry.dispose()
  }
  gas.material.dispose()
  gas.display.dispose()
  gas.target.dispose()
}

/**
 * Runs from the display quad's onBeforeRender, so the gas only renders when
 * its scene does (a nested render, as three's Reflector does).
 */
function renderGas(gas: Gas, renderer: WebGLRenderer) {
  const outer = renderer.getRenderTarget()
  const width = Math.max(1, Math.round((outer?.width ?? 1) * GAS_SCALE))
  const height = Math.max(1, Math.round((outer?.height ?? 1) * GAS_SCALE))
  if (gas.target.width !== width || gas.target.height !== height) {
    gas.target.setSize(width, height)
  }
  renderer.setRenderTarget(gas.target)
  renderer.render(gas.scene, gas.camera)
  renderer.setRenderTarget(outer)
}

function createMaterial() {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDensity: { value: brand.three.nebulaDensity },
      uAspect: { value: 1 },
      uParallax: { value: new Vector2() },
      uLight: { value: 0 },
      uLightPos: { value: new Vector2(0.7, 0.62) },
      uVoid: { value: brandColor('void-deep') },
      uDeep: { value: brandColor('nebula-deep') },
      uHaze: { value: brandColor('nebula-haze') },
      uGlow: { value: brandColor('nebula-glow') },
      uTint: { value: brandColor('nebula-tint') },
    },
    vertexShader: FULLSCREEN_VERTEX,
    fragmentShader: FRAGMENT,
    depthWrite: false,
    depthTest: false,
  })
}

interface NebulaSettings {
  speed: number
  density: number
  light: number
  lightPosition: readonly [number, number]
  parallax: boolean
}

const pointerTarget = new Vector2()
const DEFAULT_LIGHT_POSITION = [0.7, 0.62] as const

function step(
  material: ShaderMaterial,
  state: RootState,
  delta: number,
  settings: NebulaSettings
) {
  const { uniforms } = material
  if (uniforms.uTime) uniforms.uTime.value += delta * settings.speed
  if (uniforms.uDensity) uniforms.uDensity.value = settings.density
  if (uniforms.uLight) uniforms.uLight.value = settings.light
  uniforms.uLightPos?.value.set(...settings.lightPosition)
  if (uniforms.uAspect && state.camera instanceof PerspectiveCamera) {
    uniforms.uAspect.value = state.camera.aspect
  }
  if (settings.parallax) {
    // Gentle mouse parallax: ease towards 3% of the pointer offset.
    pointerTarget.set(state.pointer.x * 0.03, state.pointer.y * 0.03)
    uniforms.uParallax?.value.lerp(pointerTarget, Math.min(1, delta * 2))
  }
}

export interface NebulaGasProps {
  /** Drift speed; defaults to brand.three.nebulaSpeed. */
  speed?: number
  /** Gas density; defaults to brand.three.nebulaDensity. */
  density?: number
  /** 0–1 "light from behind", raised while the emblem flares. */
  light?: number
  /** Where that light sits, in 0–1 view coordinates (y up). */
  lightPosition?: readonly [number, number]
  /** Mouse parallax (desktop). Default true. */
  parallax?: boolean
}

/**
 * The purple "infinity cloud": a full-view shader behind everything else in
 * the scene, coloured from the nebula palette (deep → haze → glow, tint on
 * the edges). Change `nebula-*` in brand.config.ts and it re-colours.
 */
export function NebulaGas({
  speed = brand.three.nebulaSpeed,
  density = brand.three.nebulaDensity,
  light = 0,
  lightPosition = DEFAULT_LIGHT_POSITION,
  parallax = true,
}: NebulaGasProps) {
  const [gas] = useState(createGas)
  useEffect(() => () => disposeGas(gas), [gas])

  useFrame((state, delta) => {
    step(gas.material, state, delta, {
      speed,
      density,
      light,
      lightPosition,
      parallax,
    })
  })

  return (
    <mesh
      frustumCulled={false}
      renderOrder={-100}
      material={gas.display}
      onBeforeRender={(renderer) => renderGas(gas, renderer)}
    >
      <planeGeometry />
    </mesh>
  )
}
