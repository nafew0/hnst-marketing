import { NextResponse } from 'next/server'
import pino from 'pino'

import { IDEMPOTENCY_HEADER } from '@/lib/contracts'
import { env } from '@/lib/env'
import { acceptBooking } from '@/lib/ghl/accept-booking'
import {
  claimBooking,
  findBooking,
  removeBooking,
  saveBooking,
  withBookingLock,
} from '@/lib/ghl/booking-store'
import { verifyAltcha } from '@/lib/ghl/captcha'
import { ghlFromEnv } from '@/lib/ghl/from-env'
import { getPool } from '@/lib/ghl/postgres'
import { enqueueBooking } from '@/lib/ghl/queue'
import { clientIp, userAgent } from '@/lib/ghl/request-meta'
import { errorJson, noStore } from '@/lib/ghl/respond'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const logger = pino({ level: 'info' })

export async function POST(request: Request) {
  const hmacKey = env.ALTCHA_HMAC_KEY
  if (!hmacKey) {
    logger.error('ALTCHA_HMAC_KEY is not set')
    return errorJson('internal_error', 'Captcha is not configured.', 500)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = undefined
  }

  const header = request.headers.get(IDEMPOTENCY_HEADER)
  try {
    const db = getPool()
    const result = await withBookingLock(db, header ?? '', () =>
      acceptBooking(
        {
          idempotencyKey: header,
          body,
          ip: clientIp(request),
          userAgent: userAgent(request),
        },
        {
          verifyCaptcha: (payload) => verifyAltcha(payload, hmacKey),
          store: {
            find: (key) => findBooking(db, key),
            claim: (input) => claimBooking(db, input),
            save: (row) => saveBooking(db, row),
            remove: (ref) => removeBooking(db, ref),
          },
          ghl: ghlFromEnv(),
          enqueue: enqueueBooking,
          now: () => new Date().toISOString(),
        }
      )
    )
    if (result.ok) {
      return NextResponse.json(result.body, {
        status: result.status,
        headers: noStore,
      })
    }
    return result.fields
      ? errorJson(result.code, result.message, result.status, result.fields)
      : errorJson(result.code, result.message, result.status)
  } catch (error) {
    logger.error({ err: error }, 'booking failed')
    return errorJson(
      'internal_error',
      'Something went wrong. Please try again.',
      500
    )
  }
}
