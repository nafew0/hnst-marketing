'use client'

import { type RootState, useFrame } from '@react-three/fiber'
import { type RefObject, useEffect, useState } from 'react'
import {
  PerspectiveCamera,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from 'three'

import { brandColor } from './color'
import { FULLSCREEN_VERTEX, SIMPLEX_3D } from './glsl'

const SIZE = 60
/** 96² quads ≈ 18.4k triangles, a third of the 60k site budget. */
const SEGMENTS = 96

// The sky, shared with the terrain's fog: distant dunes fade into exactly the
// sky behind them, so the plane never shows an edge on the horizon.
const SKY = /* glsl */ `
uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform vec3 uSun;
vec3 skyColor(vec2 screen) {
  float t = smoothstep(0.35, 1.0, screen.y);
  vec3 color = mix(uHorizon, uZenith, t);
  return color + uSun * exp(-distance(screen, vec2(0.72, 0.42)) * 7.0) * 0.8;
}
`

const TERRAIN_VERTEX = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
varying float vDepth;
varying vec4 vClip;
${SIMPLEX_3D}
float duneHeight(vec2 p) {
  // Long ridged dunes across the view, broad swells, and fine wind ripples.
  float ridge = 1.0 - abs(snoise(vec3(p.x * 0.07, p.y * 0.22, 0.0)));
  float h = pow(ridge, 2.2) * 1.9;
  h += snoise(vec3(p * 0.045, 3.0)) * 1.3;
  h += snoise(vec3(p.x * 0.8, p.y * 2.6, 7.0)) * 0.035;
  return h;
}
void main() {
  vec3 p = position;
  float h = duneHeight(p.xz);
  float e = 0.18;
  vec3 n = normalize(vec3(h - duneHeight(p.xz + vec2(e, 0.0)), e, h - duneHeight(p.xz + vec2(0.0, e))));
  p.y += h;
  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * n);
  vec4 view = viewMatrix * world;
  vDepth = -view.z;
  gl_Position = projectionMatrix * view;
  vClip = gl_Position;
}
`

const TERRAIN_FRAGMENT = /* glsl */ `
uniform vec3 uSunDirection;
uniform vec3 uSand;
uniform vec3 uShadow;
uniform vec3 uSky;
uniform float uFogNear;
uniform float uFogFar;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vDepth;
varying vec4 vClip;
${SKY}
void main() {
  vec3 n = normalize(vNormal);
  vec3 toCamera = normalize(cameraPosition - vWorld);
  float diffuse = max(dot(n, uSunDirection), 0.0);
  // Golden hour: long warm light, cool violet-dusk shadows, glints on crests.
  vec3 color = uShadow * 0.35 + uSky * 0.18 * max(n.y, 0.0);
  color += uSand * uSun * diffuse * 1.7;
  color += uSun * pow(max(dot(reflect(-uSunDirection, n), toCamera), 0.0), 18.0) * 0.35;
  float fog = smoothstep(uFogNear, uFogFar, vDepth);
  vec2 screen = vClip.xy / vClip.w * 0.5 + 0.5;
  gl_FragColor = vec4(mix(color, skyColor(screen), fog), 1.0);
}
`

// Sky behind the dunes: frontier light at the horizon, deepening upwards.
const SKY_FRAGMENT = /* glsl */ `
varying vec2 vUv;
${SKY}
void main() {
  gl_FragColor = vec4(skyColor(vUv), 1.0);
}
`

function createDunes() {
  const geometry = new PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS)
  geometry.rotateX(-Math.PI / 2)
  const sun = brandColor('starlight').lerp(brandColor('gold-frontier'), 0.55)
  const horizon = brandColor('gold-frontier').lerp(brandColor('dust'), 0.4)
  const zenith = brandColor('emberwood').lerp(brandColor('nebula-deep'), 0.7)
  const terrain = new ShaderMaterial({
    uniforms: {
      uSunDirection: { value: new Vector3(0.75, 0.32, -0.4).normalize() },
      uSun: { value: sun },
      uSand: { value: brandColor('dust') },
      uShadow: { value: brandColor('trail') },
      uSky: { value: brandColor('nebula-haze') },
      uHorizon: { value: horizon },
      uZenith: { value: zenith },
      uFogNear: { value: 6 },
      uFogFar: { value: 36 },
    },
    vertexShader: TERRAIN_VERTEX,
    fragmentShader: TERRAIN_FRAGMENT,
  })
  const sky = new ShaderMaterial({
    uniforms: {
      uHorizon: { value: horizon },
      uZenith: { value: zenith },
      uSun: { value: sun },
    },
    vertexShader: FULLSCREEN_VERTEX,
    fragmentShader: SKY_FRAGMENT,
    depthWrite: false,
    depthTest: false,
  })
  return { geometry, terrain, sky }
}

const lookTarget = new Vector3()

/** Camera glide 0–1: from high and far to low over the crests. */
function glide(state: RootState, progress: number) {
  const { camera } = state
  if (!(camera instanceof PerspectiveCamera)) return
  const t = Math.min(1, Math.max(0, progress))
  camera.position.set(0, 3.4 - t * 1.7, 14 - t * 16)
  lookTarget.set(0, 1.2 - t * 0.4, camera.position.z - 12)
  camera.lookAt(lookTarget)
}

export interface DuneTerrainProps {
  /** 0–1 camera glide; read every frame, so a scroll-fed ref costs no renders. */
  cameraGlideRef?: RefObject<number>
  /** Fixed glide when no ref is given. */
  cameraGlide?: number
}

/**
 * S3 "the turn": dunes displaced by simplex noise in the vertex shader, lit by
 * a golden-hour sun with distance fog into the frontier light.
 */
export function DuneTerrain({
  cameraGlideRef,
  cameraGlide = 0,
}: DuneTerrainProps) {
  const [dunes] = useState(createDunes)
  useEffect(
    () => () => {
      dunes.geometry.dispose()
      dunes.terrain.dispose()
      dunes.sky.dispose()
    },
    [dunes]
  )

  useFrame((state) => {
    glide(state, cameraGlideRef?.current ?? cameraGlide)
  })

  return (
    <>
      <mesh frustumCulled={false} renderOrder={-100} material={dunes.sky}>
        <planeGeometry />
      </mesh>
      <mesh
        geometry={dunes.geometry}
        material={dunes.terrain}
        position={[0, -1.5, -12]}
      />
    </>
  )
}
