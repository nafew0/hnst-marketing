'use client'

import { type RootState, useFrame } from '@react-three/fiber'
import { type RefObject, useEffect, useState } from 'react'
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
import type { PointerField } from './pointer-field'

// Domain-warped fbm (5 octaves): one warp field q, then the density sampled
// through it, plus one low-frequency call that places the clouds. Rendered at a
// third of the resolution, so the full-view pass holds 60 fps.
const FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uDensity;
uniform float uAspect;
uniform vec2 uParallax;
uniform float uLight;
uniform vec2 uLightPos;
uniform vec2 uPointer;
uniform float uHover;
uniform float uPulse;
uniform vec2 uPulsePos;
uniform vec3 uVoid;
uniform vec3 uTeal;
uniform vec3 uGlow;
uniform vec3 uRose;
uniform vec3 uHot;
varying vec2 vUv;
${SIMPLEX_3D}
${FBM_5}
void main() {
  vec2 aspect = vec2(uAspect, 1.0);
  vec2 p = (vUv - 0.5) * aspect * 1.1 + uParallax;
  float t = uTime;

  // The gas leans away from the pointer, and a click sends a ring through it.
  vec2 fromPointer = (vUv - uPointer) * aspect;
  p += fromPointer * exp(-dot(fromPointer, fromPointer) * 12.0) * 0.14 * uHover;
  vec2 fromPulse = (vUv - uPulsePos) * aspect;
  float pulseRadius = length(fromPulse);
  float ring = exp(-pow((pulseRadius - uPulse * 1.5) * 6.0, 2.0)) * (1.0 - uPulse);
  p += fromPulse / max(pulseRadius, 0.001) * ring * 0.16;

  vec2 q = vec2(fbm(vec3(p * 0.5, t)), fbm(vec3(p * 0.5 + vec2(5.2, 1.3), t)));
  float f = fbm(vec3(p + 2.4 * q, t * 0.7));

  // Clouds with open space around them: one body of gas around uLightPos and a
  // few stray wisps, instead of a ceiling of purple over the whole frame.
  vec2 fromCore = (vUv - uLightPos) * aspect;
  // Sized by the shorter side, so a phone gets a cloud and not a full screen.
  float short_ = min(uAspect, 1.0);
  float body = exp(-dot(fromCore, fromCore) * 5.2 / (short_ * short_));
  float stray = smoothstep(0.54, 0.78, fbm(vec3(p * 0.42 + 7.0, t * 0.3))) * 0.3 * short_;
  float presence = clamp(body + stray, 0.0, 1.0);
  float density = clamp((f - 0.44 + q.x * 0.1) * 2.1 * uDensity, 0.0, 1.0) * presence;

  // Teal at the thin edges, violet through the body, rose and white at the core.
  vec3 color = uVoid;
  color = mix(color, uTeal * 0.3, smoothstep(0.01, 0.24, density));
  color = mix(color, uGlow * 0.5, smoothstep(0.2, 0.46, density));
  color = mix(color, uRose * 0.72, smoothstep(0.42, 0.72, density));
  color = mix(color, uHot * 0.9, smoothstep(0.74, 1.0, density) * 0.7);
  // Fine mottling, so large areas never read as a flat fill.
  color *= 0.78 + 0.44 * fbm(vec3(p * 3.4 + q, t * 0.4));

  // Dark dust lanes cut through the bright gas.
  float lane = pow(1.0 - abs(snoise(vec3(p * 2.1 + q * 1.8, t * 0.5))), 7.0);
  color *= 1.0 - lane * 0.85 * smoothstep(0.2, 0.55, density);

  // "Light from behind" at the core, and a soft glow that follows the pointer.
  float d = length(fromCore);
  color += uGlow * uLight * exp(-d * 3.5) * (0.3 + density);
  color += mix(uTeal, uRose, density) * exp(-dot(fromPointer, fromPointer) * 16.0) * (0.06 + density) * 0.3 * uHover;
  color += uHot * ring * 0.035;

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
      uPointer: { value: new Vector2(0.5, 0.5) },
      uHover: { value: 0 },
      uPulse: { value: 1 },
      uPulsePos: { value: new Vector2(0.5, 0.5) },
      uVoid: { value: brandColor('void-deep') },
      uTeal: { value: brandColor('nebula-teal') },
      uGlow: { value: brandColor('nebula-glow') },
      uRose: { value: brandColor('nebula-rose') },
      uHot: { value: brandColor('starlight') },
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
  field: PointerField | undefined
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
  const { field } = settings
  if (field) {
    uniforms.uPointer?.value.set(field.x, field.y)
    uniforms.uPulsePos?.value.set(field.pulseX, field.pulseY)
    if (uniforms.uHover) uniforms.uHover.value = field.hover
    if (uniforms.uPulse) uniforms.uPulse.value = field.pulse
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
  /** Makes the gas react to hover and clicks. */
  fieldRef?: RefObject<PointerField>
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
  fieldRef,
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
      field: fieldRef?.current,
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
