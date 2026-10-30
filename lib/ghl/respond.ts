import { NextResponse } from 'next/server'

import type { ErrorCode, ErrorEnvelope } from '@/lib/contracts'

export const noStore = { 'cache-control': 'no-store' }

export function errorJson(
  code: ErrorCode,
  message: string,
  status: number,
  fields?: Record<string, string>
) {
  const body: ErrorEnvelope = fields
    ? { error: { code, message, fields } }
    : { error: { code, message } }
  return NextResponse.json(body, { status, headers: noStore })
}
