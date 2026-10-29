import { z } from 'zod'

/**
 * Shared building blocks for the /api/v1 contract. Contracts are frozen after
 * Phase 1: change them only through a PR that the contract owner approves
 * (docs/RULES.md), because the front end and the back end are built against
 * them in parallel.
 */

export const API_VERSION = 'v1'

/** Header carrying the client-generated UUID that makes a write idempotent. */
export const IDEMPOTENCY_HEADER = 'Idempotency-Key'
export const idempotencyKeySchema = z.uuid()

export const tierSchema = z.enum([
  'basic-diy',
  'executive',
  'founder',
  'diamond',
])
export type Tier = z.infer<typeof tierSchema>

/** E.164 phone number, e.g. +12605550198. Optional everywhere it appears. */
export const phoneSchema = z.string().regex(/^\+[1-9]\d{7,14}$/u, {
  error: 'Use international format, e.g. +12025550123',
})

export const emailSchema = z.email().max(254)
export const nameSchema = z.string().trim().min(1).max(80)

/** ISO-8601 date-time with an explicit offset, e.g. 2026-11-04T14:30:00-05:00. */
export const isoDateTimeSchema = z.iso.datetime({ offset: true })
/** ISO-8601 calendar date, e.g. 2026-11-04. */
export const isoDateSchema = z.iso.date()

/** IANA timezone name, e.g. America/New_York. Validated at runtime by the API. */
export const timezoneSchema = z.string().min(1).max(64)

/**
 * What the visitor agreed to, plus the exact wording they saw. The wording is
 * stored with the consent record as evidence (SMS rules require it). SMS
 * consent is a separate, unchecked-by-default box and requires a phone.
 */
export const consentSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  emailText: z.string().min(1).max(2000),
  smsText: z.string().max(2000),
})
export type Consent = z.infer<typeof consentSchema>

/** UTM attribution captured from the landing URL (first touch). */
export const utmSchema = z.object({
  source: z.string().max(200).optional(),
  medium: z.string().max(200).optional(),
  campaign: z.string().max(200).optional(),
  content: z.string().max(200).optional(),
  term: z.string().max(200).optional(),
})
export type Utm = z.infer<typeof utmSchema>

/** ALTCHA proof-of-work payload from the widget (verified server-side). */
export const altchaSchema = z.string().min(1).max(4000)

export const errorCodeSchema = z.enum([
  'validation_failed',
  'captcha_failed',
  'idempotency_key_missing',
  'rate_limited',
  'slot_taken',
  'slot_range_too_large',
  'upstream_unavailable',
  'unauthorized',
  'not_found',
  'internal_error',
])
export type ErrorCode = z.infer<typeof errorCodeSchema>

/** Every non-2xx response from /api/v1 uses this envelope. */
export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    /** Field path → message, for validation_failed. */
    fields: z.record(z.string(), z.string()).optional(),
  }),
})
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>

/** Response for a write accepted into the outbox (processed asynchronously). */
export const queuedSchema = z.object({
  status: z.literal('queued'),
  ref: z.uuid(),
})
export type Queued = z.infer<typeof queuedSchema>
