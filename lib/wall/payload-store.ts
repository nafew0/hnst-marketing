import { z } from 'zod'

import {
  WALL_REPORTS_TO_HIDE,
  wallPhotoIdSchema,
  wallRemoveTokenSchema,
} from '@/lib/contracts'

import { WALL_FILE_PREFIX } from './constants'
import type { WallCursorPoint } from './cursor'
import { unlinkWallFile } from './directory'
import { withWallLock } from './lock'
import type {
  ApprovedPhoto,
  NewWallPhoto,
  RemovablePhoto,
  StoredPost,
  WallDb,
  WallQuery,
  WallStatus,
  WallStore,
} from './types'

const SELECT_RECEIPT = `SELECT public_id, remove_token
  FROM integration.wall_posts
  WHERE idempotency_key = $1`

const INSERT_RECEIPT = `INSERT INTO integration.wall_posts
  (idempotency_key, public_id, remove_token)
  VALUES ($1, $2, $3)`

const INSERT_REPORT = `INSERT INTO integration.wall_reports (public_id, visitor_hash)
  VALUES ($1, $2)
  ON CONFLICT DO NOTHING
  RETURNING public_id`

const COUNT_REPORTS = `SELECT count(*)::int AS count
  FROM integration.wall_reports
  WHERE public_id = $1`

const DELETE_REPORTS = `DELETE FROM integration.wall_reports WHERE public_id = $1`

const DELETE_RECEIPTS = `DELETE FROM integration.wall_posts
  WHERE created_at < $1
  RETURNING idempotency_key`

const receiptSchema = z.object({
  public_id: wallPhotoIdSchema,
  remove_token: wallRemoveTokenSchema,
})

const countSchema = z.object({
  count: z.union([z.number(), z.string()]),
})

const wallRowSchema = z.object({
  id: z.union([z.number().int(), z.string().regex(/^\d+$/u)]),
  publicId: wallPhotoIdSchema,
  status: z.enum(['pending', 'approved', 'rejected', 'removed']),
  displayName: z.string().nullable().optional(),
  removeTokenHash: z.string().nullable().optional(),
  reports: z.union([z.number(), z.string()]).nullable().optional(),
  createdAt: z.string(),
  url: z.string().nullable().optional(),
  width: z.union([z.number(), z.string()]).nullable().optional(),
  height: z.union([z.number(), z.string()]).nullable().optional(),
  filename: z.string().nullable().optional(),
  sizes: z
    .object({
      thumbnail: z
        .object({ filename: z.string().nullable().optional() })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
})

interface FieldEquals {
  equals: string
}

interface FieldBefore {
  less_than: string
}

export type WallWhere =
  | { publicId: FieldEquals }
  | { status: FieldEquals }
  | {
      and: readonly [{ publicId: FieldEquals }, { status: FieldEquals }]
    }
  | {
      and: readonly [{ status: FieldEquals }, { statusChangedAt: FieldBefore }]
    }
  | {
      and: readonly [
        { status: FieldEquals },
        {
          or: readonly [
            { createdAt: FieldBefore },
            {
              and: readonly [
                { createdAt: FieldEquals },
                { publicId: FieldBefore },
              ]
            },
          ]
        },
      ]
    }
  | {
      or: readonly [
        { status: FieldEquals },
        { status: FieldEquals },
        { status: FieldEquals },
        { status: FieldEquals },
      ]
    }

export interface WallPhotoRow {
  id: number | string
  publicId: string
  status: WallStatus
  displayName?: string | null
  removeTokenHash?: string | null
  reports?: number | string | null
  createdAt: string
  url?: string | null
  width?: number | string | null
  height?: number | string | null
  filename?: string | null
  sizes?: {
    thumbnail?: { filename?: string | null } | null
  } | null
}

interface WallCreateArgs {
  collection: 'wallPhotos'
  data: {
    publicId: string
    status: 'pending'
    consentText: string
    consentAt: string
    adult: true
    removeTokenHash: string
    reports: 0
    displayName?: string
  }
  file: {
    data: Buffer
    mimetype: 'image/webp'
    name: string
    size: number
  }
  overrideAccess: true
  context: { skipRevalidation: true }
}

export interface WallFindArgs {
  collection: 'wallPhotos'
  where: WallWhere
  limit: number
  depth: 0
  overrideAccess: boolean
  sort?: '-createdAt'
  page?: number
}

interface WallUpdateArgs {
  collection: 'wallPhotos'
  id: number | string
  data: { reports?: number; status?: 'pending' | 'removed' }
  overrideAccess: true
}

interface WallDeleteArgs {
  collection: 'wallPhotos'
  id: number | string
  overrideAccess: true
  context: { skipRevalidation: true }
}

export interface WallCms {
  create(args: WallCreateArgs): Promise<{ id: number | string }>
  find(args: WallFindArgs): Promise<{
    docs: WallPhotoRow[]
    hasNextPage?: boolean
  }>
  update(args: WallUpdateArgs): Promise<{ id: number | string }>
  delete(args: WallDeleteArgs): Promise<void>
}

interface ParsedRow {
  id: number | string
  publicId: string
  status: WallStatus
  displayName: string | null
  removeTokenHash: string | null
  reports: number
  createdAt: string
  url: string | null
  width: number | string | null
  height: number | string | null
  filename: string | null
  thumbnailFilename: string | null
}

const EVERY_STATUS: WallWhere = {
  or: [
    { status: { equals: 'pending' } },
    { status: { equals: 'approved' } },
    { status: { equals: 'rejected' } },
    { status: { equals: 'removed' } },
  ],
}

export function createPayloadWallStore(
  db: WallDb,
  load: () => Promise<WallCms>,
  directory: string
): WallStore {
  return {
    findReceipt: (key) => findReceipt(db, key),
    createPost: (photo) => createPost(db, load, photo),
    listApproved: (before, limit) => listApproved(load, before, limit),
    findRemovable: (id) => findRemovable(load, id),
    markRemoved: (id) => markRemoved(db, load, directory, id),
    report: (id, visitorHash) => report(db, load, id, visitorHash),
    deleteRejectedBefore: (iso) =>
      deleteRejectedBefore(db, load, directory, iso),
    deleteReceiptsBefore: (iso) => deleteReceiptsBefore(db, iso),
    listFilenames: () => listFilenames(load),
  }
}

async function findReceipt(
  db: WallQuery,
  key: string
): Promise<StoredPost | null> {
  const result = await db.query(SELECT_RECEIPT, [key])
  const row = result.rows[0]
  if (!row) return null
  const parsed = receiptSchema.safeParse(row)
  if (!parsed.success) throw new Error('Wall receipt row is unreadable')
  return { id: parsed.data.public_id, removeToken: parsed.data.remove_token }
}

async function createPost(
  db: WallDb,
  load: () => Promise<WallCms>,
  photo: NewWallPhoto
): Promise<StoredPost> {
  return withWallLock(db, photo.idempotencyKey, async (locked) => {
    const existing = await findReceipt(locked, photo.idempotencyKey)
    if (existing) return existing
    const cms = await load()
    const data: WallCreateArgs['data'] = {
      publicId: photo.publicId,
      status: 'pending',
      consentText: photo.consentText,
      consentAt: photo.consentAt,
      adult: true,
      removeTokenHash: photo.removeTokenHash,
      reports: 0,
    }
    if (photo.displayName !== undefined) data.displayName = photo.displayName
    const created = await cms.create({
      collection: 'wallPhotos',
      overrideAccess: true,
      context: { skipRevalidation: true },
      file: {
        data: photo.image,
        mimetype: 'image/webp',
        name: `${photo.publicId}.webp`,
        size: photo.image.length,
      },
      data,
    })
    try {
      await locked.query(INSERT_RECEIPT, [
        photo.idempotencyKey,
        photo.publicId,
        photo.removeToken,
      ])
    } catch (error) {
      await cms
        .delete({
          collection: 'wallPhotos',
          id: created.id,
          overrideAccess: true,
          context: { skipRevalidation: true },
        })
        .catch(() => undefined)
      throw error
    }
    return { id: photo.publicId, removeToken: photo.removeToken }
  })
}

async function listApproved(
  load: () => Promise<WallCms>,
  before: WallCursorPoint | null,
  limit: number
): Promise<ApprovedPhoto[]> {
  const cms = await load()
  const result = await cms.find({
    collection: 'wallPhotos',
    where: approvedWhere(before),
    sort: '-createdAt',
    limit,
    depth: 0,
    overrideAccess: false,
  })
  const photos: ApprovedPhoto[] = []
  for (const doc of result.docs) {
    const row = readRow(doc)
    if (row.status !== 'approved') continue
    photos.push(toApproved(row))
  }
  photos.sort(newestFirst)
  return photos.slice(0, limit)
}

async function findRemovable(
  load: () => Promise<WallCms>,
  id: string
): Promise<RemovablePhoto | null> {
  const row = await findByPublicId(load, id)
  if (!row) return null
  if (!row.removeTokenHash)
    throw new Error('Wall photo is missing its removal hash')
  return {
    id: row.publicId,
    status: row.status,
    removeTokenHash: row.removeTokenHash,
    filename: row.filename,
    thumbnailFilename: row.thumbnailFilename,
  }
}

async function markRemoved(
  db: WallDb,
  load: () => Promise<WallCms>,
  directory: string,
  id: string
): Promise<void> {
  const row = await findByPublicId(load, id)
  if (!row || row.status === 'removed') return
  const cms = await load()
  await cms.update({
    collection: 'wallPhotos',
    id: row.id,
    overrideAccess: true,
    data: { status: 'removed' },
  })
  await unlinkWallFile(directory, row.filename)
  await unlinkWallFile(directory, row.thumbnailFilename)
  await db.query(DELETE_REPORTS, [row.publicId])
}

async function report(
  db: WallDb,
  load: () => Promise<WallCms>,
  id: string,
  visitorHash: string
): Promise<{ count: number } | null> {
  return withWallLock(db, `report:${id}`, async (locked) => {
    const row = await findApproved(load, id)
    if (!row) return null
    const inserted = await locked.query(INSERT_REPORT, [id, visitorHash])
    if (inserted.rows.length === 0) return { count: row.reports }
    const counted = await locked.query<{ count: number | string }>(
      COUNT_REPORTS,
      [id]
    )
    const count = readCount(counted.rows[0])
    const cms = await load()
    await cms.update({
      collection: 'wallPhotos',
      id: row.id,
      overrideAccess: true,
      data:
        count >= WALL_REPORTS_TO_HIDE
          ? { reports: count, status: 'pending' }
          : { reports: count },
    })
    return { count }
  })
}

async function deleteReceiptsBefore(db: WallDb, iso: string): Promise<number> {
  const result = await db.query<{ idempotency_key: string }>(DELETE_RECEIPTS, [
    iso,
  ])
  return result.rows.length
}

async function deleteRejectedBefore(
  db: WallDb,
  load: () => Promise<WallCms>,
  directory: string,
  iso: string
): Promise<number> {
  let deleted = 0
  let previousId = ''
  for (;;) {
    const cms = await load()
    const result = await cms.find({
      collection: 'wallPhotos',
      where: {
        and: [
          { status: { equals: 'rejected' } },
          { statusChangedAt: { less_than: iso } },
        ],
      },
      limit: 100,
      page: 1,
      depth: 0,
      overrideAccess: true,
    })
    const first = result.docs[0]
    if (!first) break
    const marker = String(first.id)
    if (marker === previousId) throw new Error('Wall purge made no progress')
    previousId = marker
    for (const doc of result.docs) {
      const row = readRow(doc)
      await cms.delete({
        collection: 'wallPhotos',
        id: row.id,
        overrideAccess: true,
        context: { skipRevalidation: true },
      })
      await unlinkWallFile(directory, row.filename)
      await unlinkWallFile(directory, row.thumbnailFilename)
      await db.query(DELETE_REPORTS, [row.publicId])
      deleted += 1
    }
  }
  return deleted
}

async function listFilenames(load: () => Promise<WallCms>): Promise<string[]> {
  const cms = await load()
  const names: string[] = []
  let page = 1
  for (;;) {
    const result = await cms.find({
      collection: 'wallPhotos',
      where: EVERY_STATUS,
      limit: 100,
      page,
      depth: 0,
      overrideAccess: true,
    })
    for (const doc of result.docs) {
      const row = readRow(doc)
      if (row.filename) names.push(row.filename)
      if (row.thumbnailFilename) names.push(row.thumbnailFilename)
    }
    if (!result.hasNextPage) break
    page += 1
  }
  return names
}

async function findByPublicId(
  load: () => Promise<WallCms>,
  id: string
): Promise<ParsedRow | null> {
  const cms = await load()
  const result = await cms.find({
    collection: 'wallPhotos',
    where: { publicId: { equals: id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const doc = result.docs[0]
  return doc ? readRow(doc) : null
}

async function findApproved(
  load: () => Promise<WallCms>,
  id: string
): Promise<ParsedRow | null> {
  const cms = await load()
  const result = await cms.find({
    collection: 'wallPhotos',
    where: {
      and: [{ publicId: { equals: id } }, { status: { equals: 'approved' } }],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const doc = result.docs[0]
  if (!doc) return null
  const row = readRow(doc)
  return row.status === 'approved' ? row : null
}

function approvedWhere(before: WallCursorPoint | null): WallWhere {
  if (!before) return { status: { equals: 'approved' } }
  return {
    and: [
      { status: { equals: 'approved' } },
      {
        or: [
          { createdAt: { less_than: before.createdAt } },
          {
            and: [
              { createdAt: { equals: before.createdAt } },
              { publicId: { less_than: before.publicId } },
            ],
          },
        ],
      },
    ],
  }
}

function readRow(row: WallPhotoRow): ParsedRow {
  const parsed = wallRowSchema.safeParse(row)
  if (!parsed.success) throw new Error('Wall photo row is unreadable')
  const data = parsed.data
  return {
    id: data.id,
    publicId: data.publicId,
    status: data.status,
    displayName: data.displayName ?? null,
    removeTokenHash: data.removeTokenHash ?? null,
    reports: wholeCount(data.reports),
    createdAt: data.createdAt,
    url: data.url ?? null,
    width: data.width ?? null,
    height: data.height ?? null,
    filename: data.filename ?? null,
    thumbnailFilename: data.sizes?.thumbnail?.filename ?? null,
  }
}

function toApproved(row: ParsedRow): ApprovedPhoto {
  const src = filePath(row.url)
  const width = positiveInt(row.width)
  const height = positiveInt(row.height)
  const createdAt = iso(row.createdAt)
  if (!src || width === null || height === null || !createdAt) {
    throw new Error('Approved wall photo has no public file')
  }
  const name = row.displayName?.trim() ?? ''
  return {
    id: row.publicId,
    src,
    width,
    height,
    displayName: name === '' ? null : name,
    createdAt,
  }
}

function filePath(url: string | null): string | null {
  if (!url) return null
  const pathname =
    url.startsWith('/') && !url.startsWith('//') ? url : httpPath(url)
  if (!pathname?.startsWith(WALL_FILE_PREFIX)) return null
  return pathname
}

function httpPath(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.pathname
  } catch {
    return null
  }
}

const positiveSchema = z.union([
  z.number().int().positive(),
  z
    .string()
    .regex(/^[1-9]\d*$/u)
    .transform((value) => Number(value)),
])

const wholeSchema = z.union([
  z.number().int().nonnegative(),
  z
    .string()
    .regex(/^\d+$/u)
    .transform((value) => Number(value)),
])

function positiveInt(value: number | string | null): number | null {
  if (value === null) return null
  const parsed = positiveSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

function iso(value: string): string | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function wholeCount(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  const parsed = wholeSchema.safeParse(value)
  return parsed.success ? parsed.data : 0
}

function readCount(row: { count: number | string } | undefined): number {
  const parsed = countSchema.safeParse(row)
  if (!parsed.success) throw new Error('Wall report count is missing')
  const count = Number(parsed.data.count)
  if (!Number.isInteger(count) || count < 0) {
    throw new Error('Wall report count is missing')
  }
  return count
}

function newestFirst(a: ApprovedPhoto, b: ApprovedPhoto): number {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1
  if (a.id === b.id) return 0
  return a.id < b.id ? 1 : -1
}
