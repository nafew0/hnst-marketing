import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'

import { env } from '@/lib/env'
import config from '@/payload.config'
function unavailable() {
  return Response.json({ error: 'CMS unavailable' }, { status: 503 })
}
const configured = Boolean(env.PAYLOAD_SECRET && env.DATABASE_URL)
export const GET = configured ? REST_GET(config) : unavailable
export const POST = configured ? REST_POST(config) : unavailable
export const DELETE = configured ? REST_DELETE(config) : unavailable
export const PATCH = configured ? REST_PATCH(config) : unavailable
export const PUT = configured ? REST_PUT(config) : unavailable
export const OPTIONS = configured ? REST_OPTIONS(config) : unavailable
