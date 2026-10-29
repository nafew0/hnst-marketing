import { delay, HttpResponse, http } from 'msw'
import type { z } from 'zod'

import {
  apiRoutes,
  type BookingCreated,
  bookingInputSchema,
  type ErrorCode,
  type ErrorEnvelope,
  eventsInputSchema,
  IDEMPOTENCY_HEADER,
  idempotencyKeySchema,
  leadInputSchema,
  type Queued,
  type SlotsResponse,
  slotsQuerySchema,
} from '@/lib/contracts'

import { sampleOffers } from './fixtures'

/**
 * Mock /api/v1 for front-end work before the real back end exists (P3, P6),
 * and for component tests. Behaviour follows lib/contracts exactly; anything
 * the contract does not promise is not simulated.
 *
 * Magic values to reach the failure paths from a form:
 * - email `taken@…`             → POST /bookings 409 slot_taken
 * - email `…@ghl-down.test`     → POST /bookings 202 queued (GHL unavailable)
 * - email `…@ratelimit.test`    → POST /leads and /bookings 429 rate_limited
 * - altcha payload `fail`       → 400 captcha_failed
 */

/** Realistic round trip in the browser; none under `bun test`. */
export const MOCK_LATENCY_MS = process.env.NODE_ENV === 'test' ? 0 : 800

const SLOT_TIMES = ['09:30', '11:00', '13:30', '15:00', '16:30'] as const
const CALL_MINUTES = 30

interface Replay {
  status: 201 | 202
  body: Queued | BookingCreated
}

/** Idempotency-Key → first response, so a retried write replays it. */
const replays = new Map<string, Replay>()

export function resetMockState() {
  replays.clear()
}

function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  fields?: Record<string, string>
) {
  const body: ErrorEnvelope = {
    error: fields ? { code, message, fields } : { code, message },
  }
  return HttpResponse.json(body, { status })
}

function validationFailed(issues: z.core.$ZodIssue[]) {
  const fields: Record<string, string> = {}
  for (const issue of issues) {
    const path = issue.path.join('.') || '(root)'
    fields[path] ??= issue.message
  }
  return errorResponse(
    'validation_failed',
    'Some fields need attention.',
    400,
    fields
  )
}

/** Parses the JSON body with a contract schema; bad JSON fails like bad fields. */
async function parseBody<S extends z.ZodType>(request: Request, schema: S) {
  const body: unknown = await request.json().catch(() => undefined)
  return schema.safeParse(body)
}

type KeyCheck = { ok: true; key: string } | { ok: false; response: Response }

/** The replay key, or the error response when the header is unusable. */
function idempotencyKey(request: Request, route: string): KeyCheck {
  const parsed = idempotencyKeySchema.safeParse(
    request.headers.get(IDEMPOTENCY_HEADER)
  )
  if (!parsed.success) {
    return {
      ok: false,
      response: errorResponse(
        'idempotency_key_missing',
        `Send a UUID in the ${IDEMPOTENCY_HEADER} header.`,
        400
      ),
    }
  }
  return { ok: true, key: `${route}:${parsed.data}` }
}

function remember(key: string, status: Replay['status'], body: Replay['body']) {
  replays.set(key, { status, body })
  return HttpResponse.json(body, { status })
}

function replay(key: string) {
  const previous = replays.get(key)
  return previous
    ? HttpResponse.json(previous.body, { status: previous.status })
    : undefined
}

function queued(): Queued {
  return { status: 'queued', ref: crypto.randomUUID() }
}

function emailDomain(email: string) {
  return email.slice(email.lastIndexOf('@') + 1).toLowerCase()
}

/** `+HH:MM` / `-HH:MM` / `Z` for a timezone on a date; throws on a bad zone. */
function offsetFor(date: string, timeZone: string) {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  })
    .formatToParts(new Date(`${date}T12:00:00Z`))
    .find((part) => part.type === 'timeZoneName')?.value
  return !name || name === 'GMT' ? 'Z' : name.slice(3)
}

function isValidTimeZone(timeZone: string) {
  try {
    offsetFor('2026-01-01', timeZone)
    return true
  } catch {
    return false
  }
}

/** Weekdays only, from today onwards, with a deterministic gap or two. */
function buildSlots(from: string, to: string, tz: string): SlotsResponse {
  const today = new Date().toISOString().slice(0, 10)
  const days: SlotsResponse['days'] = []
  const cursor = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)

  while (cursor <= end) {
    const date = cursor.toISOString().slice(0, 10)
    const weekday = cursor.getUTCDay()
    if (date >= today && weekday !== 0 && weekday !== 6) {
      const offset = offsetFor(date, tz)
      const dayOfMonth = cursor.getUTCDate()
      const slots = SLOT_TIMES.filter(
        (_, index) => (dayOfMonth + index) % 4 !== 0
      ).map((time) => `${date}T${time}:00${offset}`)
      if (slots.length > 0) days.push({ date, slots })
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return { tz, days }
}

/** Adds minutes to the slot's wall-clock time, keeping its offset. */
function addMinutes(slot: string, minutes: number) {
  const wallClock = new Date(`${slot.slice(0, 19)}Z`)
  wallClock.setUTCMinutes(wallClock.getUTCMinutes() + minutes)
  return `${wallClock.toISOString().slice(0, 19)}${slot.slice(19)}`
}

export const handlers = [
  http.post(apiRoutes.leads, async ({ request }) => {
    await delay(MOCK_LATENCY_MS)
    const check = idempotencyKey(request, apiRoutes.leads)
    if (!check.ok) return check.response
    const { key } = check
    const previous = replay(key)
    if (previous) return previous

    const parsed = await parseBody(request, leadInputSchema)
    if (!parsed.success) return validationFailed(parsed.error.issues)
    if (parsed.data.altcha === 'fail') {
      return errorResponse('captcha_failed', 'Please try again.', 400)
    }
    if (emailDomain(parsed.data.email) === 'ratelimit.test') {
      return errorResponse('rate_limited', 'Too many requests.', 429)
    }

    return remember(key, 202, queued())
  }),

  http.get(apiRoutes.bookingSlots, async ({ request }) => {
    await delay(MOCK_LATENCY_MS)
    const params = Object.fromEntries(new URL(request.url).searchParams)
    const parsed = slotsQuerySchema.safeParse(params)
    if (!parsed.success) {
      const tooLarge = parsed.error.issues.some((issue) =>
        issue.message.includes('at most')
      )
      return tooLarge
        ? errorResponse(
            'slot_range_too_large',
            'Ask for 31 days or fewer.',
            400
          )
        : validationFailed(parsed.error.issues)
    }
    if (!isValidTimeZone(parsed.data.tz)) {
      return errorResponse('validation_failed', 'Unknown timezone.', 400, {
        tz: 'Use an IANA timezone, e.g. America/New_York',
      })
    }

    const { from, to, tz } = parsed.data
    return HttpResponse.json(buildSlots(from, to, tz))
  }),

  http.post(apiRoutes.bookings, async ({ request }) => {
    await delay(MOCK_LATENCY_MS)
    const check = idempotencyKey(request, apiRoutes.bookings)
    if (!check.ok) return check.response
    const { key } = check
    const previous = replay(key)
    if (previous) return previous

    const parsed = await parseBody(request, bookingInputSchema)
    if (!parsed.success) return validationFailed(parsed.error.issues)

    const { altcha, contact, slot } = parsed.data
    const domain = emailDomain(contact.email)
    if (altcha === 'fail') {
      return errorResponse('captcha_failed', 'Please try again.', 400)
    }
    if (domain === 'ratelimit.test') {
      return errorResponse('rate_limited', 'Too many requests.', 429)
    }
    if (contact.email.toLowerCase().startsWith('taken@')) {
      return errorResponse(
        'slot_taken',
        'That time was just booked. Please pick another.',
        409
      )
    }
    if (domain === 'ghl-down.test') return remember(key, 202, queued())

    const created: BookingCreated = {
      appointmentId: `mock-${crypto.randomUUID().slice(0, 8)}`,
      start: slot,
      end: addMinutes(slot, CALL_MINUTES),
    }
    return remember(key, 201, created)
  }),

  http.post(apiRoutes.events, async ({ request }) => {
    const parsed = await parseBody(request, eventsInputSchema)
    if (!parsed.success) return validationFailed(parsed.error.issues)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(apiRoutes.offers, async () => {
    await delay(MOCK_LATENCY_MS / 4)
    return HttpResponse.json(sampleOffers)
  }),
]
