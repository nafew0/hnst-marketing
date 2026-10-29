import { describe, expect, it } from 'bun:test'

import {
  bookingInputSchema,
  eventsInputSchema,
  ghlWorkflowEventSchema,
  leadInputSchema,
  offersResponseSchema,
  slotsQuerySchema,
} from '@/lib/contracts'
import {
  sampleBooking,
  sampleLead,
  sampleOffers,
} from '@/lib/contracts/mocks/fixtures'

// Cross-module invariants: the front end (forms) and back end (route
// handlers) both rely on these rules, so they are pinned here.

describe('leads contract', () => {
  it('accepts a complete lead', () => {
    expect(leadInputSchema.safeParse(sampleLead).success).toBe(true)
  })

  it('requires a phone when SMS consent is given', () => {
    const result = leadInputSchema.safeParse({
      ...sampleLead,
      phone: undefined,
      consent: { ...sampleLead.consent, sms: true },
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['phone'])
  })

  it('requires a package for package leads', () => {
    const result = leadInputSchema.safeParse({
      ...sampleLead,
      type: 'package',
      packageInterest: undefined,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['packageInterest'])
  })

  it('rejects a non-E.164 phone and a bad email', () => {
    expect(
      leadInputSchema.safeParse({ ...sampleLead, phone: '555-0198' }).success
    ).toBe(false)
    expect(
      leadInputSchema.safeParse({ ...sampleLead, email: 'not-an-email' })
        .success
    ).toBe(false)
  })
})

describe('booking contract', () => {
  it('accepts a booking with an offset date-time slot', () => {
    expect(bookingInputSchema.safeParse(sampleBooking).success).toBe(true)
  })

  it('rejects slot ranges over 31 days or reversed', () => {
    const tz = 'America/New_York'
    expect(
      slotsQuerySchema.safeParse({ from: '2026-11-01', to: '2026-12-01', tz })
        .success
    ).toBe(true)
    expect(
      slotsQuerySchema.safeParse({ from: '2026-11-01', to: '2026-12-03', tz })
        .success
    ).toBe(false)
    expect(
      slotsQuerySchema.safeParse({ from: '2026-11-10', to: '2026-11-01', tz })
        .success
    ).toBe(false)
  })
})

describe('events contract', () => {
  it('caps a batch at 50 events', () => {
    const event = { name: 'pricing_viewed', ts: '2026-11-01T10:00:00Z' }
    expect(
      eventsInputSchema.safeParse({
        anonId: 'anon-12345678',
        events: Array.from({ length: 51 }, () => event),
      }).success
    ).toBe(false)
  })
})

describe('offers and webhooks contracts', () => {
  it('parses the mock offers', () => {
    expect(offersResponseSchema.safeParse(sampleOffers).success).toBe(true)
  })

  it('keeps extra GHL fields on workflow payloads', () => {
    const parsed = ghlWorkflowEventSchema.parse({
      event: 'offer-changed',
      id: 'wf-1',
      contact_id: 'abc',
    })
    expect(parsed.contact_id).toBe('abc')
  })
})
