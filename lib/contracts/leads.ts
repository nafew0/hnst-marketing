import { z } from 'zod'

import {
  altchaSchema,
  consentSchema,
  emailSchema,
  nameSchema,
  phoneSchema,
  tierSchema,
  utmSchema,
} from './common'

/**
 * POST /api/v1/leads
 *
 * Headers: `Idempotency-Key: <uuid>` (required; one new key per submit attempt).
 * 202 → { status: 'queued', ref }   accepted into the outbox, sent to GHL by the worker
 * 202 → same body again              a repeated Idempotency-Key replays the first response
 * 400 → validation_failed | captcha_failed | idempotency_key_missing
 * 429 → rate_limited
 *
 * GHL effects (worker): contacts/upsert with tags src:website, lead:<type>,
 * pkg:<tier>; note with the message and page URL; opportunity in "Website
 * Leads" at stage New; SMS DND when consent.sms is false.
 */
export const leadTypeSchema = z.enum(['contact', 'magnet', 'package', 'gift'])
export type LeadType = z.infer<typeof leadTypeSchema>

export const leadInputSchema = z
  .object({
    type: leadTypeSchema,
    firstName: nameSchema,
    lastName: nameSchema.optional(),
    email: emailSchema,
    phone: phoneSchema.optional(),
    company: z.string().trim().max(120).optional(),
    website: z.url().max(300).optional(),
    message: z.string().trim().max(4000).optional(),
    packageInterest: tierSchema.optional(),
    consent: consentSchema,
    utm: utmSchema,
    pageUrl: z.url().max(2000),
    altcha: altchaSchema,
  })
  .superRefine((lead, context) => {
    if (lead.consent.sms && !lead.phone) {
      context.addIssue({
        code: 'custom',
        path: ['phone'],
        message: 'Add a phone number to receive text messages',
      })
    }
    if (lead.consent.sms && lead.consent.smsText.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['consent', 'smsText'],
        message: 'SMS consent requires the consent wording shown',
      })
    }
    if (lead.type === 'package' && !lead.packageInterest) {
      context.addIssue({
        code: 'custom',
        path: ['packageInterest'],
        message: 'Choose a package',
      })
    }
  })
export type LeadInput = z.infer<typeof leadInputSchema>
