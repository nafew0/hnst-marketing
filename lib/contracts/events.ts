import { z } from 'zod'

import { emailSchema, isoDateTimeSchema } from './common'

/**
 * POST /api/v1/events
 *
 * Batched intent signals from `track()` (sent every ~10 s or on page hide via
 * sendBeacon). Stored in a buffer; the worker turns them into GHL tags and the
 * `intent_signals` field at most once per contact per 5 minutes.
 *
 * 204 → no body
 * 400 → validation_failed
 * 429 → rate_limited
 */
export const eventNameSchema = z.enum([
  'pricing_viewed',
  'package_clicked',
  'cta_clicked',
  'video_completed',
  'booking_step',
])
export type EventName = z.infer<typeof eventNameSchema>

export const eventPropValueSchema = z.union([
  z.string().max(200),
  z.number(),
  z.boolean(),
])

export const eventsInputSchema = z.object({
  /** Random id stored in localStorage; links anonymous events to a later lead. */
  anonId: z.string().min(8).max(64),
  email: emailSchema.optional(),
  events: z
    .array(
      z.object({
        name: eventNameSchema,
        props: z.record(z.string().max(40), eventPropValueSchema).optional(),
        ts: isoDateTimeSchema,
      })
    )
    .min(1)
    .max(50),
})
export type EventsInput = z.infer<typeof eventsInputSchema>
