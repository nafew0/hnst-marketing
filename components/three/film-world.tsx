'use client'

import { useFrame } from '@react-three/fiber'
import { type RefObject, useEffect, useRef, useState } from 'react'
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  type Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three'

import { brandColor } from './color'
import { DuneTerrain } from './dune-terrain'
import { FBM_5, FULLSCREEN_VERTEX, SIMPLEX_3D } from './glsl'
import { seededRandom } from './gold-material'
import { StudioLights } from './studio-lights'

/** Chapter ends, shared with the captions in `copy.ts`. */
const CHAPTER_ONE_END = 0.34
const CHAPTER_TWO_END = 0.68

/** The clutter and the constellation float this high over the dunes. */
const SKY_Y = 24

const CARD_COUNT = 300
const PARTICLE_COUNT = 3600
const NODE_COUNT = 26
const NODE_RING = 1.95
const CABLE_COUNT = 5
const ALERT_COUNT = 14
/** The veil is renderOrder 50 and paints over everything opaque. */
const OVER_VEIL = 55

const smooth = MathUtils.smoothstep

// The gas of every chapter in one shader: cold fog that warms to the nebula,
// then a veil that thins out from its gaps, showing the dunes behind it.
const VEIL_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uAspect;
uniform float uWarm;
uniform float uGlow;
uniform float uThin;
uniform vec3 uVoid;
uniform vec3 uFogDark;
uniform vec3 uFogLight;
uniform vec3 uDeep;
uniform vec3 uHaze;
uniform vec3 uBright;
varying vec2 vUv;
${SIMPLEX_3D}
${FBM_5}
void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0) * 1.3;
  vec2 q = vec2(fbm(vec3(p * 0.5, uTime)), fbm(vec3(p * 0.5 + vec2(5.2, 1.3), uTime)));
  float f = fbm(vec3(p + 2.2 * q, uTime * 0.7));
  float density = clamp((f - 0.42) * 2.6, 0.0, 1.0);
  vec3 cold = mix(uFogDark, uFogLight, smoothstep(0.1, 0.9, density));
  vec3 warm = mix(uVoid, uDeep, smoothstep(0.02, 0.32, density));
  warm = mix(warm, uHaze, smoothstep(0.22, 0.66, density));
  warm = mix(warm, uBright, smoothstep(0.58, 1.0, density) * 0.9);
  vec3 color = mix(cold, warm, uWarm);
  float d = length((vUv - 0.5) * vec2(uAspect, 1.0));
  color += uBright * uGlow * exp(-d * 2.6) * (0.4 + density);
  float alpha = smoothstep(uThin - 0.5, uThin + 0.5, density + 0.5);
  gl_FragColor = vec4(color, alpha);
}
`

const PARTICLE_VERTEX = /* glsl */ `
uniform float uForm;
uniform float uFade;
uniform float uPixelRatio;
attribute vec3 aEnd;
attribute float aSeed;
varying float vTwinkle;
void main() {
  // Out of the card, around the vortex, into a node of the constellation.
  float swirl = smoothstep(0.0, 0.55, uForm);
  float settle = smoothstep(0.45, 1.0, uForm);
  float radius = mix(length(position.xy), 1.2 + aSeed * 3.2, swirl);
  float angle = atan(position.y, position.x) + swirl * (2.6 + aSeed * 2.4);
  vec3 vortex = vec3(cos(angle) * radius, sin(angle) * radius, position.z * (1.0 - swirl * 0.8));
  vec3 p = mix(vortex, aEnd, settle);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1.4 + aSeed * 1.8 + settle * 0.6) * uPixelRatio * (16.0 / -mv.z);
  vTwinkle = (0.65 + 0.35 * sin(aSeed * 40.0 + uForm * 14.0)) * uFade;
}
`

const PARTICLE_FRAGMENT = /* glsl */ `
uniform vec3 uGold;
uniform vec3 uLight;
varying float vTwinkle;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(mix(uGold, uLight, a * a) * a * vTwinkle, a * vTwinkle);
}
`

interface FilmParts {
  card: BoxGeometry
  cards: InstancedMesh
  cardMaterial: MeshPhysicalMaterial
  bases: { position: Vector3; axis: Vector3; speed: number; phase: number }[]
  cables: { group: Mesh[]; material: MeshPhysicalMaterial }
  alerts: InstancedMesh
  alertGeometry: SphereGeometry
  alertMaterial: MeshPhysicalMaterial
  alertOf: number[]
  veil: ShaderMaterial
  particles: BufferGeometry
  particleMaterial: ShaderMaterial
  nodes: Vector3[]
  lines: LineSegments
  lineMaterial: LineBasicMaterial
}

function nodePosition(index: number) {
  // A slightly uneven ring, so it reads as stars and not as a diagram.
  const angle = (index / NODE_COUNT) * Math.PI * 2
  const wobble = 1 + 0.12 * Math.sin(index * 2.4)
  return new Vector3(
    Math.cos(angle) * NODE_RING * wobble * 1.25,
    Math.sin(angle) * NODE_RING * wobble * 0.85,
    Math.sin(index * 1.7) * 0.5
  )
}

function createCards(random: () => number) {
  const card = new BoxGeometry(0.62, 0.42, 0.006)
  const cardMaterial = new MeshPhysicalMaterial({
    color: brandColor('starlight'),
    roughness: 0.35,
    metalness: 0.25,
    // Drawn with the transparent pass, so it lands on top of the veil.
    transparent: true,
  })
  const cards = new InstancedMesh(card, cardMaterial, CARD_COUNT)
  cards.renderOrder = OVER_VEIL
  const tint = new Color()
  const bases = Array.from({ length: CARD_COUNT }, (_, i) => {
    const base = {
      position: new Vector3(
        (random() - 0.5) * 11,
        (random() - 0.5) * 6.6,
        6 - random() * 24
      ),
      axis: new Vector3(
        random() - 0.5,
        random() - 0.5,
        random() - 0.5
      ).normalize(),
      speed: 1.5 + random() * 3,
      phase: random() * Math.PI * 2,
    }
    tint
      .copy(brandColor('silver'))
      .lerp(brandColor('nebula-tint'), random() * 0.5)
    tint.multiplyScalar(0.25 + random() * 0.75)
    cards.setColorAt(i, tint)
    return base
  })
  cards.frustumCulled = false
  return { card, cards, cardMaterial, bases }
}

function createCables(random: () => number) {
  const material = new MeshPhysicalMaterial({
    color: brandColor('void-3'),
    roughness: 0.4,
    metalness: 0.6,
    transparent: true,
  })
  const group = Array.from({ length: CABLE_COUNT }, () => {
    const points = Array.from(
      { length: 12 },
      () =>
        new Vector3(
          (random() - 0.5) * 9,
          (random() - 0.5) * 5,
          4 - random() * 12
        )
    )
    const mesh = new Mesh(
      new TubeGeometry(new CatmullRomCurve3(points), 120, 0.012, 6),
      material
    )
    mesh.frustumCulled = false
    mesh.renderOrder = OVER_VEIL
    return mesh
  })
  return { group, material }
}

function createParticles(random: () => number, nodes: Vector3[]) {
  const starts = new Float32Array(PARTICLE_COUNT * 3)
  const ends = new Float32Array(PARTICLE_COUNT * 3)
  const seeds = new Float32Array(PARTICLE_COUNT)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    starts[i * 3] = (random() - 0.5) * 11
    starts[i * 3 + 1] = (random() - 0.5) * 6.6
    starts[i * 3 + 2] = 4 - random() * 16
    const node = nodes[i % NODE_COUNT]
    // Most of the dust falls tight on a node; the rest stays as a loose haze.
    const spread = i % 5 === 0 ? 0.6 : 0.07
    ends[i * 3] = (node?.x ?? 0) + (random() - 0.5) * spread
    ends[i * 3 + 1] = (node?.y ?? 0) + (random() - 0.5) * spread
    ends[i * 3 + 2] = (node?.z ?? 0) + (random() - 0.5) * spread
    seeds[i] = random()
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(starts, 3))
  geometry.setAttribute('aEnd', new BufferAttribute(ends, 3))
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1))
  return geometry
}

function createLines(nodes: Vector3[]) {
  const positions: number[] = []
  nodes.forEach((node, i) => {
    const next = nodes[(i + 1) % NODE_COUNT]
    const across = nodes[(i + 7) % NODE_COUNT]
    for (const other of [next, i % 3 === 0 ? across : undefined]) {
      if (other)
        positions.push(node.x, node.y, node.z, other.x, other.y, other.z)
    }
  })
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3)
  )
  const material = new LineBasicMaterial({
    color: brandColor('gold'),
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
  })
  const lines = new LineSegments(geometry, material)
  lines.frustumCulled = false
  lines.renderOrder = OVER_VEIL + 1
  return { lines, lineMaterial: material }
}

function createParts(): FilmParts {
  const random = seededRandom(2023)
  const { card, cards, cardMaterial, bases } = createCards(random)
  const cables = createCables(random)
  const nodes = Array.from({ length: NODE_COUNT }, (_, i) => nodePosition(i))
  const { lines, lineMaterial } = createLines(nodes)

  const alertGeometry = new SphereGeometry(0.035, 10, 8)
  const alertMaterial = new MeshPhysicalMaterial({
    color: brandColor('amber'),
    emissive: brandColor('amber'),
    emissiveIntensity: 2,
    roughness: 0.4,
    transparent: true,
  })
  const alerts = new InstancedMesh(alertGeometry, alertMaterial, ALERT_COUNT)
  alerts.frustumCulled = false
  alerts.renderOrder = OVER_VEIL

  return {
    card,
    cards,
    cardMaterial,
    bases,
    cables,
    alerts,
    alertGeometry,
    alertMaterial,
    alertOf: Array.from({ length: ALERT_COUNT }, () =>
      Math.floor(random() * CARD_COUNT)
    ),
    veil: new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAspect: { value: 1 },
        uWarm: { value: 0 },
        uGlow: { value: 0 },
        uThin: { value: -1 },
        uVoid: { value: brandColor('void') },
        uFogDark: {
          value: brandColor('void-2').lerp(brandColor('nebula-deep'), 0.25),
        },
        uFogLight: {
          value: brandColor('silver').lerp(brandColor('nebula-haze'), 0.82),
        },
        uDeep: { value: brandColor('nebula-deep') },
        uHaze: { value: brandColor('nebula-haze') },
        uBright: { value: brandColor('nebula-glow') },
      },
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader: VEIL_FRAGMENT,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    }),
    particles: createParticles(random, nodes),
    particleMaterial: new ShaderMaterial({
      uniforms: {
        uForm: { value: 0 },
        uFade: { value: 0 },
        uPixelRatio: { value: 1 },
        uGold: { value: brandColor('gold') },
        uLight: { value: brandColor('starlight') },
      },
      vertexShader: PARTICLE_VERTEX,
      fragmentShader: PARTICLE_FRAGMENT,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    }),
    nodes,
    lines,
    lineMaterial,
  }
}

function disposeParts(parts: FilmParts) {
  for (const geometry of [
    parts.card,
    parts.alertGeometry,
    parts.particles,
    parts.lines.geometry,
    ...parts.cables.group.map((mesh) => mesh.geometry),
  ]) {
    geometry.dispose()
  }
  for (const material of [
    parts.cardMaterial,
    parts.cables.material,
    parts.alertMaterial,
    parts.veil,
    parts.particleMaterial,
    parts.lineMaterial,
  ]) {
    material.dispose()
  }
  parts.cards.dispose()
  parts.alerts.dispose()
}

const matrix = new Matrix4()
const position = new Vector3()
const rotation = new Quaternion()
const scale = new Vector3()
const alertPosition = new Vector3()
const lookTarget = new Vector3()

/** One card's dissolve, a little earlier or later depending on where it sits. */
function cardScale(t: number, phase: number) {
  const start = CHAPTER_ONE_END + (phase / (Math.PI * 2)) * 0.12
  return 1 - smooth(t, start, start + 0.1)
}

function poseClutter(parts: FilmParts, t: number) {
  const chaos = 0.4 + smooth(t, 0, CHAPTER_ONE_END) * 0.9
  parts.bases.forEach((base, i) => {
    rotation.setFromAxisAngle(base.axis, base.phase + t * base.speed * 3.2)
    position.copy(base.position)
    position.x += Math.sin(base.phase + t * base.speed * 2) * 0.5 * chaos
    position.y += Math.cos(base.phase * 1.3 + t * base.speed * 2) * 0.4 * chaos
    scale.setScalar(cardScale(t, base.phase))
    parts.cards.setMatrixAt(i, matrix.compose(position, rotation, scale))
  })
  parts.cards.instanceMatrix.needsUpdate = true
  parts.alertOf.forEach((cardIndex, i) => {
    const base = parts.bases[cardIndex]
    if (!base) return
    alertPosition.copy(base.position)
    alertPosition.x += Math.sin(base.phase + t * base.speed * 2) * 0.5 * chaos
    alertPosition.y +=
      Math.cos(base.phase * 1.3 + t * base.speed * 2) * 0.4 * chaos + 0.3
    // A few dots blink, on and off with the scroll: restless, never strobing.
    const blink = Math.sin(base.phase * 5 + t * 34) > 0.1 ? 1 : 0
    scale.setScalar(blink * cardScale(t, base.phase))
    rotation.identity()
    parts.alerts.setMatrixAt(i, matrix.compose(alertPosition, rotation, scale))
  })
  parts.alerts.instanceMatrix.needsUpdate = true
}

/** Fits the ring to a narrow frame: it was composed for landscape. */
function fitRing(ring: Group, aspect: number) {
  ring.scale.setScalar(Math.min(1, aspect / 1.35))
}

/** Forward through the clutter, a held look at the ring, then down to the dunes. */
function poseCamera(camera: PerspectiveCamera, t: number, group: Group) {
  const dolly = smooth(t, 0, CHAPTER_TWO_END)
  const descend = smooth(t, CHAPTER_TWO_END + 0.02, 1)
  const z = 10 - dolly * 2.5
  // Dune pose at glide 0, as `DuneTerrain` holds it for S3.
  camera.position.set(
    0,
    MathUtils.lerp(SKY_Y, 3.4, descend),
    MathUtils.lerp(z, 14, descend)
  )
  const lookY = MathUtils.lerp(SKY_Y, 1.2, smooth(t, CHAPTER_TWO_END + 0.05, 1))
  const lookZ = MathUtils.lerp(z - 12, 2, descend)
  lookTarget.set(0, lookY, lookZ)
  camera.lookAt(lookTarget)
  group.position.set(0, SKY_Y, 0)
}

function setUniform(material: ShaderMaterial, name: string, value: number) {
  const uniform = material.uniforms[name]
  if (uniform) uniform.value = value
}

function poseFilm(
  parts: FilmParts,
  camera: PerspectiveCamera,
  group: Group,
  t: number,
  pixelRatio: number
) {
  poseClutter(parts, t)
  poseCamera(camera, t, group)
  parts.cards.visible = t < CHAPTER_ONE_END + 0.24
  parts.alerts.visible = parts.cards.visible
  const cablesOut = 1 - smooth(t, CHAPTER_ONE_END, CHAPTER_ONE_END + 0.1)
  for (const cable of parts.cables.group) {
    cable.visible = cablesOut > 0.01
    cable.scale.setScalar(MathUtils.lerp(0.92, 1, cablesOut))
  }

  const { veil, particleMaterial, lineMaterial } = parts
  setUniform(veil, 'uTime', t * 2.4)
  setUniform(veil, 'uAspect', camera.aspect)
  setUniform(
    veil,
    'uWarm',
    smooth(t, CHAPTER_ONE_END - 0.06, CHAPTER_ONE_END + 0.1)
  )
  setUniform(
    veil,
    'uGlow',
    smooth(t, CHAPTER_ONE_END, 0.5) *
      (1 - smooth(t, CHAPTER_TWO_END, 0.8)) *
      0.9
  )
  // -1 is solid; above 1 the gas is gone.
  setUniform(
    veil,
    'uThin',
    MathUtils.lerp(-1.1, 2, smooth(t, CHAPTER_TWO_END, 0.97))
  )

  setUniform(
    particleMaterial,
    'uForm',
    smooth(t, CHAPTER_ONE_END, CHAPTER_TWO_END - 0.04)
  )
  setUniform(
    particleMaterial,
    'uFade',
    smooth(t, CHAPTER_ONE_END, CHAPTER_ONE_END + 0.08) *
      (1 - smooth(t, CHAPTER_TWO_END + 0.08, 0.86))
  )
  setUniform(particleMaterial, 'uPixelRatio', pixelRatio)
  lineMaterial.opacity =
    smooth(t, CHAPTER_TWO_END - 0.1, CHAPTER_TWO_END - 0.02) *
    (1 - smooth(t, CHAPTER_TWO_END + 0.04, 0.8)) *
    0.5
}

/**
 * S2's film, from one progress value (0–1): a dolly through cold clutter; the
 * clutter dissolves into gold that swirls and settles into a ring of 26 points;
 * the camera sinks through a thinning veil and lands exactly where S3's live
 * dunes start. Rendered to frames on `/lab/posters`, not shown live.
 */
export function FilmWorld({ progressRef }: { progressRef: RefObject<number> }) {
  const [parts] = useState(createParts)
  const skyRef = useRef<Group>(null)
  const ringRef = useRef<Group>(null)
  useEffect(() => () => disposeParts(parts), [parts])

  useFrame(({ camera, viewport }) => {
    if (!(camera instanceof PerspectiveCamera) || !skyRef.current) return
    poseFilm(parts, camera, skyRef.current, progressRef.current, viewport.dpr)
    if (ringRef.current) fitRing(ringRef.current, camera.aspect)
  })

  return (
    <>
      <StudioLights />
      <DuneTerrain moveCamera={false} />
      <group ref={skyRef}>
        <primitive object={parts.cards} />
        <primitive object={parts.alerts} />
        {parts.cables.group.map((cable) => (
          <primitive key={cable.uuid} object={cable} />
        ))}
        <group ref={ringRef}>
          <points
            frustumCulled={false}
            renderOrder={60}
            geometry={parts.particles}
            material={parts.particleMaterial}
          />
          <primitive object={parts.lines} />
        </group>
      </group>
      <mesh frustumCulled={false} renderOrder={50} material={parts.veil}>
        <planeGeometry />
      </mesh>
    </>
  )
}
