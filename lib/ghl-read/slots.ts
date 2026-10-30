import type { ErrorCode, SlotsResponse } from '@/lib/contracts'
import {
  isoDateSchema,
  isoDateTimeSchema,
  slotsQuerySchema,
} from '@/lib/contracts'
import { SLOT_CACHE_MS } from '@/lib/ghl/constants'
import { GhlRequestError } from '@/lib/ghl/errors'
import { issueFields } from '@/lib/ghl/issues'
import type { FreeSlotQuery } from '@/lib/ghl/types'

const OFFSET = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/u
const DAY_MS = 24 * 60 * 60 * 1000

export interface SlotQueryInput {
  from: string
  to: string
  tz: string
}

export interface SlotDeps {
  getFreeSlots: (input: FreeSlotQuery) => Promise<Record<string, string[]>>
}

export type SlotRead =
  | { ok: true; body: SlotsResponse }
  | {
      ok: false
      status: 400 | 503
      code: ErrorCode
      message: string
      fields?: Record<string, string>
    }

interface CacheEntry {
  expiresAt: number
  body: SlotsResponse
}

const slotCache = new Map<string, CacheEntry>()

export function clearSlotCache(): void {
  slotCache.clear()
}

export function timeZoneOffsetMinutes(instant: Date, timeZone: string): number {
  let name: string | undefined
  try {
    name = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
      hour: '2-digit',
      minute: '2-digit',
    })
      .formatToParts(instant)
      .find((part) => part.type === 'timeZoneName')?.value
  } catch {
    throw new Error(`Unknown timezone: ${timeZone}`)
  }
  if (!name || name === 'GMT') return 0
  const match = OFFSET.exec(name)
  const sign = match?.[1]
  const hours = match?.[2]
  const minutes = match?.[3] ?? '0'
  if (!sign || !hours) throw new Error(`Unknown timezone: ${timeZone}`)
  const magnitude = Number(hours) * 60 + Number(minutes)
  return sign === '-' ? -magnitude : magnitude
}

/** UTC milliseconds of local midnight on `date` in `timeZone`. */
export function zonedDayStartMs(date: string, timeZone: string): number {
  const utcMidnight = Date.parse(`${date}T00:00:00Z`)
  const first = timeZoneOffsetMinutes(new Date(utcMidnight), timeZone)
  const guess = utcMidnight - first * 60_000
  const second = timeZoneOffsetMinutes(new Date(guess), timeZone)
  return utcMidnight - second * 60_000
}

function nextDate(isoDate: string): string {
  const parsed = new Date(Date.parse(`${isoDate}T00:00:00Z`) + DAY_MS)
  return parsed.toISOString().slice(0, 10)
}

function failure(
  status: 400 | 503,
  code: ErrorCode,
  message: string,
  fields?: Record<string, string>
): SlotRead {
  if (fields) return { ok: false, status, code, message, fields }
  return { ok: false, status, code, message }
}

function mapSlots(tz: string, raw: Record<string, string[]>): SlotsResponse {
  const days: SlotsResponse['days'] = []
  const dates = Object.keys(raw).sort()
  for (const date of dates) {
    if (!isoDateSchema.safeParse(date).success) continue
    const slots = raw[date] ?? []
    const valid = slots.filter(
      (slot) => isoDateTimeSchema.safeParse(slot).success
    )
    if (valid.length === 0) continue
    valid.sort()
    days.push({ date, slots: valid })
  }
  return { tz, days }
}

/**
 * Free slots for at most 31 days, cached in memory for 60 seconds per
 * (from, to, tz). Failures are not cached.
 */
export async function readFreeSlots(
  input: SlotQueryInput,
  deps: SlotDeps,
  now = Date.now()
): Promise<SlotRead> {
  const parsed = slotsQuerySchema.safeParse(input)
  if (!parsed.success) {
    const tooLarge = parsed.error.issues.some((issue) =>
      issue.message.includes('at most')
    )
    return tooLarge
      ? failure(400, 'slot_range_too_large', 'Ask for 31 days or fewer.')
      : failure(
          400,
          'validation_failed',
          'Some fields need attention.',
          issueFields(parsed.error.issues)
        )
  }

  const { from, to, tz } = parsed.data
  try {
    timeZoneOffsetMinutes(new Date(`${from}T12:00:00Z`), tz)
  } catch {
    return failure(400, 'validation_failed', 'Unknown timezone.', {
      tz: 'Use an IANA timezone, e.g. America/New_York',
    })
  }

  const cacheKey = `${from}\n${to}\n${tz}`
  const cached = slotCache.get(cacheKey)
  if (cached && cached.expiresAt > now) return { ok: true, body: cached.body }

  try {
    const raw = await deps.getFreeSlots({
      startMs: zonedDayStartMs(from, tz),
      endMs: zonedDayStartMs(nextDate(to), tz),
      timezone: tz,
    })
    const body = mapSlots(tz, raw)
    slotCache.set(cacheKey, { expiresAt: now + SLOT_CACHE_MS, body })
    return { ok: true, body }
  } catch (error) {
    if (error instanceof GhlRequestError && error.statusCode === 0) {
      const missing =
        /not set/u.test(error.message) ||
        /Missing GoHighLevel/u.test(error.message)
      if (missing) {
        return failure(
          503,
          'upstream_unavailable',
          'Booking is not configured.'
        )
      }
    }
    return failure(
      503,
      'upstream_unavailable',
      'Available times are temporarily unavailable.'
    )
  }
}
