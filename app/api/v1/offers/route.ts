import { NextResponse } from 'next/server'
import pino from 'pino'

import { readCachedOffers } from '@/lib/ghl-read/offers-cache'
import { errorJson, noStore } from '@/lib/ghl/respond'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const logger = pino({ level: 'info' })

export async function GET() {
  try {
    const body = await readCachedOffers()
    return NextResponse.json(body, { headers: noStore })
  } catch (error) {
    logger.error({ err: error }, 'offers failed')
    return errorJson(
      'upstream_unavailable',
      'Offers are temporarily unavailable.',
      503
    )
  }
}
