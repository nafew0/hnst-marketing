import type { Pool, QueryResultRow } from 'pg'
import { z } from 'zod'

import {
  bookingCreatedSchema,
  bookingInputSchema,
  isoDateTimeSchema,
  queuedSchema,
} from '@/lib/contracts'

import type { BookingClaim, StoredBooking } from './accept-booking'
import { BOOKING_LOCK_CLASS, BOOKING_STALE_SECONDS } from './constants'

const responseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal(201), body: bookingCreatedSchema }),
  z.object({ status: z.literal(202), body: queuedSchema }),
])

const payloadSchema = z.object({
  booking: bookingInputSchema,
  appointmentId: z.string().min(1).optional(),
  start: isoDateTimeSchema.optional(),
  end: isoDateTimeSchema.optional(),
  tagged: z.boolean().optional(),
  response: responseSchema.optional(),
})

const statusSchema = z.enum([
  'processing',
  'contacted',
  'appointed',
  'tagged',
  'done',
  'failed',
])

const rowSchema = z.object({
  id: z.uuid(),
  idempotency_key: z.string(),
  payload: payloadSchema,
  status: statusSchema,
  ghl_contact_id: z.string().nullable(),
  ghl_opportunity_id: z.string().nullable(),
})

const recoverableSchema = z.object({
  id: z.uuid(),
  idempotency_key: z.string(),
})

function toStored(row: z.infer<typeof rowSchema>): StoredBooking {
  return {
    ref: row.id,
    idempotencyKey: row.idempotency_key,
    booking: row.payload.booking,
    status: row.status,
    ghlContactId: row.ghl_contact_id,
    ghlOpportunityId: row.ghl_opportunity_id,
    appointmentId: row.payload.appointmentId ?? null,
    start: row.payload.start ?? null,
    end: row.payload.end ?? null,
    tagged: row.payload.tagged ?? false,
    response: row.payload.response ?? null,
  }
}

function payloadOf(row: StoredBooking) {
  const payload: z.infer<typeof payloadSchema> = {
    booking: row.booking,
    tagged: row.tagged,
  }
  if (row.appointmentId) payload.appointmentId = row.appointmentId
  if (row.start) payload.start = row.start
  if (row.end) payload.end = row.end
  if (row.response) payload.response = row.response
  return payload
}

async function readRow(
  db: Pool,
  idempotencyKey: string
): Promise<StoredBooking | null> {
  const result = await db.query<QueryResultRow>(
    `SELECT id, idempotency_key, payload, status, ghl_contact_id, ghl_opportunity_id
     FROM integration.outbox
     WHERE idempotency_key = $1 AND type = 'booking'`,
    [idempotencyKey]
  )
  const first = result.rows[0]
  if (!first) return null
  const parsed = rowSchema.safeParse(first)
  if (!parsed.success) throw new Error('Booking row did not parse')
  return toStored(parsed.data)
}

export async function findBooking(
  db: Pool,
  idempotencyKey: string
): Promise<StoredBooking | null> {
  return readRow(db, idempotencyKey)
}

export async function claimBooking(
  db: Pool,
  input: BookingClaim
): Promise<{ created: boolean; row: StoredBooking }> {
  const client = await db.connect()
  const ref = crypto.randomUUID()
  let finished = false
  const payload = payloadOf({
    ref,
    idempotencyKey: input.idempotencyKey,
    booking: input.booking,
    status: 'processing',
    ghlContactId: null,
    ghlOpportunityId: null,
    appointmentId: null,
    start: null,
    end: null,
    tagged: false,
    response: null,
  })
  try {
    await client.query('BEGIN')
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO integration.outbox (id, idempotency_key, type, payload, status)
       VALUES ($1, $2, 'booking', $3::jsonb, 'processing')
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING id`,
      [ref, input.idempotencyKey, JSON.stringify(payload)]
    )
    if (!inserted.rows[0]) {
      await client.query('ROLLBACK')
      finished = true
      const existing = await readRow(db, input.idempotencyKey)
      if (!existing)
        throw new Error('Booking idempotency key conflict had no row')
      return { created: false, row: existing }
    }
    await client.query(
      `INSERT INTO integration.consent_log
         (id, email, phone, sms, email_marketing, consent_text, ip, user_agent, page_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        crypto.randomUUID(),
        input.email,
        input.phone,
        input.sms,
        input.emailMarketing,
        input.consentText,
        input.ip,
        input.userAgent,
        input.pageUrl,
      ]
    )
    await client.query('COMMIT')
    finished = true
    const created = await readRow(db, input.idempotencyKey)
    if (!created) throw new Error('Booking claim did not read back')
    return { created: true, row: created }
  } catch (error) {
    if (!finished) await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function saveBooking(db: Pool, row: StoredBooking): Promise<void> {
  await db.query(
    `UPDATE integration.outbox
     SET status = $2,
         payload = $3::jsonb,
         ghl_contact_id = $4,
         ghl_opportunity_id = $5,
         last_error = NULL,
         updated_at = now()
     WHERE id = $1 AND type = 'booking'`,
    [
      row.ref,
      row.status,
      JSON.stringify(payloadOf(row)),
      row.ghlContactId,
      row.ghlOpportunityId,
    ]
  )
}

export async function removeBooking(db: Pool, ref: string): Promise<void> {
  await db.query(
    `DELETE FROM integration.outbox WHERE id = $1 AND type = 'booking'`,
    [ref]
  )
}

export async function loadBooking(
  db: Pool,
  id: string
): Promise<StoredBooking | null> {
  const result = await db.query<QueryResultRow>(
    `SELECT id, idempotency_key, payload, status, ghl_contact_id, ghl_opportunity_id
     FROM integration.outbox
     WHERE id = $1 AND type = 'booking'`,
    [id]
  )
  const first = result.rows[0]
  if (!first) return null
  const parsed = rowSchema.safeParse(first)
  if (!parsed.success) throw new Error('Booking row did not parse')
  return toStored(parsed.data)
}

export async function listRecoverableBookings(
  db: Pool
): Promise<{ id: string; idempotencyKey: string }[]> {
  const result = await db.query<QueryResultRow>(
    `SELECT id, idempotency_key
     FROM integration.outbox
     WHERE type = 'booking'
       AND status IN ('processing', 'contacted', 'appointed', 'tagged')
       AND updated_at < now() - make_interval(secs => $1)
     ORDER BY created_at`,
    [BOOKING_STALE_SECONDS]
  )
  const bookings: { id: string; idempotencyKey: string }[] = []
  for (const row of result.rows) {
    const parsed = recoverableSchema.safeParse(row)
    if (!parsed.success) continue
    bookings.push({
      id: parsed.data.id,
      idempotencyKey: parsed.data.idempotency_key,
    })
  }
  return bookings
}

/**
 * Serializes two requests that share an Idempotency-Key. The lock is held
 * on this connection while `run` uses the pool, so a second booking waits
 * until the first has stored 201 or 202.
 */
export async function withBookingLock<T>(
  db: Pool,
  idempotencyKey: string,
  run: () => Promise<T>
): Promise<T> {
  const client = await db.connect()
  try {
    await client.query('SELECT pg_advisory_lock($1, hashtext($2))', [
      BOOKING_LOCK_CLASS,
      idempotencyKey,
    ])
    try {
      return await run()
    } finally {
      await client.query('SELECT pg_advisory_unlock($1, hashtext($2))', [
        BOOKING_LOCK_CLASS,
        idempotencyKey,
      ])
    }
  } finally {
    client.release()
  }
}
