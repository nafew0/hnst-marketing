/**
 * Loads and keeps the decoded frames of a scroll sequence. Every 10th frame
 * near the playhead loads first, so a fast scrub always has something close
 * to show; the gaps then fill outwards from the current frame. At most
 * `budget` frames stay decoded (ImageBitmaps are GPU-backed and large); the
 * ones farthest from the playhead are closed first.
 */

const KEYFRAME_STEP = 10
const WINDOW = 60
const CONCURRENCY = 6

/** Anything with GPU memory to release: ImageBitmap in the browser. */
export interface Closable {
  close: () => void
}

export async function decodeFrame(url: string): Promise<ImageBitmap> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return createImageBitmap(await response.blob())
}

export class FrameStore<Frame extends Closable = ImageBitmap> {
  private readonly bitmaps = new Map<number, Frame>()
  private readonly loading = new Set<number>()
  private readonly failed = new Set<number>()
  private current = 0
  private disposed = false

  constructor(
    private readonly urls: readonly string[],
    private readonly decode: (url: string) => Promise<Frame>,
    private readonly onFrame: (index: number) => void,
    private readonly budget = 120
  ) {}

  get length() {
    return this.urls.length
  }

  /** How many frames are decoded right now (never more than the budget). */
  get decoded() {
    return this.bitmaps.size
  }

  /** Moves the playhead, evicts what fell out of budget and loads what's next. */
  seek(index: number) {
    this.current = Math.min(this.urls.length - 1, Math.max(0, index))
    this.evict()
    this.pump()
  }

  /** The decoded frame closest to `index`, and which one it is. */
  nearest(index: number): { index: number; bitmap: Frame } | null {
    for (let offset = 0; offset < this.urls.length; offset++) {
      for (const candidate of [index - offset, index + offset]) {
        const bitmap = this.bitmaps.get(candidate)
        if (bitmap) return { index: candidate, bitmap }
      }
    }
    return null
  }

  dispose() {
    this.disposed = true
    for (const bitmap of this.bitmaps.values()) bitmap.close()
    this.bitmaps.clear()
  }

  /**
   * Frames to have decoded, most wanted first, capped at the budget: loading
   * and eviction share this one ranking, so nothing loads only to be evicted
   * (with a wider window than budget they would trade places forever).
   */
  private keep(): number[] {
    const near: number[] = []
    const keyframes: number[] = []
    for (let offset = 0; offset <= WINDOW; offset++) {
      for (const index of offset === 0
        ? [this.current]
        : [this.current - offset, this.current + offset]) {
        if (index < 0 || index >= this.urls.length) continue
        if (index % KEYFRAME_STEP === 0) keyframes.push(index)
        else near.push(index)
      }
    }
    return [...keyframes, ...near].slice(0, this.budget)
  }

  private pump() {
    if (this.disposed) return
    for (const index of this.keep()) {
      if (this.loading.size >= CONCURRENCY) return
      if (
        this.bitmaps.has(index) ||
        this.loading.has(index) ||
        this.failed.has(index)
      ) {
        continue
      }
      this.load(index)
    }
  }

  private load(index: number) {
    const url = this.urls[index]
    if (!url) return
    this.loading.add(index)
    void this.decode(url)
      .then((bitmap) => {
        if (this.disposed) {
          bitmap.close()
          return
        }
        this.bitmaps.set(index, bitmap)
        this.evict()
        if (this.bitmaps.has(index)) this.onFrame(index)
      })
      .catch(() => {
        this.failed.add(index)
      })
      .finally(() => {
        this.loading.delete(index)
        this.pump()
      })
  }

  private evict() {
    if (this.bitmaps.size <= this.budget) return
    const keep = new Set(this.keep())
    // Frames outside the keep set go first, farthest from the playhead first.
    const candidates = [...this.bitmaps.keys()]
      .filter((index) => !keep.has(index))
      .sort((a, b) => Math.abs(b - this.current) - Math.abs(a - this.current))
    for (const index of candidates) {
      if (this.bitmaps.size <= this.budget) return
      this.bitmaps.get(index)?.close()
      this.bitmaps.delete(index)
    }
  }
}
