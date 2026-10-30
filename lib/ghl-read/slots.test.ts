import { describe, expect, it } from 'bun:test'

import { SLOT_CACHE_MAX_ENTRIES, SLOT_CACHE_MS } from '@/lib/ghl/constants'
import type { FreeSlotQuery } from '@/lib/ghl/types'

import {
  clearSlotCache,
  readFreeSlots,
  slotCacheSize,
  zonedDayStartMs,
} from './slots'

function slotsOf(calls: FreeSlotQuery[]) {
  return {
    calls,
    getFreeSlots: async (input: FreeSlotQuery) => {
      calls.push(input)
      return {
        '2026-11-04': ['2026-11-04T09:30:00-05:00'],
        '2026-11-05': [],
        note: ['not-a-time'],
      }
    },
  }
}

describe('slot range', () => {
  it('rejects a range over 31 days and does not call GoHighLevel', async () => {
    clearSlotCache()
    const backend = slotsOf([])
    const result = await readFreeSlots(
      { from: '2026-01-01', to: '2026-02-02', tz: 'America/New_York' },
      backend
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('slot_range_too_large')
    expect(backend.calls).toHaveLength(0)
  })

  it('allows 31 days, caches for 60 seconds, and drops empty days', async () => {
    clearSlotCache()
    const backend = slotsOf([])
    const query = {
      from: '2026-01-01',
      to: '2026-02-01',
      tz: 'America/New_York',
    }
    const first = await readFreeSlots(query, backend, 1_000)
    const second = await readFreeSlots(
      query,
      backend,
      1_000 + SLOT_CACHE_MS - 1
    )
    const third = await readFreeSlots(query, backend, 1_000 + SLOT_CACHE_MS)
    expect(first.ok).toBe(true)
    if (first.ok) {
      expect(first.body.days).toEqual([
        { date: '2026-11-04', slots: ['2026-11-04T09:30:00-05:00'] },
      ])
      expect(first.body.tz).toBe('America/New_York')
    }
    expect(backend.calls).toHaveLength(2)
    expect(second.ok).toBe(true)
    expect(third.ok).toBe(true)
  })

  it('caps the cache, dropping expired entries first', async () => {
    clearSlotCache()
    const backend = slotsOf([])
    const oneDay = (index: number) => {
      const date = new Date(Date.UTC(2026, 0, 1 + index))
        .toISOString()
        .slice(0, 10)
      return { from: date, to: date, tz: 'UTC' }
    }
    const fill = async (now: number) => {
      for (let index = 0; index < SLOT_CACHE_MAX_ENTRIES; index += 1) {
        await readFreeSlots(oneDay(index), backend, now)
      }
      expect(slotCacheSize()).toBe(SLOT_CACHE_MAX_ENTRIES)
    }
    const next = oneDay(SLOT_CACHE_MAX_ENTRIES)

    // Everything has expired, so only the expired entries go.
    await fill(1_000)
    await readFreeSlots(next, backend, 1_000 + SLOT_CACHE_MS)
    expect(slotCacheSize()).toBe(1)

    // Nothing has expired, so the whole cache resets rather than grow.
    clearSlotCache()
    await fill(1_000)
    await readFreeSlots(next, backend, 1_000)
    expect(slotCacheSize()).toBe(1)
  })

  it('rejects an unknown timezone', async () => {
    clearSlotCache()
    const backend = slotsOf([])
    const result = await readFreeSlots(
      { from: '2026-01-04', to: '2026-01-05', tz: 'Mars/Base' },
      backend
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.fields?.tz).toContain('IANA')
    expect(backend.calls).toHaveLength(0)
  })

  it('places local midnight on the UTC instant for that zone', () => {
    expect(zonedDayStartMs('2026-01-15', 'America/New_York')).toBe(
      Date.parse('2026-01-15T05:00:00Z')
    )
    expect(zonedDayStartMs('2026-07-15', 'America/New_York')).toBe(
      Date.parse('2026-07-15T04:00:00Z')
    )
  })
})
