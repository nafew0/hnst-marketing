import { z } from 'zod'

import {
  altchaSchema,
  consentSchema,
  emailSchema,
  isoDateSchema,
  isoDateTimeSchema,
  nameSchema,
  phoneSchema,
  timezoneSchema,
  utmSchema,
} from './common'

/** GHL's free-slots endpoint accepts at most a 31-day window. */
export const MAX_SLOT_RANGE_DAYS = 31

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * GET /api/v1/booking/slots?from=YYYY-MM-DD&to=YYYY-MM-DD&tz=IANA
 *
 * 200 → { tz, days: [{ date, slots: [ISO date-time with offset] }] }
 *        Days without availability are omitted. Cached ~60 s server-side.
 * 400 → validation_failed | slot_range_too_large (to - from > 31 days)
 */
export const slotsQuerySchema = z
  .object({
    from: isoDateSchema,
    to: isoDateSchema,
    tz: timezoneSchema,
  })
  .superRefine((query, context) => {
    const span = (Date.parse(query.to) - Date.parse(query.from)) / DAY_MS
    if (span < 0) {
      context.addIssue({
        code: 'custom',
        path: ['to'],
        message: '`to` must be on or after `from`',
      })
    }
    if (span > MAX_SLOT_RANGE_DAYS) {
      context.addIssue({
        code: 'custom',
        path: ['to'],
        message: `The range can be at most ${MAX_SLOT_RANGE_DAYS} days`,
      })
    }
  })
export type SlotsQuery = z.infer<typeof slotsQuerySchema>

export const slotsResponseSchema = z.object({
  tz: timezoneSchema,
  days: z.array(
    z.object({
      date: isoDateSchema,
      slots: z.array(isoDateTimeSchema),
    })
  ),
})
export type SlotsResponse = z.infer<typeof slotsResponseSchema>

/**
 * POST /api/v1/bookings
 *
 * Headers: `Idempotency-Key: <uuid>` (required).
 * 201 → { appointmentId, start, end }   booked synchronously in GHL
 * 202 → { status: 'queued', ref }       GHL was unavailable; the worker retries
 * 409 → slot_taken                      the slot is no longer free; refresh slots
 * 400 → validation_failed | captcha_failed | idempotency_key_missing
 * 429 → rate_limited
 *
 * GHL effects: contact upsert → appointment on the Discovery Call calendar
 * (never with ignoreFreeSlotValidation) → tag stage:call-booked → opportunity
 * moved to "Call Booked".
 */
export const bookingInputSchema = z
  .object({
    slot: isoDateTimeSchema,
    tz: timezoneSchema,
    contact: z.object({
      firstName: nameSchema,
      lastName: nameSchema.optional(),
      email: emailSchema,
      phone: phoneSchema.optional(),
    }),
    /** Qualifying question id → answer (questions come from CMS SiteSettings). */
    answers: z.record(z.string().max(80), z.string().max(2000)),
    consent: consentSchema,
    utm: utmSchema,
    pageUrl: z.url().max(2000),
    altcha: altchaSchema,
  })
  .superRefine((booking, context) => {
    if (booking.consent.sms && !booking.contact.phone) {
      context.addIssue({
        code: 'custom',
        path: ['contact', 'phone'],
        message: 'Add a phone number to receive text messages',
      })
    }
  })
export type BookingInput = z.infer<typeof bookingInputSchema>

export const bookingCreatedSchema = z.object({
  appointmentId: z.string().min(1),
  start: isoDateTimeSchema,
  end: isoDateTimeSchema,
})
export type BookingCreated = z.infer<typeof bookingCreatedSchema>
