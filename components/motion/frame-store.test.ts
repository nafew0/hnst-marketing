import { describe, expect, it } from 'bun:test'

import { FrameStore } from './frame-store'

// Failure modes: decoded frames growing past the budget (memory), the wrong
// frames loading first (a blank scrub), and a closed frame still being drawn.

class FakeFrame {
  closed = false
  constructor(readonly index: number) {}
  close() {
    this.closed = true
  }
}

function setup(count: number, budget: number) {
  const urls = Array.from({ length: count }, (_, i) => `/f/${i}.webp`)
  const order: number[] = []
  const frames: FakeFrame[] = []
  const store = new FrameStore<FakeFrame>(
    urls,
    async (url) => {
      const index = Number(url.match(/(\d+)\.webp$/u)?.[1])
      order.push(index)
      const frame = new FakeFrame(index)
      frames.push(frame)
      return frame
    },
    () => undefined,
    budget
  )
  return { store, order, frames }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

async function drain() {
  for (let i = 0; i < 50; i++) await settle()
}

describe('FrameStore', () => {
  it('loads keyframes near the playhead before the frames between them', async () => {
    const { store, order } = setup(200, 120)
    store.seek(0)
    await drain()
    const firstSeven = order.slice(0, 7)
    expect(firstSeven.every((index) => index % 10 === 0)).toBe(true)
  })

  it('never keeps more decoded frames than the budget, and closes the rest', async () => {
    const { store, frames } = setup(400, 30)
    store.seek(0)
    await drain()
    store.seek(300)
    await drain()
    expect(store.decoded).toBeLessThanOrEqual(30)
    const open = frames.filter((frame) => !frame.closed)
    expect(open.length).toBeLessThanOrEqual(30)
    expect(open.every((frame) => Math.abs(frame.index - 300) <= 60)).toBe(true)
  })

  it('returns the nearest decoded frame while the exact one loads', async () => {
    const { store } = setup(100, 120)
    store.seek(0)
    await drain()
    const nearest = store.nearest(5)
    expect(nearest).not.toBeNull()
    expect(nearest?.bitmap.closed).toBe(false)
  })
})
