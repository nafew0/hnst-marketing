import type { Pool } from 'pg'
import pino from 'pino'

import { env } from '@/lib/env'
import { createGhlClient } from '@/lib/ghl/client'
import { HEARTBEAT_MS, LEAD_DLQ, LEAD_QUEUE } from '@/lib/ghl/constants'
import { processLead } from '@/lib/ghl/lead-job'
import {
  closePool,
  getPool,
  incrementAttempts,
  listRecoverableLeads,
  loadLead,
  markLeadFailed,
  recordAttemptError,
  saveLeadProgress,
  writeHeartbeat,
} from '@/lib/ghl/postgres'
import { enqueueLead, getBoss, leadJobSchema, stopBoss } from '@/lib/ghl/queue'
import type { GhlClient } from '@/lib/ghl/types'

const logger = pino({ level: 'info' })

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is not set`)
  return value
}

async function deliver(
  db: Pool,
  ghl: GhlClient,
  outboxId: string
): Promise<void> {
  await incrementAttempts(db, outboxId)
  const row = await loadLead(db, outboxId)
  if (!row || row.status === 'done' || row.status === 'failed') return
  try {
    await processLead(
      row,
      ghl,
      (patch) => saveLeadProgress(db, outboxId, patch),
      new Date().toISOString()
    )
    logger.info({ outboxId }, 'lead delivered')
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Lead delivery failed'
    await recordAttemptError(db, outboxId, message)
    throw error
  }
}

export async function startWorker(): Promise<void> {
  const db = getPool()
  const ghl = createGhlClient({
    token: required(env.GHL_PIT, 'GHL_PIT'),
    locationId: required(env.GHL_LOCATION_ID, 'GHL_LOCATION_ID'),
    pipelineId: required(env.GHL_PIPELINE_ID, 'GHL_PIPELINE_ID'),
    stageNewId: required(env.GHL_STAGE_NEW_ID, 'GHL_STAGE_NEW_ID'),
    calendarId: env.GHL_CALENDAR_ID ?? null,
  })
  const boss = await getBoss()

  const pending = await listRecoverableLeads(db)
  for (const lead of pending) {
    await enqueueLead(lead.id, lead.idempotencyKey)
  }
  logger.info({ recovered: pending.length }, 'recoverable leads queued')

  await writeHeartbeat(db)
  const timer = setInterval(() => {
    writeHeartbeat(db).catch((error) => {
      logger.error({ err: error }, 'heartbeat failed')
    })
  }, HEARTBEAT_MS)

  await boss.work(LEAD_QUEUE, { batchSize: 1 }, async (jobs) => {
    const job = jobs[0]
    if (!job) return
    const parsed = leadJobSchema.safeParse(job.data)
    if (!parsed.success)
      throw new Error('Lead job payload was not an outbox id')
    await deliver(db, ghl, parsed.data.outboxId)
  })

  await boss.work(LEAD_DLQ, { batchSize: 1 }, async (jobs) => {
    const job = jobs[0]
    if (!job) return
    const parsed = leadJobSchema.safeParse(job.data)
    if (!parsed.success) return
    await markLeadFailed(db, parsed.data.outboxId, 'Gave up after 8 failures')
    logger.error(
      { outboxId: parsed.data.outboxId },
      'lead moved to dead letter'
    )
  })

  logger.info('worker started')

  const shutdown = async () => {
    clearInterval(timer)
    await stopBoss()
    await closePool()
  }

  process.on('SIGTERM', () => {
    shutdown().catch((error) => {
      logger.error({ err: error }, 'shutdown failed')
      process.exit(1)
    })
  })
  process.on('SIGINT', () => {
    shutdown().catch((error) => {
      logger.error({ err: error }, 'shutdown failed')
      process.exit(1)
    })
  })
}
