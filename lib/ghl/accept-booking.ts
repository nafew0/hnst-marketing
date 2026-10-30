import type {
  BookingCreated,
  BookingInput,
  ErrorCode,
  Queued,
} from '@/lib/contracts'
import {
  IDEMPOTENCY_HEADER,
  bookingInputSchema,
  idempotencyKeySchema,
} from '@/lib/contracts'

import { classifyBookingError } from './booking-error'
import { CALL_BOOKED_TAG, DISCOVERY_CALL_TITLE } from './constants'
import { issueFields } from './issues'
import {
  bookingContactRequest,
  bookingDescription,
  bookingOpportunityName,
  consentEvidence,
} from './payloads'
import type { GhlClient } from './types'

export type BookingProgressStatus =
  | 'processing'
  | 'contacted'
  | 'appointed'
  | 'tagged'
  | 'done'
  | 'failed'

export type StoredBookingResponse =
  | { status: 201; body: BookingCreated }
  | { status: 202; body: Queued }

export interface StoredBooking {
  ref: string
  idempotencyKey: string
  booking: BookingInput
  status: BookingProgressStatus
  ghlContactId: string | null
  ghlOpportunityId: string | null
  appointmentId: string | null
  start: string | null
  end: string | null
  tagged: boolean
  response: StoredBookingResponse | null
}

export interface BookingClaim {
  idempotencyKey: string
  booking: BookingInput
  email: string
  phone: string | null
  sms: boolean
  emailMarketing: boolean
  consentText: string
  ip: string | null
  userAgent: string | null
  pageUrl: string
}

export interface BookingStore {
  find(idempotencyKey: string): Promise<StoredBooking | null>
  claim(input: BookingClaim): Promise<{ created: boolean; row: StoredBooking }>
  save(row: StoredBooking): Promise<void>
  remove(ref: string): Promise<void>
}

export interface AcceptBookingDeps {
  verifyCaptcha: (payload: string) => Promise<boolean>
  store: BookingStore
  ghl: GhlClient
  enqueue: (ref: string, idempotencyKey: string) => Promise<void>
  now: () => string
}

export interface AcceptBookingRequest {
  idempotencyKey: string | null
  body: unknown
  ip: string | null
  userAgent: string | null
}

export type AcceptBookingResult =
  | { ok: true; status: 201; body: BookingCreated }
  | { ok: true; status: 202; body: Queued }
  | {
      ok: false
      status: 400 | 409 | 500 | 503
      code: ErrorCode
      message: string
      fields?: Record<string, string>
    }

function rejection(
  status: 400 | 409 | 500 | 503,
  code: ErrorCode,
  message: string,
  fields?: Record<string, string>
): AcceptBookingResult {
  if (fields) return { ok: false, status, code, message, fields }
  return { ok: false, status, code, message }
}

function createdFrom(row: StoredBooking): BookingCreated {
  if (!row.appointmentId || !row.start || !row.end) {
    throw new Error('Appointment id missing after create')
  }
  return {
    appointmentId: row.appointmentId,
    start: row.start,
    end: row.end,
  }
}

/**
 * Contact, appointment, tag, then the Call Booked stage. Each id is saved
 * before the next call so a 5xx retry does not create a second appointment.
 * Cost: a crash in the gap after GoHighLevel accepts and before the save
 * can create one duplicate, same as the lead note.
 */
export async function fulfillBooking(
  start: StoredBooking,
  ghl: GhlClient,
  save: (row: StoredBooking) => Promise<void>,
  nowIso: string
): Promise<BookingCreated> {
  let row = start
  if (row.ghlContactId === null) {
    const request = bookingContactRequest(row.booking, nowIso)
    const created = await ghl.upsertContact(request)
    row = { ...row, status: 'contacted', ghlContactId: created.contactId }
    await save(row)
  }
  const contactId = row.ghlContactId
  if (contactId === null) throw new Error('Contact id missing after upsert')

  if (row.appointmentId === null) {
    const created = await ghl.createAppointment({
      contactId,
      startTime: row.booking.slot,
      title: DISCOVERY_CALL_TITLE,
      description: bookingDescription(row.booking),
    })
    row = {
      ...row,
      status: 'appointed',
      appointmentId: created.appointmentId,
      start: created.start,
      end: created.end,
    }
    await save(row)
  }

  if (!row.tagged) {
    await ghl.addTags(contactId, ['src:website', CALL_BOOKED_TAG])
    row = { ...row, status: 'tagged', tagged: true }
    await save(row)
  }

  if (row.ghlOpportunityId === null) {
    const person = bookingOpportunityName(row.booking)
    const opportunity = await ghl.upsertOpportunity({
      contactId,
      name: person,
      stage: 'call-booked',
    })
    row = {
      ...row,
      status: 'done',
      ghlOpportunityId: opportunity.opportunityId,
    }
    await save(row)
  }

  return createdFrom(row)
}

async function replay(
  row: StoredBooking,
  deps: AcceptBookingDeps
): Promise<AcceptBookingResult | null> {
  const response = row.response
  if (!response) return null
  if (response.status === 202) {
    await deps.enqueue(response.body.ref, row.idempotencyKey)
    return { ok: true, status: 202, body: response.body }
  }
  return { ok: true, status: 201, body: response.body }
}

/**
 * Books synchronously. A repeated Idempotency-Key replays 201 or 202.
 * A taken slot is 409 and is not stored, so the same key can try another time.
 * GoHighLevel 5xx stores the outbox row and returns 202.
 */
export async function acceptBooking(
  request: AcceptBookingRequest,
  deps: AcceptBookingDeps
): Promise<AcceptBookingResult> {
  const key = idempotencyKeySchema.safeParse(request.idempotencyKey)
  if (!key.success) {
    return rejection(
      400,
      'idempotency_key_missing',
      `Send a UUID in the ${IDEMPOTENCY_HEADER} header.`
    )
  }

  const existing = await deps.store.find(key.data)
  if (existing) {
    const previous = await replay(existing, deps)
    if (previous) return previous
  }

  let row: StoredBooking
  if (existing) {
    row = existing
  } else {
    const parsed = bookingInputSchema.safeParse(request.body)
    if (!parsed.success) {
      return rejection(
        400,
        'validation_failed',
        'Some fields need attention.',
        issueFields(parsed.error.issues)
      )
    }

    const captchaOk = await deps.verifyCaptcha(parsed.data.altcha)
    if (!captchaOk) return rejection(400, 'captcha_failed', 'Please try again.')

    const booking = parsed.data
    const claimed = await deps.store.claim({
      idempotencyKey: key.data,
      booking,
      email: booking.contact.email,
      phone: booking.contact.phone ?? null,
      sms: booking.consent.sms,
      emailMarketing: booking.consent.email,
      consentText: consentEvidence(booking),
      ip: request.ip,
      userAgent: request.userAgent,
      pageUrl: booking.pageUrl,
    })
    row = claimed.row
    if (!claimed.created) {
      const previous = await replay(row, deps)
      if (previous) return previous
    }
  }

  try {
    const created = await fulfillBooking(
      row,
      deps.ghl,
      async (next) => {
        row = next
        await deps.store.save(next)
      },
      deps.now()
    )
    const saved: StoredBooking = {
      ...row,
      status: 'done',
      response: { status: 201, body: created },
    }
    await deps.store.save(saved)
    return { ok: true, status: 201, body: created }
  } catch (error) {
    const kind = classifyBookingError(error)
    if (kind === 'slot') {
      await deps.store.remove(row.ref)
      return rejection(
        409,
        'slot_taken',
        'That time was just booked. Please pick another.'
      )
    }
    if (kind === 'outage') {
      const body: Queued = { status: 'queued', ref: row.ref }
      await deps.store.save({ ...row, response: { status: 202, body } })
      await deps.enqueue(row.ref, key.data)
      return { ok: true, status: 202, body }
    }
    await deps.store.remove(row.ref)
    if (kind === 'config') {
      return rejection(500, 'internal_error', 'Booking is not configured.')
    }
    return rejection(
      503,
      'upstream_unavailable',
      'Booking is temporarily unavailable. Please try again.'
    )
  }
}
