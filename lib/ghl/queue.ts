import { PgBoss } from 'pg-boss'
import { z } from 'zod'

import { env } from '@/lib/env'

import {
  BOOKING_DLQ,
  BOOKING_EXPIRE_SECONDS,
  BOOKING_QUEUE,
  BOOKING_RETRY_LIMIT,
  EVENTS_FLUSH_CRON,
  EVENTS_FLUSH_QUEUE,
  LEAD_DLQ,
  LEAD_EXPIRE_SECONDS,
  LEAD_QUEUE,
  LEAD_RETRY_LIMIT,
} from './constants'

export const leadJobSchema = z.object({ outboxId: z.uuid() })

let starting: Promise<PgBoss> | null = null

async function ensureQueue(
  boss: PgBoss,
  name: string,
  options: Parameters<PgBoss['createQueue']>[1]
): Promise<void> {
  const existing = await boss.getQueue(name)
  if (existing) return
  try {
    await boss.createQueue(name, options)
  } catch (error) {
    const raced = await boss.getQueue(name)
    if (raced) return
    throw error
  }
}

/** Opens pg-boss and creates the lead queue. Safe to call from web and worker. */
export function getBoss(): Promise<PgBoss> {
  const databaseUrl = env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }
  starting ??= openBoss(databaseUrl)
  return starting
}

async function openBoss(databaseUrl: string): Promise<PgBoss> {
  const boss = new PgBoss(databaseUrl)
  await boss.start()
  await ensureQueue(boss, LEAD_DLQ, { retryLimit: 0 })
  await ensureQueue(boss, LEAD_QUEUE, {
    retryLimit: LEAD_RETRY_LIMIT,
    retryDelay: 2,
    retryBackoff: true,
    retryDelayMax: 120,
    deadLetter: LEAD_DLQ,
    policy: 'exclusive',
    expireInSeconds: LEAD_EXPIRE_SECONDS,
  })
  await ensureQueue(boss, BOOKING_DLQ, { retryLimit: 0 })
  await ensureQueue(boss, BOOKING_QUEUE, {
    retryLimit: BOOKING_RETRY_LIMIT,
    retryDelay: 2,
    retryBackoff: true,
    retryDelayMax: 120,
    deadLetter: BOOKING_DLQ,
    policy: 'exclusive',
    expireInSeconds: BOOKING_EXPIRE_SECONDS,
  })
  await ensureQueue(boss, EVENTS_FLUSH_QUEUE, {
    retryLimit: 2,
    retryDelay: 30,
    retryBackoff: true,
    policy: 'exclusive',
    expireInSeconds: 300,
  })
  return boss
}

/** Queues delivery. A second send with the same key is a no-op while the first is open. */
export async function enqueueLead(
  ref: string,
  idempotencyKey: string
): Promise<void> {
  const boss = await getBoss()
  await boss.send(
    LEAD_QUEUE,
    { outboxId: ref },
    { singletonKey: idempotencyKey }
  )
}

/** Finishes a booking that returned 202. The singleton key is the Idempotency-Key. */
export async function enqueueBooking(
  ref: string,
  idempotencyKey: string
): Promise<void> {
  const boss = await getBoss()
  await boss.send(
    BOOKING_QUEUE,
    { outboxId: ref },
    { singletonKey: idempotencyKey }
  )
}

/** One flush every five minutes. A missed tick is skipped; the next one catches up. */
export async function scheduleEventFlush(): Promise<void> {
  const boss = await getBoss()
  await boss.schedule(
    EVENTS_FLUSH_QUEUE,
    EVENTS_FLUSH_CRON,
    {},
    { tz: 'UTC', missed: 'skip', singletonKey: 'ghl-events-flush' }
  )
}

export async function stopBoss(): Promise<void> {
  if (!starting) return
  const boss = await starting
  starting = null
  await boss.stop()
}
