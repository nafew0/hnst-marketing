import type { Pool } from 'pg'
import pino from 'pino'

import { fulfillBooking } from '@/lib/ghl/accept-booking'
import { classifyBookingError } from '@/lib/ghl/booking-error'
import {
  listRecoverableBookings,
  loadBooking,
  saveBooking,
} from '@/lib/ghl/booking-store'
import {
  BOOKING_DLQ,
  BOOKING_QUEUE,
  EVENTS_FLUSH_QUEUE,
  HEARTBEAT_MS,
  LEAD_DLQ,
  LEAD_QUEUE,
} from '@/lib/ghl/constants'
import { flushEventBuffer } from '@/lib/ghl/flush-events'
import { ghlFromEnv } from '@/lib/ghl/from-env'
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
import {
  enqueueBooking,
  enqueueLead,
  getBoss,
  leadJobSchema,
  scheduleEventFlush,
  stopBoss,
} from '@/lib/ghl/queue'
import type { GhlClient } from '@/lib/ghl/types'

const logger = pino({ level: 'info' })

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

async function deliverBooking(
  db: ReturnType<typeof getPool>,
  ghl: GhlClient,
  outboxId: string
): Promise<void> {
  const current = await loadBooking(db, outboxId)
  if (!current || current.status === 'done' || current.status === 'failed')
    return
  await incrementAttempts(db, outboxId)
  const row = await loadBooking(db, outboxId)
  if (!row || row.status === 'done' || row.status === 'failed') return
  try {
    await fulfillBooking(
      row,
      ghl,
      (next) => saveBooking(db, next),
      new Date().toISOString()
    )
    logger.info({ outboxId }, 'booking delivered')
  } catch (error) {
    const kind = classifyBookingError(error)
    const message =
      error instanceof Error ? error.message : 'Booking delivery failed'
    if (kind === 'slot' || kind === 'config') {
      await markLeadFailed(db, outboxId, message)
      logger.error({ outboxId, kind }, 'booking will not be retried')
      return
    }
    await recordAttemptError(db, outboxId, message)
    throw error
  }
}

export async function startWorker(): Promise<void> {
  const db = getPool()
  const ghl = ghlFromEnv()
  const boss = await getBoss()

  const pending = await listRecoverableLeads(db)
  for (const lead of pending) {
    await enqueueLead(lead.id, lead.idempotencyKey)
  }
  logger.info({ recovered: pending.length }, 'recoverable leads queued')

  const pendingBookings = await listRecoverableBookings(db)
  for (const booking of pendingBookings) {
    await enqueueBooking(booking.id, booking.idempotencyKey)
  }
  logger.info(
    { recovered: pendingBookings.length },
    'recoverable bookings queued'
  )

  await scheduleEventFlush()

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

  await boss.work(BOOKING_QUEUE, { batchSize: 1 }, async (jobs) => {
    const job = jobs[0]
    if (!job) return
    const parsed = leadJobSchema.safeParse(job.data)
    if (!parsed.success)
      throw new Error('Booking job payload was not an outbox id')
    await deliverBooking(db, ghl, parsed.data.outboxId)
  })

  await boss.work(BOOKING_DLQ, { batchSize: 1 }, async (jobs) => {
    const job = jobs[0]
    if (!job) return
    const parsed = leadJobSchema.safeParse(job.data)
    if (!parsed.success) return
    await markLeadFailed(db, parsed.data.outboxId, 'Gave up after 8 failures')
    logger.error(
      { outboxId: parsed.data.outboxId },
      'booking moved to dead letter'
    )
  })

  await boss.work(EVENTS_FLUSH_QUEUE, { batchSize: 1 }, async (jobs) => {
    const ran = await flushEventBuffer(db, ghl)
    logger.info({ jobs: jobs.length, ran }, 'event flush')
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
