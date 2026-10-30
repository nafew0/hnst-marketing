import { describe, expect, it } from 'bun:test'

import { sampleBooking } from '@/lib/contracts/mocks/fixtures'

import {
  acceptBooking,
  fulfillBooking,
  type BookingStore,
  type StoredBooking,
} from './accept-booking'
import { GhlRequestError } from './errors'
import type {
  AppointmentRequest,
  ContactRequest,
  GhlClient,
  OpportunityRequest,
} from './types'

const key = '6b9f1c2e-0a4d-4e3b-9c1a-2f4d6e8a0b1c'

function memoryStore() {
  const rows = new Map<string, StoredBooking>()
  const store: BookingStore = {
    async find(idempotencyKey) {
      return rows.get(idempotencyKey) ?? null
    },
    async claim(input) {
      const existing = rows.get(input.idempotencyKey)
      if (existing) return { created: false, row: existing }
      const row: StoredBooking = {
        ref: crypto.randomUUID(),
        idempotencyKey: input.idempotencyKey,
        booking: input.booking,
        status: 'processing',
        ghlContactId: null,
        ghlOpportunityId: null,
        appointmentId: null,
        start: null,
        end: null,
        tagged: false,
        response: null,
      }
      rows.set(row.idempotencyKey, row)
      return { created: true, row }
    },
    async save(row) {
      rows.set(row.idempotencyKey, row)
    },
    async remove(ref) {
      for (const [idempotencyKey, row] of rows) {
        if (row.ref === ref) rows.delete(idempotencyKey)
      }
    },
  }
  return { rows, store }
}

function fakeGhl(mode: 'ok' | 'taken' | 'down') {
  const counts = { contacts: 0, appointments: 0, tags: 0, opportunities: 0 }
  const stages: string[] = []
  const descriptions: string[] = []
  const client: GhlClient = {
    async upsertContact(_input: ContactRequest) {
      counts.contacts += 1
      return { contactId: 'contact-1' }
    },
    async addNote() {
      return { noteId: 'note-1' }
    },
    async addTags() {
      counts.tags += 1
    },
    async upsertOpportunity(input: OpportunityRequest) {
      counts.opportunities += 1
      stages.push(input.stage ?? 'new')
      return { opportunityId: 'opp-1' }
    },
    async getFreeSlots() {
      return {}
    },
    async createAppointment(input: AppointmentRequest) {
      counts.appointments += 1
      if (input.description) descriptions.push(input.description)
      if (mode === 'taken') {
        throw new GhlRequestError(
          'The slot you have selected is no longer available',
          400,
          null
        )
      }
      if (mode === 'down') throw new GhlRequestError('upstream', 503, null)
      return {
        appointmentId: 'appt-1',
        start: sampleBooking.slot,
        end: '2026-11-04T15:00:00-05:00',
      }
    },
    async getCustomValues() {
      return []
    },
    async listProducts() {
      return []
    },
    async applyIntent() {
      return 'missing'
    },
  }
  return { client, counts, stages, descriptions }
}

function deps(store: BookingStore, ghl: GhlClient, queued: string[] = []) {
  return {
    verifyCaptcha: async () => true,
    store,
    ghl,
    enqueue: async (ref: string) => {
      queued.push(ref)
    },
    now: () => '2026-10-30T00:00:00.000Z',
  }
}

describe('booking', () => {
  it('returns 409 when the slot is taken and does not keep the key', async () => {
    const { rows, store } = memoryStore()
    const { client, counts } = fakeGhl('taken')
    const first = await acceptBooking(
      { idempotencyKey: key, body: sampleBooking, ip: null, userAgent: null },
      deps(store, client)
    )
    const second = await acceptBooking(
      { idempotencyKey: key, body: sampleBooking, ip: null, userAgent: null },
      deps(store, client)
    )
    expect(first.ok).toBe(false)
    expect(second.ok).toBe(false)
    if (!first.ok && !second.ok) {
      expect(first.code).toBe('slot_taken')
      expect(second.status).toBe(409)
    }
    expect(counts.appointments).toBe(2)
    expect(rows.size).toBe(0)
  })

  it('replays 201 for the same idempotency key without a second appointment', async () => {
    const { store } = memoryStore()
    const { client, counts, stages, descriptions } = fakeGhl('ok')
    const booked = deps(store, client)
    const first = await acceptBooking(
      { idempotencyKey: key, body: sampleBooking, ip: null, userAgent: null },
      booked
    )
    const second = await acceptBooking(
      { idempotencyKey: key, body: sampleBooking, ip: null, userAgent: null },
      booked
    )
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    if (
      first.ok &&
      second.ok &&
      first.status === 201 &&
      second.status === 201
    ) {
      expect(first.body.appointmentId).toBe('appt-1')
      expect(second.body).toEqual(first.body)
    }
    expect(counts.appointments).toBe(1)
    expect(counts.contacts).toBe(1)
    expect(stages).toEqual(['call-booked'])
    expect(descriptions[0]).toContain('Page:')
    expect(descriptions[0]).not.toContain('ignoreFreeSlotValidation')
  })

  it('replays 202 with the same ref when GoHighLevel is down', async () => {
    const { store } = memoryStore()
    const { client, counts } = fakeGhl('down')
    const queued: string[] = []
    const booked = deps(store, client, queued)
    const first = await acceptBooking(
      { idempotencyKey: key, body: sampleBooking, ip: null, userAgent: null },
      booked
    )
    const second = await acceptBooking(
      { idempotencyKey: key, body: sampleBooking, ip: null, userAgent: null },
      booked
    )
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    if (
      first.ok &&
      second.ok &&
      first.status === 202 &&
      second.status === 202
    ) {
      expect(second.body.ref).toBe(first.body.ref)
    }
    expect(counts.appointments).toBe(1)
    expect(queued).toHaveLength(2)
  })

  it('keeps the booking when a step fails after the appointment exists', async () => {
    const { rows, store } = memoryStore()
    const { client, counts } = fakeGhl('ok')
    const failing: GhlClient = {
      ...client,
      async upsertOpportunity() {
        throw new GhlRequestError('Call Booked stage id is not set', 0, null)
      },
    }
    const queued: string[] = []
    const booked = deps(store, failing, queued)
    const first = await acceptBooking(
      { idempotencyKey: key, body: sampleBooking, ip: null, userAgent: null },
      booked
    )
    const retry = await acceptBooking(
      { idempotencyKey: key, body: sampleBooking, ip: null, userAgent: null },
      booked
    )
    expect(first.ok).toBe(true)
    if (first.ok && first.status === 201) {
      expect(first.body.appointmentId).toBe('appt-1')
    }
    expect(retry).toEqual(first)
    expect(counts.appointments).toBe(1)
    expect(rows.size).toBe(1)
    expect(queued).toHaveLength(1)
  })

  it('resumes a partial booking without creating a second contact', async () => {
    const { client, counts } = fakeGhl('ok')
    const row: StoredBooking = {
      ref: '4f1c2a7e-6b3d-4a90-8c1e-2d5f7a9b0c11',
      idempotencyKey: key,
      booking: sampleBooking,
      status: 'contacted',
      ghlContactId: 'contact-1',
      ghlOpportunityId: null,
      appointmentId: null,
      start: null,
      end: null,
      tagged: false,
      response: null,
    }
    const saved: StoredBooking[] = []
    const created = await fulfillBooking(
      row,
      client,
      async (next) => {
        saved.push(next)
      },
      '2026-10-30T00:00:00.000Z'
    )
    expect(saved.length).toBeGreaterThan(0)
    expect(created.appointmentId).toBe('appt-1')
    expect(counts.contacts).toBe(0)
    expect(counts.appointments).toBe(1)
    expect(counts.opportunities).toBe(1)
  })
})
