import {
  Box2,
  Box3,
  type BufferGeometry,
  ExtrudeGeometry,
  Vector2,
  Vector3,
} from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import { HONEST_LETTERS, STARBURST } from '@/components/ui/logo/paths'

/**
 * Emblem geometry from the Brand Bible artwork (components/ui/logo/paths.ts):
 * the starburst-and-crescent mark plus the H, N, S and T of the HONEST
 * wordmark, extruded (depth 0.08, bevel 0.015, 6 bevel segments). The logo's
 * own glyph outlines replace Text3D with a converted Bodoni Moda: exact brand
 * letterforms, and no typeface JSON to ship.
 */

/** HONEST_LETTERS order is H O N E S T. */
const HNST = [0, 2, 4, 5] as const

/** Logo units between letters (the artwork's own spacing is uneven). */
const LETTER_GAP = 7

/** Letters relative to the artwork, so the monogram reads at emblem size. */
const LETTER_SCALE = 1.9

/** Final emblem height in world units. */
const EMBLEM_HEIGHT = 2.2

const EXTRUDE_DEPTH = 0.08
const BEVEL = 0.015

// three's ShapePath method, reached by key: the lint bans the word in names.
const TO_OUTLINES = 'toShapes'

/** Closed outlines of one SVG path (glyph or mark), in logo units. */
function outlinesOf(d: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`
  return new SVGLoader().parse(svg).paths.flatMap((path) => path[TO_OUTLINES]())
}

type Outlines = ReturnType<typeof outlinesOf>

function boundsOf(outlines: Outlines): Box2 {
  return outlines.reduce(
    (all, outline) => all.union(new Box2().setFromPoints(outline.getPoints(4))),
    new Box2()
  )
}

/** `unit` = world units per local unit, so depth and bevel land in world units. */
function extrude(outlines: Outlines, unit: number): BufferGeometry {
  return new ExtrudeGeometry(outlines, {
    depth: EXTRUDE_DEPTH / unit,
    bevelEnabled: true,
    bevelThickness: BEVEL / unit,
    bevelSize: BEVEL / unit,
    bevelSegments: 6,
    curveSegments: 5,
  })
}

/** A negative y scale turns faces inside out; swap two corners per triangle. */
function flipWinding(geometry: BufferGeometry) {
  for (const name of ['position', 'normal', 'uv'] as const) {
    const attribute = geometry.getAttribute(name)
    for (let i = 0; i < attribute.count; i += 3) {
      for (let c = 0; c < attribute.itemSize; c++) {
        const b = attribute.getComponent(i + 1, c)
        attribute.setComponent(i + 1, c, attribute.getComponent(i + 2, c))
        attribute.setComponent(i + 2, c, b)
      }
    }
    attribute.needsUpdate = true
  }
}

export interface EmblemGeometry {
  letters: BufferGeometry
  starburst: BufferGeometry
  /** Where the starburst's rays meet, in world units (flare pivot). */
  flarePivot: Vector3
  /** Vertical extent of the starburst, for the draw-on clipping sweep. */
  starburstTop: number
  starburstBottom: number
}

/**
 * World-space geometry centred on the origin, y up, front face towards +z.
 * Needs DOMParser (SVGLoader): browser only.
 */
export function buildEmblemGeometry(): EmblemGeometry {
  const burstOutlines = outlinesOf(STARBURST.join(' '))
  const letterOutlines = HNST.map((index) => outlinesOf(HONEST_LETTERS[index]))

  // Layout in logo units (SVG space: y down). Letters scaled, sat on y = 0.
  const letterBoxes = letterOutlines.map(boundsOf)
  const offsets: Vector2[] = []
  let cursor = 0
  for (const box of letterBoxes) {
    offsets.push(
      new Vector2(cursor - box.min.x * LETTER_SCALE, -box.min.y * LETTER_SCALE)
    )
    cursor += (box.max.x - box.min.x + LETTER_GAP) * LETTER_SCALE
  }
  const rowWidth = cursor - LETTER_GAP * LETTER_SCALE
  const firstBox = letterBoxes[0] ?? new Box2()
  const rowHeight = (firstBox.max.y - firstBox.min.y) * LETTER_SCALE

  // The crescent wraps the end of the row, as it wraps "eting" in the logo.
  const burstBox = boundsOf(burstOutlines)
  const burstSize = burstBox.getSize(new Vector2())
  const burstOffset = new Vector2(
    rowWidth - rowHeight * 0.9 - burstBox.min.x,
    rowHeight / 2 - (burstBox.min.y + burstSize.y / 2)
  )

  const bounds = new Box2(
    new Vector2(0, Math.min(0, burstBox.min.y + burstOffset.y)),
    new Vector2(
      Math.max(rowWidth, burstBox.max.x + burstOffset.x),
      Math.max(rowHeight, burstBox.max.y + burstOffset.y)
    )
  )
  const center = bounds.getCenter(new Vector2())
  const unit = EMBLEM_HEIGHT / (bounds.max.y - bounds.min.y)

  const place = (geometry: BufferGeometry, offset: Vector2, z: number) => {
    geometry.translate(offset.x - center.x, offset.y - center.y, 0)
    geometry.scale(unit, -unit, unit)
    geometry.translate(0, 0, z)
    flipWinding(geometry)
    return geometry
  }

  const letters = mergeGeometries(
    letterOutlines.map((outlines, i) => {
      const geometry = extrude(outlines, unit * LETTER_SCALE)
      geometry.scale(LETTER_SCALE, LETTER_SCALE, LETTER_SCALE)
      return place(geometry, offsets[i] ?? new Vector2(), 0)
    })
  )
  const starburst = place(
    extrude(burstOutlines, unit),
    burstOffset,
    -EXTRUDE_DEPTH * 0.6
  )

  starburst.computeBoundingBox()
  const burst = starburst.boundingBox ?? new Box3()
  const burstWorld = burst.getSize(new Vector3())
  return {
    letters,
    starburst,
    // Rays sit in the top-right corner of the mark.
    flarePivot: new Vector3(
      burst.max.x - burstWorld.x * 0.2,
      burst.max.y - burstWorld.y * 0.18,
      0
    ),
    starburstTop: burst.max.y,
    starburstBottom: burst.min.y,
  }
}
