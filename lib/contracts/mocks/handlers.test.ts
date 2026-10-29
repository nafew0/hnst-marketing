import { beforeEach, describe, expect, it } from 'bun:test'

import { getResponse } from 'msw'

import {
  apiRoutes,
  type BookingInput,
  type LeadInput,
  bookingCreatedSchema,
  errorEnvelopeSchema,
  IDEMPOTENCY_HEADER,
  offersResponseSchema,
  queuedSchema,
  slotsResponseSchema,
} from '@/lib/contracts'

import { sampleBooking, sampleLead } from './fixtures'
import { handlers, resetMockState } from './handlers'

// P1 acceptance: the mocks answer every contract endpoint, and every answer
// parses with the contract the real back end must also satisfy. Handlers run
// directly (getResponse): Bun's fetch is not interceptable by msw/node.

const ORIGIN = 'http://localhost'

beforeEach(() => resetMockState())

async function fetch(url: string, init?: RequestInit) {
  const response = await getResponse(handlers, new Request(url, init), {
    baseUrl: ORIGIN,
  })
  if (!response) throw new Error(`No mock handler for ${url}`)
  return response
}

function post(
  path: string,
  body: LeadInput | BookingInput,
  key = crypto.randomUUID()
) {
  return fetch(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [IDEMPOTENCY_HEADER]: key },
    body: JSON.stringify(body),
  })
}

describe('POST /api/v1/leads', () => {
  it('queues a valid lead and replays a repeated key', async () => {
    const key = crypto.randomUUID()
    const first = await post(apiRoutes.leads, sampleLead, key)
    const second = await post(apiRoutes.leads, sampleLead, key)
    expect(first.status).toBe(202)
    expect(second.status).toBe(202)
    const a = queuedSchema.parse(await first.json())
    const b = queuedSchema.parse(await second.json())
    expect(b.ref).toBe(a.ref)
  })

  it('rejects a missing key and invalid fields with the envelope', async () => {
    const noKey = await fetch(`${ORIGIN}${apiRoutes.leads}`, {
      method: 'POST',
      body: JSON.stringify(sampleLead),
    })
    expect(noKey.status).toBe(400)
    expect(errorEnvelopeSchema.parse(await noKey.json()).error.code).toBe(
      'idempotency_key_missing'
    )

    const invalid = await post(apiRoutes.leads, { ...sampleLead, email: 'x' })
    const envelope = errorEnvelopeSchema.parse(await invalid.json())
    expect(invalid.status).toBe(400)
    expect(envelope.error.fields?.email).toBeDefined()
  })

  it('simulates captcha failure and rate limiting', async () => {
    const captcha = await post(apiRoutes.leads, {
      ...sampleLead,
      altcha: 'fail',
    })
    expect(captcha.status).toBe(400)
    const limited = await post(apiRoutes.leads, {
      ...sampleLead,
      email: 'a@ratelimit.test',
    })
    expect(limited.status).toBe(429)
  })
})

describe('GET /api/v1/booking/slots', () => {
  it('returns weekday slots with the timezone offset', async () => {
    const response = await fetch(
      `${ORIGIN}${apiRoutes.bookingSlots}?from=2027-01-04&to=2027-01-10&tz=America/New_York`
    )
    const body = slotsResponseSchema.parse(await response.json())
    expect(body.days.length).toBe(5)
    expect(body.days[0]?.slots[0]).toEndWith('-05:00')
  })

  it('rejects ranges over 31 days and unknown timezones', async () => {
    const tooLarge = await fetch(
      `${ORIGIN}${apiRoutes.bookingSlots}?from=2027-01-01&to=2027-03-01&tz=UTC`
    )
    expect(errorEnvelopeSchema.parse(await tooLarge.json()).error.code).toBe(
      'slot_range_too_large'
    )
    const badZone = await fetch(
      `${ORIGIN}${apiRoutes.bookingSlots}?from=2027-01-04&to=2027-01-05&tz=Mars/Base`
    )
    expect(badZone.status).toBe(400)
  })
})

describe('POST /api/v1/bookings', () => {
  it('books a slot for 30 minutes in the same offset', async () => {
    const response = await post(apiRoutes.bookings, sampleBooking)
    expect(response.status).toBe(201)
    const body = bookingCreatedSchema.parse(await response.json())
    expect(body.start).toBe(sampleBooking.slot)
    expect(body.end).toBe('2026-11-04T15:00:00-05:00')
  })

  it('returns 409 for a taken slot and 202 when GHL is down', async () => {
    const taken = await post(apiRoutes.bookings, {
      ...sampleBooking,
      contact: { ...sampleBooking.contact, email: 'taken@example.com' },
    })
    expect(taken.status).toBe(409)
    const down = await post(apiRoutes.bookings, {
      ...sampleBooking,
      contact: { ...sampleBooking.contact, email: 'a@ghl-down.test' },
    })
    expect(down.status).toBe(202)
    queuedSchema.parse(await down.json())
  })
})

describe('events and offers', () => {
  it('accepts an event batch with 204', async () => {
    const response = await fetch(`${ORIGIN}${apiRoutes.events}`, {
      method: 'POST',
      body: JSON.stringify({
        anonId: 'anon-12345678',
        events: [{ name: 'pricing_viewed', ts: '2026-11-01T10:00:00Z' }],
      }),
    })
    expect(response.status).toBe(204)
  })

  it('returns the four packages', async () => {
    const response = await fetch(`${ORIGIN}${apiRoutes.offers}`)
    const body = offersResponseSchema.parse(await response.json())
    expect(body.packages.map((p) => p.tier)).toEqual([
      'basic-diy',
      'executive',
      'founder',
      'diamond',
    ])
  })
})
