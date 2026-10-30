import { z } from 'zod'

import {
  IDEMPOTENCY_HEADER,
  type ErrorCode,
  idempotencyKeySchema,
  leadInputSchema,
  type LeadInput,
} from '@/lib/contracts'

import { HONEYPOT_FIELD } from './constants'
import { consentEvidence } from './payloads'

const filledHoneypot = z.union([
  z.string().trim().min(1),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.record(z.string(), z.string()),
])

const honeypotSchema = z.object({
  [HONEYPOT_FIELD]: z.union([z.literal(''), filledHoneypot]).optional(),
})

export interface NewLead {
  idempotencyKey: string
  lead: LeadInput
  email: string
  phone: string | null
  sms: boolean
  emailMarketing: boolean
  consentText: string
  ip: string | null
  userAgent: string | null
  pageUrl: string
}

export interface AcceptLeadDeps {
  verifyCaptcha: (payload: string) => Promise<boolean>
  findByKey: (key: string) => Promise<string | null>
  insert: (lead: NewLead) => Promise<{ ref: string }>
  enqueue: (ref: string, idempotencyKey: string) => Promise<void>
}

export interface AcceptLeadRequest {
  idempotencyKey: string | null
  body: unknown
  ip: string | null
  userAgent: string | null
}

export type AcceptLeadResult =
  | { ok: true; ref: string }
  | {
      ok: false
      status: 400
      code: ErrorCode
      message: string
      fields?: Record<string, string>
    }

function fieldErrors(issues: z.core.$ZodIssue[]) {
  const fields: Record<string, string> = {}
  for (const issue of issues) {
    const path = issue.path.map(String).join('.') || '(root)'
    fields[path] ??= issue.message
  }
  return fields
}

function rejection(
  code: ErrorCode,
  message: string,
  fields?: Record<string, string>
): AcceptLeadResult {
  if (fields) return { ok: false, status: 400, code, message, fields }
  return { ok: false, status: 400, code, message }
}

/** A filled honeypot, or a value that is not a string, is a bot. */
function honeypotTripped(
  parsed: z.infer<typeof honeypotSchema> | null
): boolean {
  if (!parsed) return false
  const value = parsed[HONEYPOT_FIELD]
  return value !== undefined && value !== ''
}

/**
 * Accepts a lead into the outbox. A repeated Idempotency-Key replays the first
 * `202` and does not validate again, so a single-use captcha can be retried.
 */
export async function acceptLead(
  request: AcceptLeadRequest,
  deps: AcceptLeadDeps
): Promise<AcceptLeadResult> {
  const key = idempotencyKeySchema.safeParse(request.idempotencyKey)
  if (!key.success) {
    return rejection(
      'idempotency_key_missing',
      `Send a UUID in the ${IDEMPOTENCY_HEADER} header.`
    )
  }

  const existing = await deps.findByKey(key.data)
  if (existing) {
    await deps.enqueue(existing, key.data)
    return { ok: true, ref: existing }
  }

  const parsed = leadInputSchema.safeParse(request.body)
  if (!parsed.success) {
    return rejection(
      'validation_failed',
      'Some fields need attention.',
      fieldErrors(parsed.error.issues)
    )
  }

  const honeypot = honeypotSchema.safeParse(request.body)
  const tripped = honeypot.success
    ? honeypotTripped(honeypot.data)
    : honeypot.error.issues.some(
        (issue) => String(issue.path[0]) === HONEYPOT_FIELD
      )
  if (tripped) {
    return rejection('captcha_failed', 'Please try again.')
  }

  const captchaOk = await deps.verifyCaptcha(parsed.data.altcha)
  if (!captchaOk) return rejection('captcha_failed', 'Please try again.')

  const lead = parsed.data
  const stored = await deps.insert({
    idempotencyKey: key.data,
    lead,
    email: lead.email,
    phone: lead.phone ?? null,
    sms: lead.consent.sms,
    emailMarketing: lead.consent.email,
    consentText: consentEvidence(lead),
    ip: request.ip,
    userAgent: request.userAgent,
    pageUrl: lead.pageUrl,
  })
  await deps.enqueue(stored.ref, key.data)
  return { ok: true, ref: stored.ref }
}
