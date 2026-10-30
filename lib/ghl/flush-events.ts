import type { Pool, QueryResultRow } from 'pg'
import { z } from 'zod'

import { EVENTS_FLUSH_LOCK } from './constants'
import { deleteEventIds, listBufferedEvents } from './event-store'
import { expiredAnonymousIds, groupForFlush } from './intent'
import type { GhlClient } from './types'

const lockSchema = z.object({ locked: z.boolean() })

/**
 * Groups emailed events and writes each contact once. Rows stay when the
 * contact does not exist yet. Anonymous rows older than 30 days are deleted.
 * A second flush exits when the lock is held.
 */
export async function flushEventBuffer(
  db: Pool,
  ghl: GhlClient,
  now = new Date()
): Promise<boolean> {
  const client = await db.connect()
  let locked = false
  try {
    const result = await client.query<QueryResultRow>(
      'SELECT pg_try_advisory_lock($1) AS locked',
      [EVENTS_FLUSH_LOCK]
    )
    const parsed = lockSchema.safeParse(result.rows[0])
    if (!parsed.success || !parsed.data.locked) return false
    locked = true

    const events = await listBufferedEvents(db)
    const groups = groupForFlush(events)
    const written: number[] = []
    let failure: Error | null = null
    for (const group of groups) {
      try {
        const applied = await ghl.applyIntent({
          email: group.email,
          tags: group.tags,
          signals: group.signals,
        })
        if (applied === 'written') written.push(...group.ids)
      } catch (error) {
        failure =
          error instanceof Error ? error : new Error('Event flush failed')
      }
    }
    await deleteEventIds(db, [...written, ...expiredAnonymousIds(events, now)])
    if (failure) throw failure
    return true
  } finally {
    if (locked) {
      await client.query('SELECT pg_advisory_unlock($1)', [EVENTS_FLUSH_LOCK])
    }
    client.release()
  }
}
