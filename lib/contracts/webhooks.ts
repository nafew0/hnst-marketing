import { z } from 'zod'

/**
 * POST /api/webhooks/ghl-workflow/:key
 *
 * Called by a GHL workflow "Custom Webhook" action. `:key` must equal
 * GHL_WORKFLOW_SECRET (constant-time compare); deliveries are de-duplicated on
 * `id`. The payload is loose because GHL appends contact fields; only `event`
 * and `id` are relied on.
 *
 * 200 → { ok: true }   (also for duplicates, so GHL stops retrying)
 * 401 → unauthorized
 * 400 → validation_failed
 */
export const ghlWorkflowEventSchema = z.looseObject({
  event: z.enum(['offer-changed']),
  id: z.string().min(1).max(200),
})
export type GhlWorkflowEvent = z.infer<typeof ghlWorkflowEventSchema>

export const webhookAckSchema = z.object({ ok: z.literal(true) })
