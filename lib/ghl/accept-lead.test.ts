import { describe, expect, it } from 'bun:test'

import { acceptLead, type NewLead } from './accept-lead'

const key = '6b9f1c2e-0a4d-4e3b-9c1a-2f4d6e8a0b1c'

function body(honeypot?: string) {
  const lead = {
    type: 'contact' as const,
    firstName: 'Ada',
    email: 'ada@example.com',
    consent: { email: true, sms: false, emailText: 'Send email', smsText: '' },
    utm: {},
    pageUrl: 'https://hnst.marketing/contact',
    altcha: 'ok',
  }
  if (honeypot === undefined) return lead
  return { ...lead, company_website_confirm: honeypot }
}

function harness(
  verifyCaptcha: (payload: string) => Promise<boolean> = async () => true
) {
  const rows = new Map<string, { ref: string; lead: NewLead }>()
  const queued: string[] = []
  const deps = {
    verifyCaptcha,
    findByKey: async (idempotencyKey: string) =>
      rows.get(idempotencyKey)?.ref ?? null,
    insert: async (lead: NewLead) => {
      const existing = rows.get(lead.idempotencyKey)
      if (existing) return { ref: existing.ref }
      const ref = crypto.randomUUID()
      rows.set(lead.idempotencyKey, { ref, lead })
      return { ref }
    },
    enqueue: async (ref: string) => {
      queued.push(ref)
    },
  }
  return { rows, queued, deps }
}

describe('acceptLead', () => {
  it('rejects a body that misses required fields and does not store it', async () => {
    const { rows, deps } = harness()
    const result = await acceptLead(
      {
        idempotencyKey: key,
        body: { type: 'contact' },
        ip: null,
        userAgent: null,
      },
      deps
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('validation_failed')
      expect(result.fields?.email?.length).toBeGreaterThan(0)
    }
    expect(rows.size).toBe(0)
  })

  it('rejects a missing idempotency key', async () => {
    const { rows, deps } = harness()
    const result = await acceptLead(
      { idempotencyKey: null, body: body(), ip: null, userAgent: null },
      deps
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('idempotency_key_missing')
    expect(rows.size).toBe(0)
  })

  it('rejects a filled honeypot and a failed captcha without storing a lead', async () => {
    const honeypot = harness()
    const tripped = await acceptLead(
      {
        idempotencyKey: key,
        body: body('https://spam.test'),
        ip: null,
        userAgent: null,
      },
      honeypot.deps
    )
    expect(tripped.ok).toBe(false)
    if (!tripped.ok) expect(tripped.code).toBe('captcha_failed')
    expect(honeypot.rows.size).toBe(0)

    const captcha = harness(async () => false)
    const failed = await acceptLead(
      { idempotencyKey: key, body: body(), ip: null, userAgent: null },
      captcha.deps
    )
    expect(failed.ok).toBe(false)
    if (!failed.ok) expect(failed.code).toBe('captcha_failed')
    expect(captcha.rows.size).toBe(0)
  })

  it('stores one lead and replays the same ref for a repeated key', async () => {
    const { rows, queued, deps } = harness()
    const request = {
      idempotencyKey: key,
      body: body(),
      ip: '203.0.113.8',
      userAgent: 'test',
    }
    const first = await acceptLead(request, deps)
    const second = await acceptLead(request, deps)
    const third = await acceptLead(
      { ...request, body: { ...body(), firstName: 'Other' } },
      deps
    )
    expect(first.ok && second.ok && third.ok).toBe(true)
    if (first.ok && second.ok && third.ok) {
      expect(second.ref).toBe(first.ref)
      expect(third.ref).toBe(first.ref)
    }
    expect(rows.size).toBe(1)
    expect(queued).toEqual([
      first.ok ? first.ref : '',
      first.ok ? first.ref : '',
      first.ok ? first.ref : '',
    ])
    expect(rows.get(key)?.lead.sms).toBe(false)
    expect(rows.get(key)?.lead.consentText).toContain('Send email')
  })
})
