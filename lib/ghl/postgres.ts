import { Pool } from 'pg'
import { z } from 'zod'

import { leadInputSchema } from '@/lib/contracts'
import { env } from '@/lib/env'

import type { NewLead } from './accept-lead'
import { HEARTBEAT_ID } from './constants'
import type { LeadProgress, OutboxLead } from './types'

const leadStatusSchema = z.enum([
  'queued',
  'contacted',
  'noted',
  'done',
  'failed',
])

const outboxSchema = z.object({
  id: z.uuid(),
  idempotency_key: z.string(),
  payload: leadInputSchema,
  status: leadStatusSchema,
  attempts: z.number().int(),
  ghl_contact_id: z.string().nullable(),
  ghl_note_id: z.string().nullable(),
  ghl_opportunity_id: z.string().nullable(),
  last_error: z.string().nullable(),
})

const idSchema = z.object({ id: z.uuid() })
const recoverableSchema = z.object({
  id: z.uuid(),
  idempotency_key: z.string(),
})
const beatSchema = z.object({
  beat_at: z.union([z.date(), z.string()]),
})

let pool: Pool | undefined

export function getPool(): Pool {
  const databaseUrl = env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. For localhost, run `bun run db:up` and set DATABASE_URL to postgres://hnst:hnst@localhost:5432/hnst.'
    )
  }
  pool ??= new Pool({ connectionString: databaseUrl, max: 10 })
  return pool
}

export async function closePool(): Promise<void> {
  if (!pool) return
  const current = pool
  pool = undefined
  await current.end()
}

export async function pingDatabase(db: Pool): Promise<boolean> {
  try {
    await db.query('SELECT 1 AS ok')
    return true
  } catch {
    return false
  }
}

export async function readHeartbeat(db: Pool): Promise<string | null> {
  try {
    const result = await db.query<{ beat_at: Date | string }>(
      'SELECT beat_at FROM integration.worker_heartbeat WHERE id = $1',
      [HEARTBEAT_ID]
    )
    const parsed = beatSchema.safeParse(result.rows[0])
    if (!parsed.success) return null
    const beat = parsed.data.beat_at
    return beat instanceof Date ? beat.toISOString() : beat
  } catch {
    return null
  }
}

export async function writeHeartbeat(db: Pool): Promise<void> {
  await db.query(
    `INSERT INTO integration.worker_heartbeat (id, beat_at)
     VALUES ($1, now())
     ON CONFLICT (id) DO UPDATE SET beat_at = now()`,
    [HEARTBEAT_ID]
  )
}

export async function findLeadRef(
  db: Pool,
  idempotencyKey: string
): Promise<string | null> {
  const result = await db.query<{ id: string }>(
    'SELECT id FROM integration.outbox WHERE idempotency_key = $1',
    [idempotencyKey]
  )
  const parsed = idSchema.safeParse(result.rows[0])
  return parsed.success ? parsed.data.id : null
}

export async function insertLead(
  db: Pool,
  lead: NewLead
): Promise<{ ref: string }> {
  const client = await db.connect()
  const ref = crypto.randomUUID()
  try {
    await client.query('BEGIN')
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO integration.outbox (id, idempotency_key, type, payload)
       VALUES ($1, $2, 'lead', $3::jsonb)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING id`,
      [ref, lead.idempotencyKey, JSON.stringify(lead.lead)]
    )
    const created = idSchema.safeParse(inserted.rows[0])
    if (!created.success) {
      const existing = await client.query<{ id: string }>(
        'SELECT id FROM integration.outbox WHERE idempotency_key = $1',
        [lead.idempotencyKey]
      )
      await client.query('ROLLBACK')
      const parsed = idSchema.safeParse(existing.rows[0])
      if (!parsed.success)
        throw new Error('Lead idempotency key conflict had no row')
      return { ref: parsed.data.id }
    }

    await client.query(
      `INSERT INTO integration.consent_log
         (id, email, phone, sms, email_marketing, consent_text, ip, user_agent, page_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        crypto.randomUUID(),
        lead.email,
        lead.phone,
        lead.sms,
        lead.emailMarketing,
        lead.consentText,
        lead.ip,
        lead.userAgent,
        lead.pageUrl,
      ]
    )
    await client.query('COMMIT')
    return { ref: created.data.id }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

function toOutbox(row: z.infer<typeof outboxSchema>): OutboxLead {
  return {
    id: row.id,
    idempotencyKey: row.idempotency_key,
    lead: row.payload,
    status: row.status,
    attempts: row.attempts,
    ghlContactId: row.ghl_contact_id,
    ghlNoteId: row.ghl_note_id,
    ghlOpportunityId: row.ghl_opportunity_id,
    lastError: row.last_error,
  }
}

export async function loadLead(
  db: Pool,
  id: string
): Promise<OutboxLead | null> {
  const result = await db.query(
    `SELECT id, idempotency_key, payload, status, attempts,
            ghl_contact_id, ghl_note_id, ghl_opportunity_id, last_error
     FROM integration.outbox
     WHERE id = $1 AND type = 'lead'`,
    [id]
  )
  const parsed = outboxSchema.safeParse(result.rows[0])
  return parsed.success ? toOutbox(parsed.data) : null
}

export async function saveLeadProgress(
  db: Pool,
  id: string,
  patch: LeadProgress
): Promise<void> {
  await db.query(
    `UPDATE integration.outbox
     SET status = $2,
         ghl_contact_id = COALESCE($3, ghl_contact_id),
         ghl_note_id = COALESCE($4, ghl_note_id),
         ghl_opportunity_id = COALESCE($5, ghl_opportunity_id),
         last_error = NULL,
         updated_at = now()
     WHERE id = $1`,
    [
      id,
      patch.status,
      patch.ghlContactId ?? null,
      patch.ghlNoteId ?? null,
      patch.ghlOpportunityId ?? null,
    ]
  )
}

export async function recordAttemptError(
  db: Pool,
  id: string,
  message: string
): Promise<void> {
  await db.query(
    `UPDATE integration.outbox
     SET last_error = $2, updated_at = now()
     WHERE id = $1`,
    [id, message.slice(0, 500)]
  )
}

export async function markLeadFailed(
  db: Pool,
  id: string,
  message: string
): Promise<void> {
  await db.query(
    `UPDATE integration.outbox
     SET status = 'failed', last_error = $2, updated_at = now()
     WHERE id = $1`,
    [id, message.slice(0, 500)]
  )
}

export async function incrementAttempts(db: Pool, id: string): Promise<void> {
  await db.query(
    `UPDATE integration.outbox
     SET attempts = attempts + 1, updated_at = now()
     WHERE id = $1`,
    [id]
  )
}

export async function listRecoverableLeads(
  db: Pool
): Promise<{ id: string; idempotencyKey: string }[]> {
  const result = await db.query<{ id: string; idempotency_key: string }>(
    `SELECT id, idempotency_key
     FROM integration.outbox
     WHERE type = 'lead' AND status IN ('queued', 'contacted', 'noted')
     ORDER BY created_at`
  )
  const leads: { id: string; idempotencyKey: string }[] = []
  for (const row of result.rows) {
    const parsed = recoverableSchema.safeParse(row)
    if (!parsed.success) continue
    leads.push({
      id: parsed.data.id,
      idempotencyKey: parsed.data.idempotency_key,
    })
  }
  return leads
}
