import { describe, expect, it } from 'bun:test'

import { retryDelayMs } from './errors'

describe('retryDelayMs', () => {
  it('waits out a burst window and caps a daily reset', () => {
    expect(retryDelayMs(undefined)).toBe(1000)
    expect(retryDelayMs({ scope: 'burst', intervalMs: 250 })).toBe(250)
    expect(retryDelayMs({ scope: 'burst', intervalMs: 50 })).toBe(200)
    expect(retryDelayMs({ scope: 'daily', dailyResetMs: 3_600_000 })).toBe(
      30_000
    )
  })
})
