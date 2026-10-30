import { describe, expect, it } from 'bun:test'

import { ANONYMOUS_EVENT_DAYS, INTENT_SIGNAL_LIMIT } from './constants'
import {
  expiredAnonymousIds,
  groupForFlush,
  mergeSignals,
  type BufferedEvent,
} from './intent'

const now = new Date('2026-10-30T00:00:00.000Z')

function event(partial: {
  id: number
  email: string | null
  name: BufferedEvent['name']
  ts: string
  props?: BufferedEvent['props']
}): BufferedEvent {
  return {
    id: partial.id,
    anonId: 'anon-12345678',
    email: partial.email,
    name: partial.name,
    props: partial.props ?? null,
    ts: partial.ts,
  }
}

describe('event flush grouping', () => {
  it('makes one group per email and one tag set for that contact', () => {
    const groups = groupForFlush([
      event({
        id: 1,
        email: 'a@example.com',
        name: 'pricing_viewed',
        ts: '2026-10-01T00:00:00.000Z',
      }),
      event({
        id: 2,
        email: 'a@example.com',
        name: 'package_clicked',
        props: { tier: 'founder' },
        ts: '2026-10-01T00:01:00.000Z',
      }),
      event({
        id: 3,
        email: 'a@example.com',
        name: 'video_completed',
        ts: '2026-10-01T00:02:00.000Z',
      }),
      event({
        id: 4,
        email: 'b@example.com',
        name: 'pricing_viewed',
        ts: '2026-10-01T00:03:00.000Z',
      }),
      event({
        id: 5,
        email: null,
        name: 'cta_clicked',
        ts: '2026-10-01T00:04:00.000Z',
      }),
    ])

    expect(groups).toHaveLength(2)
    expect(groups[0]?.email).toBe('a@example.com')
    expect(groups[0]?.ids).toEqual([1, 2, 3])
    expect(groups[0]?.tags).toEqual([
      'intent:pricing',
      'intent:video',
      'intent:pkg-founder',
    ])
    expect(groups[0]?.signals).toContain('package_clicked:founder@')
    expect(groups[1]?.email).toBe('b@example.com')
    expect(groups[1]?.tags).toEqual(['intent:pricing'])
  })

  it('deletes anonymous rows only after 30 days', () => {
    const oldTs = new Date(
      now.getTime() - (ANONYMOUS_EVENT_DAYS + 1) * 86400000
    )
    const freshTs = new Date(now.getTime() - 2 * 86400000)
    const ids = expiredAnonymousIds(
      [
        event({
          id: 5,
          email: null,
          name: 'pricing_viewed',
          ts: oldTs.toISOString(),
        }),
        event({
          id: 6,
          email: null,
          name: 'cta_clicked',
          ts: freshTs.toISOString(),
        }),
        event({
          id: 7,
          email: 'a@example.com',
          name: 'pricing_viewed',
          ts: oldTs.toISOString(),
        }),
      ],
      now
    )
    expect(ids).toEqual([5])
  })

  it('keeps the newest distinct signal lines', () => {
    const merged = mergeSignals(
      'pricing_viewed@1',
      'pricing_viewed@1\nvideo_completed@2'
    )
    expect(merged).toBe('pricing_viewed@1\nvideo_completed@2')
    const huge = 'x'.repeat(INTENT_SIGNAL_LIMIT + 20)
    expect(mergeSignals('', huge).length).toBe(INTENT_SIGNAL_LIMIT)
  })
})
