import { z } from 'zod'

import { altchaSchema, isoDateTimeSchema } from './common'

/**
 * The public photo wall (phone layout, docs/phases/M1.md). A visitor posts a
 * photo taken in the HONEST frame; an editor approves it before anyone else
 * can see it. Added to v1 on 6 Nov 2026 with Nafew's public-wall decision:
 * nothing that existed before changed.
 *
 * A photo's public id is a UUID, never the database id, so ids can't be
 * counted through.
 *
 * POST /api/v1/wall   multipart/form-data: `image` + the fields of `wallPostFieldsSchema`
 *   Headers: `Idempotency-Key: <uuid>` (one per photo; reuse it on retry).
 *   202 → { status: 'pending', id, removeToken }   stored, hidden until approved
 *   202 → same body again                           a repeated key replays the first response
 *   400 → validation_failed | captcha_failed | idempotency_key_missing
 *   413 → validation_failed, fields.image           larger than WALL_MAX_BYTES
 *   415 → validation_failed, fields.image           not JPEG, PNG, WebP or HEIC, judged from the bytes
 *   429 → rate_limited
 *
 *   The back end re-encodes every photo to WebP, longest side at most
 *   WALL_MAX_EDGE px, which drops all metadata, GPS included. It stores only a
 *   hash of `removeToken`: the visitor is shown the token once, and it is
 *   never logged.
 *
 * GET /api/v1/wall?cursor=
 *   200 → { items, nextCursor }   approved photos only, newest first, WALL_PAGE_SIZE a page
 *   400 → validation_failed       a cursor this API did not issue
 *
 * POST /api/v1/wall/report   { id }
 *   204                        counted, once per visitor and photo; WALL_REPORTS_TO_HIDE
 *                              reports hide the photo until an editor decides
 *   400 → validation_failed    the body isn't { id }
 *   404 → not_found            no approved photo has that id
 *   429 → rate_limited
 *
 * POST /api/v1/wall/remove   { id, token }
 *   204                        removed at once, and the file deleted
 *   400 → validation_failed    the body isn't { id, token }
 *   404 → not_found            wrong id or token: the answer never says which
 *   429 → rate_limited
 */

export const WALL_MAX_BYTES = 8 * 1024 * 1024
export const WALL_MAX_EDGE = 1600
export const WALL_PAGE_SIZE = 30
export const WALL_REPORTS_TO_HIDE = 3
export const WALL_NAME_MAX = 40

/** What the browser may send. The server trusts the bytes, not this list. */
export const WALL_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const

export const wallPhotoIdSchema = z.uuid()

/** base64url, so it can follow the id after a `.` in the removal link. */
export const wallRemoveTokenSchema = z
  .string()
  .min(32)
  .max(128)
  .regex(/^[\w-]+$/u)

/** The text parts of the multipart body; FormData values are strings. */
export const wallPostFieldsSchema = z.object({
  /** The exact consent wording the visitor saw and ticked, kept as evidence. */
  consentText: z.string().trim().min(1).max(2000),
  /** "I'm 18 or over", ticked. An unticked box is not a valid post. */
  adult: z.literal('true', { error: 'Confirm you are 18 or over' }),
  /** Shown under the photo. Leave it out for no name. */
  displayName: z.string().trim().min(1).max(WALL_NAME_MAX).optional(),
  altcha: altchaSchema,
})
export type WallPostFields = z.infer<typeof wallPostFieldsSchema>

/** The `image` part. Its declared type helps the browser; the server checks the bytes. */
export const wallImageSchema = z
  .file()
  .min(1)
  .max(WALL_MAX_BYTES, { error: 'Choose a photo under 8 MB' })

/** A post as the front end holds it, before it becomes multipart. */
export interface WallPostInput {
  image: Blob
  consentText: string
  adult: true
  displayName?: string
  altcha: string
}

const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
} as const satisfies Record<(typeof WALL_IMAGE_TYPES)[number], string>

/**
 * The multipart body for POST /api/v1/wall. The file name carries an
 * extension: some multipart parsers (Bun's) drop the part's type without one.
 */
export function wallFormData(input: WallPostInput) {
  const body = new FormData()
  const known = WALL_IMAGE_TYPES.find((type) => type === input.image.type)
  const extension = known ? EXTENSIONS[known] : 'bin'
  body.set('image', input.image, `photo.${extension}`)
  body.set('consentText', input.consentText)
  body.set('adult', 'true')
  if (input.displayName) body.set('displayName', input.displayName)
  body.set('altcha', input.altcha)
  return body
}

export const wallPendingSchema = z.object({
  status: z.literal('pending'),
  id: wallPhotoIdSchema,
  removeToken: wallRemoveTokenSchema,
})
export type WallPending = z.infer<typeof wallPendingSchema>

export const wallPhotoSchema = z.object({
  id: wallPhotoIdSchema,
  /** Same-origin URL of the approved WebP. */
  src: z.string().startsWith('/').max(2000),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  displayName: z.string().max(WALL_NAME_MAX).nullable(),
  createdAt: isoDateTimeSchema,
})
export type WallPhoto = z.infer<typeof wallPhotoSchema>

export const wallCursorSchema = z.string().min(1).max(200)

export const wallQuerySchema = z.object({
  cursor: wallCursorSchema.optional(),
})
export type WallQuery = z.infer<typeof wallQuerySchema>

export const wallPageSchema = z.object({
  items: z.array(wallPhotoSchema).max(WALL_PAGE_SIZE),
  nextCursor: wallCursorSchema.nullable(),
})
export type WallPage = z.infer<typeof wallPageSchema>

export const wallReportInputSchema = z.object({ id: wallPhotoIdSchema })
export type WallReportInput = z.infer<typeof wallReportInputSchema>

export const wallRemoveInputSchema = z.object({
  id: wallPhotoIdSchema,
  token: wallRemoveTokenSchema,
})
export type WallRemoveInput = z.infer<typeof wallRemoveInputSchema>
