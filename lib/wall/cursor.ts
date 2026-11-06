import { createHmac, timingSafeEqual } from 'node:crypto'

import { isoDateTimeSchema, wallPhotoIdSchema } from '@/lib/contracts'

export interface WallCursorPoint {
  createdAt: string
  publicId: string
}

/**
 * Opaque page token. The signature is what makes a cursor "one this API
 * issued": a made-up string fails closed with 400.
 */
export function issueCursor(point: WallCursorPoint, secret: string): string {
  const body = Buffer.from(
    `${point.createdAt}\n${point.publicId}`,
    'utf8'
  ).toString('base64url')
  const signature = createHmac('sha256', secret)
    .update(body)
    .digest('base64url')
  return `${body}.${signature}`
}

export function readCursor(
  cursor: string,
  secret: string
): WallCursorPoint | null {
  const dot = cursor.indexOf('.')
  if (dot <= 0 || dot !== cursor.lastIndexOf('.')) return null
  const body = cursor.slice(0, dot)
  const signature = cursor.slice(dot + 1)
  const expected = createHmac('sha256', secret).update(body).digest('base64url')
  const given = Buffer.from(signature)
  const check = Buffer.from(expected)
  if (given.length !== check.length || !timingSafeEqual(given, check))
    return null
  let text: string
  try {
    text = Buffer.from(body, 'base64url').toString('utf8')
  } catch {
    return null
  }
  const newline = text.indexOf('\n')
  if (newline <= 0) return null
  const createdAt = text.slice(0, newline)
  const publicId = text.slice(newline + 1)
  if (!isoDateTimeSchema.safeParse(createdAt).success) return null
  if (!wallPhotoIdSchema.safeParse(publicId).success) return null
  return { createdAt, publicId }
}
