import { z } from 'zod'

import type { FormState } from '@/lib/types/form'

import {
  apiRoutes,
  type BookingInput,
  bookingCreatedSchema,
  type ErrorEnvelope,
  errorEnvelopeSchema,
  type EventsInput,
  IDEMPOTENCY_HEADER,
  type LeadInput,
  offersResponseSchema,
  queuedSchema,
  type SlotsQuery,
  slotsResponseSchema,
} from '.'
import { mocksReady } from './mocks/ready'

/**
 * Typed browser client for /api/v1. Every call resolves (never throws) to a
 * result the UI can switch on, so forms render one error path for network,
 * validation and upstream failures alike. Success bodies are parsed with the
 * contract: a back end that drifts from it surfaces as `internal_error`
 * instead of a crash deep in a component.
 *
 * Writes take an idempotency key: create it once per submission (first
 * attempt) and reuse it on retry, so a double click or a flaky network never
 * creates two leads or bookings.
 */

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: ErrorEnvelope['error'] }

const NETWORK_ERROR: ErrorEnvelope['error'] = {
  code: 'upstream_unavailable',
  message: 'Network error. Check your connection and try again.',
}

const UNEXPECTED_RESPONSE: ErrorEnvelope['error'] = {
  code: 'internal_error',
  message: 'Something went wrong. Please try again.',
}

async function request<S extends z.ZodType>(
  path: string,
  schema: S,
  init: RequestInit = {}
): Promise<ApiResult<z.output<S>>> {
  await mocksReady()
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    })
  } catch {
    return { ok: false, status: 0, error: NETWORK_ERROR }
  }

  const body: unknown =
    response.status === 204
      ? undefined
      : await response.json().catch(() => undefined)

  if (response.ok) {
    const parsed = schema.safeParse(body)
    return parsed.success
      ? { ok: true, status: response.status, data: parsed.data }
      : { ok: false, status: response.status, error: UNEXPECTED_RESPONSE }
  }

  const envelope = errorEnvelopeSchema.safeParse(body)
  return {
    ok: false,
    status: response.status,
    error: envelope.success ? envelope.data.error : UNEXPECTED_RESPONSE,
  }
}

function write<S extends z.ZodType>(
  path: string,
  schema: S,
  body: LeadInput | BookingInput,
  idempotencyKey: string
) {
  return request(path, schema, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
  })
}

export const api = {
  submitLead: (input: LeadInput, idempotencyKey: string) =>
    write(apiRoutes.leads, queuedSchema, input, idempotencyKey),

  getSlots: (query: SlotsQuery) =>
    request(
      `${apiRoutes.bookingSlots}?${new URLSearchParams(query)}`,
      slotsResponseSchema
    ),

  /** 201 → booked (`appointmentId`), 202 → queued (`status: 'queued'`). */
  book: (input: BookingInput, idempotencyKey: string) =>
    write(
      apiRoutes.bookings,
      z.union([bookingCreatedSchema, queuedSchema]),
      input,
      idempotencyKey
    ),

  /** Fire-and-forget; prefer `navigator.sendBeacon` on page hide. */
  sendEvents: (input: EventsInput) =>
    request(apiRoutes.events, z.undefined(), {
      method: 'POST',
      body: JSON.stringify(input),
      keepalive: true,
    }),

  getOffers: () => request(apiRoutes.offers, offersResponseSchema),
}

export function newIdempotencyKey() {
  return crypto.randomUUID()
}

/**
 * Adapts an API result to the Satus `<Form>` state, so a client form action
 * can return it directly. `fieldErrors` keys are contract paths
 * (`email`, `contact.phone`): name each input after its contract path.
 */
export function toFormState<T>(
  result: ApiResult<T>,
  successMessage: string
): FormState<T> {
  if (result.ok) {
    return { status: result.status, message: successMessage, data: result.data }
  }
  return result.error.fields
    ? {
        status: result.status,
        message: result.error.message,
        fieldErrors: result.error.fields,
      }
    : { status: result.status, message: result.error.message }
}
