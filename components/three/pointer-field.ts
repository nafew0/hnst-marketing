/**
 * What the pointer is doing to a scene, shared by everything that reacts to it.
 * The DOM side writes `x`, `y`, `over` and calls `pulseAt`; `stepPointerField`
 * eases it once a frame, and shaders read the result. Plain data, so it costs no
 * renders and carries no three.js into the first load.
 */
export interface PointerField {
  /** Pointer in view coordinates (0–1, y up). */
  x: number
  y: number
  /** Whether the pointer is over the scene. */
  over: boolean
  /** `over`, eased: 0–1. */
  hover: number
  /** A click's wave: 0 starts it, 1 is spent. */
  pulse: number
  pulseX: number
  pulseY: number
}

const PULSE_SECONDS = 1.6
const HOVER_RATE = 5

export function createPointerField(): PointerField {
  return {
    x: 0.5,
    y: 0.5,
    over: false,
    hover: 0,
    pulse: 1,
    pulseX: 0.5,
    pulseY: 0.5,
  }
}

export function pulseAt(field: PointerField, x: number, y: number) {
  field.pulse = 0
  field.pulseX = x
  field.pulseY = y
}

export function stepPointerField(field: PointerField, delta: number) {
  const target = field.over ? 1 : 0
  field.hover += (target - field.hover) * Math.min(1, delta * HOVER_RATE)
  field.pulse = Math.min(1, field.pulse + delta / PULSE_SECONDS)
}
