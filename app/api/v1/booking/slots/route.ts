import { NextResponse } from 'next/server'
import pino from 'pino'

import { readFreeSlots } from '@/lib/ghl-read/slots'
import { ghlFromEnv } from '@/lib/ghl/from-env'
import { errorJson, noStore } from '@/lib/ghl/respond'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const logger = pino({ level: 'info' })

export async function GET(request: Request) {
  const url = new URL(request.url)
  try {
    const ghl = ghlFromEnv()
    const result = await readFreeSlots(
      {
        from: url.searchParams.get('from') ?? '',
        to: url.searchParams.get('to') ?? '',
        tz: url.searchParams.get('tz') ?? '',
      },
      { getFreeSlots: (query) => ghl.getFreeSlots(query) }
    )
    if (!result.ok) {
      return result.fields
        ? errorJson(result.code, result.message, result.status, result.fields)
        : errorJson(result.code, result.message, result.status)
    }
    return NextResponse.json(result.body, { headers: noStore })
  } catch (error) {
    logger.error({ err: error }, 'slots failed')
    return errorJson(
      'internal_error',
      'Something went wrong. Please try again.',
      500
    )
  }
}
