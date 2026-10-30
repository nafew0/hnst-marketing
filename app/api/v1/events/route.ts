import { NextResponse } from 'next/server'
import pino from 'pino'

import { eventsInputSchema } from '@/lib/contracts'
import { insertEvents } from '@/lib/ghl/event-store'
import { issueFields } from '@/lib/ghl/issues'
import { getPool } from '@/lib/ghl/postgres'
import { errorJson, noStore } from '@/lib/ghl/respond'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const logger = pino({ level: 'info' })

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = undefined
  }

  const parsed = eventsInputSchema.safeParse(body)
  if (!parsed.success) {
    return errorJson(
      'validation_failed',
      'Some fields need attention.',
      400,
      issueFields(parsed.error.issues)
    )
  }

  try {
    await insertEvents(getPool(), parsed.data)
    return new NextResponse(null, { status: 204, headers: noStore })
  } catch (error) {
    logger.error({ err: error }, 'events failed')
    return errorJson(
      'internal_error',
      'Something went wrong. Please try again.',
      500
    )
  }
}
