import type { Pool, QueryResultRow } from 'pg'
import { z } from 'zod'

import {
  eventNameSchema,
  eventPropValueSchema,
  type EventsInput,
} from '@/lib/contracts'

import type { BufferedEvent } from './intent'

const idSchema = z
  .union([z.number().int(), z.string().regex(/^\d+$/u)])
  .transform((value) => Number(value))

const rowSchema = z.object({
  id: idSchema,
  anon_id: z.string(),
  email: z.string().nullable(),
  name: eventNameSchema,
  props: z.record(z.string(), eventPropValueSchema).nullable(),
  ts: z.union([z.date(), z.string()]),
})

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}

function toEvent(row: z.infer<typeof rowSchema>): BufferedEvent {
  return {
    id: row.id,
    anonId: row.anon_id,
    email: row.email,
    name: row.name,
    props: row.props,
    ts: toIso(row.ts),
  }
}

export async function insertEvents(
  db: Pool,
  input: EventsInput
): Promise<void> {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    if (input.email) {
      await client.query(
        `UPDATE integration.event_buffer
         SET email = $1
         WHERE anon_id = $2 AND email IS NULL`,
        [input.email, input.anonId]
      )
    }
    for (const event of input.events) {
      await client.query(
        `INSERT INTO integration.event_buffer (anon_id, email, name, props, ts)
         VALUES ($1, $2, $3, $4::jsonb, $5)`,
        [
          input.anonId,
          input.email ?? null,
          event.name,
          event.props ? JSON.stringify(event.props) : null,
          event.ts,
        ]
      )
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function listBufferedEvents(db: Pool): Promise<BufferedEvent[]> {
  const result = await db.query<QueryResultRow>(
    `SELECT id, anon_id, email, name, props, ts
     FROM integration.event_buffer
     ORDER BY id`
  )
  const events: BufferedEvent[] = []
  for (const row of result.rows) {
    const parsed = rowSchema.safeParse(row)
    if (!parsed.success) continue
    events.push(toEvent(parsed.data))
  }
  return events
}

export async function deleteEventIds(db: Pool, ids: number[]): Promise<void> {
  if (ids.length === 0) return
  await db.query(
    'DELETE FROM integration.event_buffer WHERE id = ANY($1::bigint[])',
    [ids]
  )
}
