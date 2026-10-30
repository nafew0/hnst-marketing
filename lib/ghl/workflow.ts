import { createHash, timingSafeEqual } from 'node:crypto'

import { z } from 'zod'

import type { ErrorCode } from '@/lib/contracts'
import { ghlWorkflowEventSchema } from '@/lib/contracts'

import { issueFields } from './issues'

const stampSchema = z.object({
  timestamp: z.string().min(1).max(80).optional(),
})

export interface WorkflowDelivery {
  key: string
  secret: string
  body: unknown
}

export interface WorkflowDeps {
  insertReceipt: (id: string) => Promise<boolean>
  deleteReceipt: (id: string) => Promise<void>
  revalidate: () => void
}

export type WorkflowResult =
  | { ok: true; duplicate: boolean }
  | {
      ok: false
      status: 400 | 401
      code: ErrorCode
      message: string
      fields?: Record<string, string>
    }

/** SHA-256 then a fixed-length compare, so a short key does not return early. */
export function secretsMatch(provided: string, expected: string): boolean {
  const left = createHash('sha256').update(provided).digest()
  const right = createHash('sha256').update(expected).digest()
  return timingSafeEqual(left, right)
}

/** Receipt key is the payload id plus its timestamp when GHL sent one. */
export function receiptKey(id: string, timestamp: string | undefined): string {
  return timestamp ? `${id}:${timestamp}` : id
}

/**
 * Constant-time key check, then one receipt insert. A duplicate returns 200
 * without expiring the offers cache. offer-changed expires that tag.
 */
export async function acceptWorkflow(
  delivery: WorkflowDelivery,
  deps: WorkflowDeps
): Promise<WorkflowResult> {
  if (!secretsMatch(delivery.key, delivery.secret)) {
    return {
      ok: false,
      status: 401,
      code: 'unauthorized',
      message: 'Unauthorized.',
    }
  }

  const parsed = ghlWorkflowEventSchema.safeParse(delivery.body)
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: 'validation_failed',
      message: 'Some fields need attention.',
      fields: issueFields(parsed.error.issues),
    }
  }

  const stamp = stampSchema.safeParse(delivery.body)
  const timestamp = stamp.success ? stamp.data.timestamp : undefined
  const id = receiptKey(parsed.data.id, timestamp)
  const inserted = await deps.insertReceipt(id)
  if (!inserted) return { ok: true, duplicate: true }

  try {
    deps.revalidate()
  } catch (error) {
    await deps.deleteReceipt(id)
    throw error
  }
  return { ok: true, duplicate: false }
}
