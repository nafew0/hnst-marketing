'use client'

import { createPortal, type RootState, useFrame } from '@react-three/fiber'
import type { Rect } from 'hamo'
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  type Color,
  CustomBlending,
  HalfFloatType,
  Mesh,
  OneFactor,
  OneMinusSrcAlphaFactor,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
} from 'three'

import { useWebGLRect, type WebGLTransform } from '@/webgl/hooks/use-webgl-rect'
import { useLease } from '@/webgl/utils/awake'

import { brandColor } from './color'
import { TONE } from './glsl'
import { clearTriangles, reportTriangles } from './scene-stats'
import {
  bloomTexture,
  createBloom,
  disposeBloom,
  renderBloom,
  resizeBloom,
  type SoftBloom,
} from './soft-bloom'

/** Brightest channel, in linear light, where bloom starts to pick up. */
const BLOOM_THRESHOLD = 0.82
/**
 * Scales `brand.three.bloomStrength` so the soft bloom matches the spread the
 * brand look was tuned with (UnrealBloomPass, radius 0.55).
 */
const BLOOM_GAIN = 3

export interface SceneCamera {
  fov?: number
  position?: readonly [number, number, number]
  lookAt?: readonly [number, number, number]
}

/**
 * Renders the scene's current frame `width` pixels wide (height follows the
 * element) to a WebP blob: posters and sequence frames.
 */
export type CaptureFn = (width: number) => Promise<Blob | null>

const COMPOSITE_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// The scene target holds premultiplied linear light (opaque meshes write
// alpha 1, the cleared background alpha 0); bloom is added here and may land
// anywhere. Tone mapping and sRGB encoding happen here, once, so the shared
// canvas can stay `linear` + `flat` for Satus. Premultiplied blending lets
// glow over an empty background add light to the page beneath instead of
// being cut off.
const COMPOSITE_FRAGMENT = /* glsl */ `
uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform float uBloom;
uniform float uExposure;
uniform float uFlatten;
uniform vec3 uBackground;
varying vec2 vUv;
${TONE}
void main() {
  vec4 scene = texture2D(tScene, vUv);
  vec3 light = scene.rgb;
  if (uBloom > 0.0) light += texture2D(tBloom, vUv).rgb * uBloom;
  vec3 color = linearToSrgb(acesFilm(light * uExposure));
  float alpha = scene.a;
  if (uFlatten > 0.5) {
    color += linearToSrgb(uBackground) * (1.0 - alpha);
    alpha = 1.0;
  }
  gl_FragColor = vec4(color, alpha);
}
`

interface Viewport {
  scene: Scene
  camera: PerspectiveCamera
  target: WebGLRenderTarget
  bloom: SoftBloom | null
  composite: ShaderMaterial
  size: { width: number; height: number; dpr: number }
  placed: { x: number; y: number; width: number; height: number }
  visible: boolean
  drawn: boolean
}

function createViewport(
  camera: SceneCamera,
  bloomStrength: number,
  background: Color
): Viewport {
  const perspective = new PerspectiveCamera(camera.fov ?? 35, 1, 0.05, 200)
  perspective.position.set(...(camera.position ?? [0, 0, 6]))
  perspective.lookAt(...(camera.lookAt ?? [0, 0, 0]))
  const target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    samples: 4,
  })
  const bloom = bloomStrength > 0 ? createBloom() : null
  return {
    scene: new Scene(),
    camera: perspective,
    target,
    bloom,
    composite: new ShaderMaterial({
      uniforms: {
        tScene: { value: target.texture },
        tBloom: { value: bloom ? bloomTexture(bloom) : null },
        uBloom: { value: 0 },
        uExposure: { value: 1 },
        uFlatten: { value: 0 },
        uBackground: { value: background },
      },
      vertexShader: COMPOSITE_VERTEX,
      fragmentShader: COMPOSITE_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: CustomBlending,
      blendSrc: OneFactor,
      blendDst: OneMinusSrcAlphaFactor,
      blendSrcAlpha: OneFactor,
      blendDstAlpha: OneMinusSrcAlphaFactor,
    }),
    size: { width: 0, height: 0, dpr: 0 },
    placed: { x: 0, y: 0, width: 0, height: 0 },
    visible: false,
    drawn: false,
  }
}

function disposeViewport(viewport: Viewport) {
  viewport.target.dispose()
  if (viewport.bloom) disposeBloom(viewport.bloom)
  viewport.composite.dispose()
}

function place(viewport: Viewport, transform: WebGLTransform) {
  viewport.visible = transform.isVisible
  viewport.placed.x = transform.position.x
  viewport.placed.y = transform.position.y
  viewport.placed.width = transform.scale.x
  viewport.placed.height = transform.scale.y
}

function setUniform(material: ShaderMaterial, name: string, value: number) {
  const uniform = material.uniforms[name]
  if (uniform) uniform.value = value
}

function configure(viewport: Viewport, exposure: number, bloom: number) {
  setUniform(viewport.composite, 'uExposure', exposure)
  setUniform(
    viewport.composite,
    'uBloom',
    viewport.bloom ? bloom * BLOOM_GAIN : 0
  )
}

/** Resizes the target to the placed box at the capped DPR. */
function fit(viewport: Viewport, dpr: number) {
  const { width, height } = viewport.placed
  if (width < 1 || height < 1) return false
  const pixelWidth = Math.max(1, Math.round(width * dpr))
  const pixelHeight = Math.max(1, Math.round(height * dpr))
  if (
    viewport.size.width !== pixelWidth ||
    viewport.size.height !== pixelHeight
  ) {
    viewport.size.width = pixelWidth
    viewport.size.height = pixelHeight
    viewport.target.setSize(pixelWidth, pixelHeight)
    if (viewport.bloom) resizeBloom(viewport.bloom, pixelWidth, pixelHeight)
    viewport.camera.aspect = width / height
    viewport.camera.updateProjectionMatrix()
  }
  viewport.size.dpr = dpr
  return true
}

/** True exactly once: the first frame this viewport drew. */
function markDrawn(viewport: Viewport) {
  if (viewport.drawn) return false
  viewport.drawn = true
  return true
}

function draw(viewport: Viewport, state: RootState) {
  const { gl } = state
  const previousTarget = gl.getRenderTarget()
  const previousAlpha = gl.getClearAlpha()
  gl.setRenderTarget(viewport.target)
  gl.setClearAlpha(0)
  gl.clear(true, true, true)
  gl.render(viewport.scene, viewport.camera)
  const triangles = gl.info.render.triangles
  if (viewport.bloom) {
    renderBloom(viewport.bloom, gl, viewport.target.texture, BLOOM_THRESHOLD)
  }
  gl.setRenderTarget(previousTarget)
  gl.setClearAlpha(previousAlpha)
  return triangles
}

/**
 * Re-renders the scene at exactly `outputWidth` pixels (the live target
 * follows the canvas DPR, which drops under load), then draws the composite
 * into an 8-bit target, flattened on the background. The next frame's `fit`
 * restores the live size.
 */
async function capture(
  viewport: Viewport,
  state: RootState,
  outputWidth: number
): Promise<Blob | null> {
  if (!fit(viewport, outputWidth / Math.max(1, viewport.placed.width))) {
    return null
  }
  draw(viewport, state)
  const { width, height } = viewport.size
  const { gl } = state
  const target = new WebGLRenderTarget(width, height)
  const quad = new Mesh(new PlaneGeometry(2, 2), viewport.composite)
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const stage = new Scene()
  stage.add(quad)
  setUniform(viewport.composite, 'uFlatten', 1)
  const previousTarget = gl.getRenderTarget()
  gl.setRenderTarget(target)
  gl.render(stage, camera)
  const pixels = new Uint8Array(width * height * 4)
  gl.readRenderTargetPixels(target, 0, 0, width, height, pixels)
  gl.setRenderTarget(previousTarget)
  setUniform(viewport.composite, 'uFlatten', 0)
  quad.geometry.dispose()
  target.dispose()

  // WebGL rows run bottom-up; flip into the canvas.
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return null
  const image = context.createImageData(width, height)
  const row = width * 4
  for (let y = 0; y < height; y++) {
    image.data.set(
      pixels.subarray((height - 1 - y) * row, (height - y) * row),
      y * row
    )
  }
  context.putImageData(image, 0, 0)
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.84)
  })
}

interface ViewportRendererProps {
  pinTrack?: Rect | undefined
  id: string
  rect: Rect
  camera: SceneCamera
  /** Bloom strength; 0 skips the passes (tiers below 3). */
  bloomStrength: number
  maxDpr: number
  /** Hold the canvas awake while visible (the scene animates). */
  animate: boolean
  exposure: number
  onFirstFrame: () => void
  captureRef: RefObject<CaptureFn | null>
  children: ReactNode
}

/**
 * Canvas side of `ViewportScene`: renders `children` with their own
 * perspective camera into an offscreen target sized to the tracked element
 * (DPR capped by tier), adds bloom when allowed, and shows the result on a
 * plane placed over the element in the shared orthographic canvas. Only
 * visible scenes render; `animate` holds the canvas awake while visible.
 */
export function ViewportRenderer({
  id,
  rect,
  camera,
  bloomStrength,
  maxDpr,
  animate,
  exposure,
  onFirstFrame,
  captureRef,
  pinTrack,
  children,
}: ViewportRendererProps) {
  const [viewport] = useState(() =>
    createViewport(camera, bloomStrength, brandColor('void'))
  )
  const meshRef = useRef<Mesh>(null)
  const stateRef = useRef<RootState>(null)
  const lease = useLease()

  useEffect(() => () => disposeViewport(viewport), [viewport])
  useEffect(() => () => clearTriangles(id), [id])
  useEffect(() => {
    configure(viewport, exposure, bloomStrength)
  }, [viewport, exposure, bloomStrength])

  useEffect(() => {
    // Reads the live root state at call time, not a render-time snapshot.
    captureRef.current = async (width) => {
      const state = stateRef.current
      return state ? capture(viewport, state, width) : null
    }
    return () => {
      captureRef.current = null
    }
  }, [captureRef, viewport])

  useWebGLRect(
    rect,
    (transform) => {
      place(viewport, transform)
      const mesh = meshRef.current
      if (mesh) {
        mesh.position.set(transform.position.x, transform.position.y, 0)
        mesh.scale.set(transform.scale.x, transform.scale.y, 1)
        mesh.visible = transform.isVisible
        mesh.updateMatrix()
      }
      if (animate && transform.isVisible) lease.acquire()
      else lease.release()
    },
    pinTrack
  )

  useFrame((state) => {
    stateRef.current = state
    if (!viewport.visible) {
      // Off screen draws nothing, so it counts nothing towards the budget.
      clearTriangles(id)
      return
    }
    const dpr = Math.min(state.viewport.dpr, maxDpr)
    if (!fit(viewport, dpr)) return
    reportTriangles(id, draw(viewport, state))
    if (markDrawn(viewport)) onFirstFrame()
  })

  return (
    <>
      <mesh
        ref={meshRef}
        matrixAutoUpdate={false}
        visible={false}
        frustumCulled={false}
        renderOrder={-10}
      >
        <planeGeometry />
        <primitive object={viewport.composite} attach="material" />
      </mesh>
      {createPortal(children, viewport.scene, { camera: viewport.camera })}
    </>
  )
}
