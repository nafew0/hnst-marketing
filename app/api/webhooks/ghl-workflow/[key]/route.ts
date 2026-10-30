import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import pino from 'pino'

import { env } from '@/lib/env'
import { OFFERS_CACHE_TAG } from '@/lib/ghl/constants'
import { getPool } from '@/lib/ghl/postgres'
import { errorJson, noStore } from '@/lib/ghl/respond'
import { deleteReceipt, insertReceipt } from '@/lib/ghl/webhook-store'
import { acceptWorkflow } from '@/lib/ghl/workflow'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const logger = pino({ level: 'info' })

interface WorkflowContext {
  params: Promise<{ key: string }>
}

export async function POST(request: Request, context: WorkflowContext) {
  const secret = env.GHL_WORKFLOW_SECRET
  if (!secret) {
    logger.error('GHL_WORKFLOW_SECRET is not set')
    return errorJson('internal_error', 'Webhook is not configured.', 500)
  }

  const { key } = await context.params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = undefined
  }

  try {
    const db = getPool()
    const result = await acceptWorkflow(
      { key, secret, body },
      {
        insertReceipt: (id) => insertReceipt(db, id),
        deleteReceipt: (id) => deleteReceipt(db, id),
        revalidate: () => {
          revalidateTag(OFFERS_CACHE_TAG, { expire: 0 })
        },
      }
    )
    if (!result.ok) {
      return result.fields
        ? errorJson(result.code, result.message, result.status, result.fields)
        : errorJson(result.code, result.message, result.status)
    }
    logger.info({ duplicate: result.duplicate }, 'workflow webhook')
    return NextResponse.json({ ok: true }, { status: 200, headers: noStore })
  } catch (error) {
    logger.error({ err: error }, 'workflow webhook failed')
    return errorJson(
      'internal_error',
      'Something went wrong. Please try again.',
      500
    )
  }
}
