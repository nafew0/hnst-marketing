import { NextResponse } from 'next/server'
import pino from 'pino'
import { z } from 'zod'

import {
  IDEMPOTENCY_HEADER,
  type ErrorEnvelope,
  type Queued,
} from '@/lib/contracts'
import { env } from '@/lib/env'
import { acceptLead } from '@/lib/ghl/accept-lead'
import { verifyAltcha } from '@/lib/ghl/captcha'
import { findLeadRef, getPool, insertLead } from '@/lib/ghl/postgres'
import { enqueueLead } from '@/lib/ghl/queue'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const logger = pino({ level: 'info' })
const ipSchema = z.union([z.ipv4(), z.ipv6()])

const noStore = { 'cache-control': 'no-store' }

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  const candidate =
    first && first !== '' ? first : request.headers.get('x-real-ip')
  if (!candidate) return null
  const parsed = ipSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

function userAgent(request: Request): string | null {
  const agent = request.headers.get('user-agent')
  if (!agent || agent === '') return null
  return agent.slice(0, 500)
}

function errorBody(
  code: ErrorEnvelope['error']['code'],
  message: string,
  fields?: Record<string, string>
): ErrorEnvelope {
  if (fields) return { error: { code, message, fields } }
  return { error: { code, message } }
}

export async function POST(request: Request) {
  const hmacKey = env.ALTCHA_HMAC_KEY
  if (!hmacKey) {
    logger.error('ALTCHA_HMAC_KEY is not set')
    return NextResponse.json(
      errorBody('internal_error', 'Captcha is not configured.'),
      { status: 500, headers: noStore }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = undefined
  }

  try {
    const db = getPool()
    const result = await acceptLead(
      {
        idempotencyKey: request.headers.get(IDEMPOTENCY_HEADER),
        body,
        ip: clientIp(request),
        userAgent: userAgent(request),
      },
      {
        verifyCaptcha: (payload) => verifyAltcha(payload, hmacKey),
        findByKey: (key) => findLeadRef(db, key),
        insert: (lead) => insertLead(db, lead),
        enqueue: enqueueLead,
      }
    )

    if (result.ok) {
      const queued: Queued = { status: 'queued', ref: result.ref }
      logger.info({ ref: result.ref }, 'lead queued')
      return NextResponse.json(queued, { status: 202, headers: noStore })
    }

    const envelope = result.fields
      ? errorBody(result.code, result.message, result.fields)
      : errorBody(result.code, result.message)
    return NextResponse.json(envelope, {
      status: result.status,
      headers: noStore,
    })
  } catch (error) {
    logger.error({ err: error }, 'lead accept failed')
    return NextResponse.json(
      errorBody('internal_error', 'Something went wrong. Please try again.'),
      { status: 500, headers: noStore }
    )
  }
}
