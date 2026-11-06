import pino from 'pino'

import { env } from '@/lib/env'
import { errorJson } from '@/lib/ghl/respond'
import { failWall, wallDeps } from '@/lib/wall/backend'
import { postWall, getWall } from '@/lib/wall/handle'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const logger = pino({ level: 'info' })

export async function POST(request: Request): Promise<Response> {
  if (!env.ALTCHA_HMAC_KEY) {
    logger.error('ALTCHA_HMAC_KEY is not set')
    return errorJson('internal_error', 'Captcha is not configured.', 500)
  }
  try {
    return await postWall(request, wallDeps())
  } catch (error) {
    return failWall(
      error instanceof Error ? error : new Error('Wall request failed')
    )
  }
}

export async function GET(request: Request): Promise<Response> {
  try {
    return await getWall(request, wallDeps())
  } catch (error) {
    return failWall(
      error instanceof Error ? error : new Error('Wall request failed')
    )
  }
}
