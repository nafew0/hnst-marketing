/**
 * The gold HONEST frame, as numbers: the viewfinder's overlay and the photo
 * drawn by the shutter share them, so what the visitor framed is what they
 * get. Pure, so `bun test` covers it.
 */

/** Longest side of a shot, in px: the size the wall post sends (docs/phases/M7.md). */
export const SHOT_MAX_EDGE = 2048

/** The viewfinder's shape, width over height: a portrait photo. */
export const SHOT_ASPECT = 3 / 4

/** JPEG quality for shots. */
export const SHOT_QUALITY = 0.9

export interface FrameGeometry {
  /** From each edge to the middle of the frame's line. */
  inset: number
  /** The line's width. */
  stroke: number
  /** The label's size; it sits in a gap cut into the bottom line. */
  fontSize: number
  /** The label's baseline, from the top. */
  baseline: number
  /** Clear space either side of the label, inside the gap. */
  gap: number
}

/** Sizes scale with the shorter side, so the frame looks alike at any size. */
export function frameGeometry(width: number, height: number): FrameGeometry {
  const short = Math.min(width, height)
  const inset = short * 0.05
  const fontSize = short * 0.055
  return {
    inset,
    stroke: Math.max(1, short * 0.008),
    fontSize,
    baseline: height - inset + fontSize * 0.35,
    gap: fontSize * 0.5,
  }
}

/** Scales `width` × `height` down so neither side passes `max`. */
export function fitWithin(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/**
 * The centred part of a `width` × `height` source with the given aspect, as
 * `object-fit: cover` shows it in the viewfinder.
 */
export function coverCrop(width: number, height: number, aspect: number) {
  if (width / height > aspect) {
    const cropped = height * aspect
    return { x: (width - cropped) / 2, y: 0, width: cropped, height }
  }
  const cropped = width / aspect
  return { x: 0, y: (height - cropped) / 2, width, height: cropped }
}

export interface FrameStyle {
  text: string
  color: string
  fontFamily: string
}

/** Draws the frame over whatever is already on the canvas. */
export function drawFrame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: FrameStyle
) {
  const { inset, stroke, fontSize, baseline, gap } = frameGeometry(
    width,
    height
  )
  const label = style.text.trim()
  context.save()
  context.font = `600 ${fontSize}px ${style.fontFamily}`
  context.textAlign = 'center'
  const labelWidth = label ? context.measureText(label).width + gap * 2 : 0
  const left = inset
  const right = width - inset
  const top = inset
  const bottom = height - inset
  const middle = width / 2

  context.strokeStyle = style.color
  context.lineWidth = stroke
  context.lineJoin = 'miter'
  context.beginPath()
  // From the gap's right edge, round the frame to its left edge.
  context.moveTo(middle + labelWidth / 2, bottom)
  context.lineTo(right, bottom)
  context.lineTo(right, top)
  context.lineTo(left, top)
  context.lineTo(left, bottom)
  context.lineTo(middle - labelWidth / 2, bottom)
  context.stroke()

  if (label) {
    context.fillStyle = style.color
    context.fillText(label, middle, baseline)
  }
  context.restore()
}
