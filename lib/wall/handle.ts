import { NextResponse } from 'next/server'
import type { ZodType } from 'zod'

import {
  IDEMPOTENCY_HEADER,
  WALL_MAX_BYTES,
  WALL_PAGE_SIZE,
  idempotencyKeySchema,
  wallPageSchema,
  wallPendingSchema,
  wallPostFieldsSchema,
  wallQuerySchema,
  wallRemoveInputSchema,
  wallReportInputSchema,
  type WallPage,
  type WallPending,
} from '@/lib/contracts'
import { issueFields } from '@/lib/ghl/issues'
import { errorJson, noStore } from '@/lib/ghl/respond'
import { rateLimit } from '@/lib/utils/rate-limit'

import {
  WALL_POSTS_PER_HOUR,
  WALL_RATE_WINDOW_SECONDS,
  WALL_REMOVALS_PER_HOUR,
  WALL_REPORTS_PER_HOUR,
  WALL_CACHE_SECONDS,
} from './constants'
import { readCursor, issueCursor } from './cursor'
import { WallImageError, encodeWallPhoto, sniffWallImage } from './image'
import {
  hashRemoveToken,
  newRemoveToken,
  removeTokenMatches,
  visitorHash,
} from './token'
import type { StoredPost, WallStore } from './types'

export interface WallDeps {
  store: WallStore
  verifyCaptcha: (payload: string) => Promise<boolean>
  cursorSecret: string
  clientIp: (request: Request) => string | null
}

const IMAGE_TYPE = 'Use a JPEG, PNG, WebP or HEIC photo.'
const IMAGE_SIZE = 'Choose a photo under 8 MB.'
const IMAGE_MISSING = 'Add a photo.'

/**
 * Accepts one photo. A repeated Idempotency-Key returns the first 202 before
 * the body is read, so a single-use ALTCHA payload can be retried.
 */
export async function postWall(
  request: Request,
  deps: WallDeps
): Promise<Response> {
  const key = idempotencyKeySchema.safeParse(
    request.headers.get(IDEMPOTENCY_HEADER)
  )
  if (!key.success) {
    return errorJson(
      'idempotency_key_missing',
      `Send a UUID in the ${IDEMPOTENCY_HEADER} header.`,
      400
    )
  }

  const replay = await deps.store.findReceipt(key.data)
  if (replay) return pendingJson(replay)

  const form = await readForm(request)
  if (!form.ok) {
    return errorJson('validation_failed', form.message, form.status, {
      image: form.message,
    })
  }

  const fields = wallPostFieldsSchema.safeParse({
    consentText: form.consentText,
    adult: form.adult,
    displayName: form.displayName,
    altcha: form.altcha,
  })
  if (!fields.success) {
    return errorJson(
      'validation_failed',
      'Some fields need attention.',
      400,
      issueFields(fields.error.issues)
    )
  }

  const captchaOk = await deps.verifyCaptcha(fields.data.altcha)
  if (!captchaOk) return errorJson('captcha_failed', 'Please try again.', 400)

  if (overLimit(deps.clientIp(request), 'post')) {
    return errorJson('rate_limited', 'Too many requests.', 429)
  }

  const bytes = Buffer.from(await form.image.arrayBuffer())
  if (!sniffWallImage(bytes)) return imageType()

  try {
    const encoded = await encodeWallPhoto(bytes)
    const removeToken = newRemoveToken()
    const draft = {
      idempotencyKey: key.data,
      publicId: crypto.randomUUID(),
      removeToken,
      removeTokenHash: hashRemoveToken(removeToken),
      consentText: fields.data.consentText,
      consentAt: new Date().toISOString(),
      adult: true as const,
      image: encoded.data,
      width: encoded.width,
      height: encoded.height,
    }
    const saved = await deps.store.createPost(
      fields.data.displayName === undefined
        ? draft
        : { ...draft, displayName: fields.data.displayName }
    )
    return pendingJson(saved)
  } catch (error) {
    if (error instanceof WallImageError) return imageType()
    throw error
  }
}

export async function getWall(
  request: Request,
  deps: WallDeps
): Promise<Response> {
  const parsed = wallQuerySchema.safeParse({
    cursor: new URL(request.url).searchParams.get('cursor') ?? undefined,
  })
  if (!parsed.success) return badCursor()

  const point = parsed.data.cursor
    ? readCursor(parsed.data.cursor, deps.cursorSecret)
    : null
  if (parsed.data.cursor && !point) return badCursor()

  const rows = await deps.store.listApproved(point, WALL_PAGE_SIZE + 1)
  const items = rows.slice(0, WALL_PAGE_SIZE)
  const last = items.at(-1)
  const nextCursor =
    rows.length > WALL_PAGE_SIZE && last
      ? issueCursor(
          { createdAt: last.createdAt, publicId: last.id },
          deps.cursorSecret
        )
      : null
  const body: WallPage = { items, nextCursor }
  return NextResponse.json(wallPageSchema.parse(body), {
    status: 200,
    headers: { 'cache-control': `public, max-age=${WALL_CACHE_SECONDS}` },
  })
}

export async function reportWall(
  request: Request,
  deps: WallDeps
): Promise<Response> {
  if (overLimit(deps.clientIp(request), 'report')) {
    return errorJson('rate_limited', 'Too many requests.', 429)
  }
  const parsed = await parseJson(request, wallReportInputSchema)
  if (!parsed.success) {
    return errorJson(
      'validation_failed',
      'Some fields need attention.',
      400,
      issueFields(parsed.error.issues)
    )
  }
  const result = await deps.store.report(
    parsed.data.id,
    visitorHash(deps.clientIp(request))
  )
  if (!result) return errorJson('not_found', 'No such photo.', 404)
  return new NextResponse(null, { status: 204, headers: noStore })
}

export async function removeWall(
  request: Request,
  deps: WallDeps
): Promise<Response> {
  if (overLimit(deps.clientIp(request), 'remove')) {
    return errorJson('rate_limited', 'Too many requests.', 429)
  }
  const parsed = await parseJson(request, wallRemoveInputSchema)
  if (!parsed.success) {
    return errorJson(
      'validation_failed',
      'Some fields need attention.',
      400,
      issueFields(parsed.error.issues)
    )
  }
  const photo = await deps.store.findRemovable(parsed.data.id)
  const matches = removeTokenMatches(
    parsed.data.token,
    photo?.removeTokenHash ?? null
  )
  if (!photo || photo.status === 'removed' || !matches) {
    return errorJson('not_found', 'No such photo.', 404)
  }
  await deps.store.markRemoved(photo.id)
  return new NextResponse(null, { status: 204, headers: noStore })
}

type FormRead =
  | {
      ok: true
      image: Blob
      consentText: string | undefined
      adult: string | undefined
      displayName: string | undefined
      altcha: string | undefined
    }
  | { ok: false; status: 400 | 413; message: string }

async function readForm(request: Request): Promise<FormRead> {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return { ok: false, status: 400, message: IMAGE_MISSING }
  }
  const image = form.get('image')
  if (!(image instanceof Blob) || image.size === 0) {
    return { ok: false, status: 400, message: IMAGE_MISSING }
  }
  if (image.size > WALL_MAX_BYTES) {
    return { ok: false, status: 413, message: IMAGE_SIZE }
  }
  return {
    ok: true,
    image,
    consentText: textField(form, 'consentText'),
    adult: textField(form, 'adult'),
    displayName: textField(form, 'displayName'),
    altcha: textField(form, 'altcha'),
  }
}

function textField(form: FormData, name: string): string | undefined {
  const value = form.get(name)
  if (value === null || value instanceof Blob) return undefined
  return value
}

function limitFor(kind: 'post' | 'report' | 'remove'): number {
  if (kind === 'post') return WALL_POSTS_PER_HOUR
  if (kind === 'report') return WALL_REPORTS_PER_HOUR
  return WALL_REMOVALS_PER_HOUR
}

function overLimit(
  ip: string | null,
  kind: 'post' | 'report' | 'remove'
): boolean {
  return !rateLimit(`wall-${kind}:${ip ?? 'unknown'}`, {
    limit: limitFor(kind),
    windowSeconds: WALL_RATE_WINDOW_SECONDS,
  }).success
}

function pendingJson(post: StoredPost): Response {
  const body: WallPending = {
    status: 'pending',
    id: post.id,
    removeToken: post.removeToken,
  }
  return NextResponse.json(wallPendingSchema.parse(body), {
    status: 202,
    headers: noStore,
  })
}

function imageType(): Response {
  return errorJson('validation_failed', IMAGE_TYPE, 415, { image: IMAGE_TYPE })
}

function badCursor(): Response {
  return errorJson('validation_failed', 'Unknown cursor.', 400, {
    cursor: 'Use a nextCursor from an earlier page',
  })
}

/** Bad JSON is the same failure as a body the schema rejects. */
async function parseJson<Schema extends ZodType>(
  request: Request,
  schema: Schema
) {
  try {
    return schema.safeParse(await request.json())
  } catch {
    return schema.safeParse(null)
  }
}
