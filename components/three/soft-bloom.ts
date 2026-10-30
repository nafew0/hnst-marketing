import {
  HalfFloatType,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  type Texture,
  Vector2,
  WebGLRenderTarget,
  type WebGLRenderer,
} from 'three'

import { FULLSCREEN_VERTEX } from './glsl'

/**
 * Dual-filter bloom (Bjørge, "Bandwidth-Efficient Rendering", SIGGRAPH 2015):
 * a soft-knee threshold, four downsamples starting at quarter resolution,
 * then tent upsamples that add each level back in. Every pass runs at
 * quarter resolution or below, and the viewport composite adds the result,
 * so nothing writes to the full-size multisampled scene target.
 * UnrealBloomPass blended back into that target and cost the hero about 5 ms
 * a frame; glow has no detail to lose at a quarter of the size.
 */

const LEVELS = 4

const DOWN = /* glsl */ `
uniform sampler2D tSource;
uniform vec2 uTexel;
uniform float uThreshold;
varying vec2 vUv;
vec3 bright(vec3 c) {
  if (uThreshold < 0.0) return c;
  float peak = max(c.r, max(c.g, c.b));
  float knee = uThreshold * 0.5;
  float soft = clamp(peak - uThreshold + knee, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 1e-4);
  return c * max(soft, peak - uThreshold) / max(peak, 1e-4);
}
void main() {
  vec3 sum = bright(texture2D(tSource, vUv).rgb) * 4.0;
  sum += bright(texture2D(tSource, vUv - uTexel).rgb);
  sum += bright(texture2D(tSource, vUv + uTexel).rgb);
  sum += bright(texture2D(tSource, vUv + vec2(uTexel.x, -uTexel.y)).rgb);
  sum += bright(texture2D(tSource, vUv - vec2(uTexel.x, -uTexel.y)).rgb);
  gl_FragColor = vec4(sum / 8.0, 1.0);
}
`

const UP = /* glsl */ `
uniform sampler2D tSource;
uniform sampler2D tBase;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  vec2 h = uTexel * 0.5;
  vec3 sum = texture2D(tSource, vUv + vec2(-h.x * 2.0, 0.0)).rgb;
  sum += texture2D(tSource, vUv + vec2(-h.x, h.y)).rgb * 2.0;
  sum += texture2D(tSource, vUv + vec2(0.0, h.y * 2.0)).rgb;
  sum += texture2D(tSource, vUv + vec2(h.x, h.y)).rgb * 2.0;
  sum += texture2D(tSource, vUv + vec2(h.x * 2.0, 0.0)).rgb;
  sum += texture2D(tSource, vUv + vec2(h.x, -h.y)).rgb * 2.0;
  sum += texture2D(tSource, vUv + vec2(0.0, -h.y * 2.0)).rgb;
  sum += texture2D(tSource, vUv + vec2(-h.x, -h.y)).rgb * 2.0;
  gl_FragColor = vec4(texture2D(tBase, vUv).rgb + sum / 12.0, 1.0);
}
`

export interface SoftBloom {
  /** down[0] is a quarter of the scene's size, each next level half again. */
  down: WebGLRenderTarget[]
  /** up[i] matches down[i]; up[0] is the finished bloom. */
  up: WebGLRenderTarget[]
  downMaterial: ShaderMaterial
  upMaterial: ShaderMaterial
  quad: Mesh
  scene: Scene
  camera: OrthographicCamera
}

function createTarget() {
  return new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    depthBuffer: false,
  })
}

export function createBloom(): SoftBloom {
  const downMaterial = new ShaderMaterial({
    uniforms: {
      tSource: { value: null },
      uTexel: { value: new Vector2() },
      uThreshold: { value: 1 },
    },
    vertexShader: FULLSCREEN_VERTEX,
    fragmentShader: DOWN,
    depthTest: false,
    depthWrite: false,
  })
  const upMaterial = new ShaderMaterial({
    uniforms: {
      tSource: { value: null },
      tBase: { value: null },
      uTexel: { value: new Vector2() },
    },
    vertexShader: FULLSCREEN_VERTEX,
    fragmentShader: UP,
    depthTest: false,
    depthWrite: false,
  })
  const quad = new Mesh(new PlaneGeometry(), downMaterial)
  quad.frustumCulled = false
  const scene = new Scene()
  scene.add(quad)
  return {
    down: Array.from({ length: LEVELS }, createTarget),
    up: Array.from({ length: LEVELS - 1 }, createTarget),
    downMaterial,
    upMaterial,
    quad,
    scene,
    // The vertex shader ignores it; render() just needs a camera.
    camera: new OrthographicCamera(),
  }
}

/** The finished bloom, for the composite to add. */
export function bloomTexture(bloom: SoftBloom): Texture | null {
  return bloom.up[0]?.texture ?? null
}

export function resizeBloom(bloom: SoftBloom, width: number, height: number) {
  for (let level = 0; level < LEVELS; level++) {
    const scale = 2 ** (level + 2)
    const levelWidth = Math.max(1, Math.round(width / scale))
    const levelHeight = Math.max(1, Math.round(height / scale))
    bloom.down[level]?.setSize(levelWidth, levelHeight)
    bloom.up[level]?.setSize(levelWidth, levelHeight)
  }
}

function texelOf(
  target: { width: number; height: number },
  out: Vector2,
  scale = 1
) {
  out.set(scale / target.width, scale / target.height)
}

function pass(
  bloom: SoftBloom,
  renderer: WebGLRenderer,
  material: ShaderMaterial,
  target: WebGLRenderTarget
) {
  bloom.quad.material = material
  renderer.setRenderTarget(target)
  renderer.render(bloom.scene, bloom.camera)
}

/**
 * Renders the bloom of `source` (the resolved scene). Leaves the renderer's
 * target changed: the caller restores it.
 */
export function renderBloom(
  bloom: SoftBloom,
  renderer: WebGLRenderer,
  source: Texture,
  threshold: number
) {
  const down = bloom.downMaterial.uniforms
  const up = bloom.upMaterial.uniforms
  let input = source
  bloom.down.forEach((target, level) => {
    if (down.tSource) down.tSource.value = input
    // Half a destination texel: with bilinear taps, the five samples spread
    // over the footprint even on the first, 4x step.
    if (down.uTexel) texelOf(target, down.uTexel.value, 0.5)
    if (down.uThreshold) down.uThreshold.value = level === 0 ? threshold : -1
    pass(bloom, renderer, bloom.downMaterial, target)
    input = target.texture
  })
  let smaller = bloom.down[LEVELS - 1]
  for (let level = LEVELS - 2; level >= 0; level--) {
    const target = bloom.up[level]
    const base = bloom.down[level]
    if (!target || !base || !smaller) continue
    if (up.tSource) up.tSource.value = smaller.texture
    if (up.tBase) up.tBase.value = base.texture
    if (up.uTexel) texelOf(smaller, up.uTexel.value)
    pass(bloom, renderer, bloom.upMaterial, target)
    smaller = target
  }
}

export function disposeBloom(bloom: SoftBloom) {
  for (const target of [...bloom.down, ...bloom.up]) target.dispose()
  bloom.downMaterial.dispose()
  bloom.upMaterial.dispose()
  bloom.quad.geometry.dispose()
}
