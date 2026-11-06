import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { getResponse, http } from 'msw'
import sharp from 'sharp'

import {
  apiRoutes,
  errorEnvelopeSchema,
  IDEMPOTENCY_HEADER,
  WALL_MAX_BYTES,
  WALL_PAGE_SIZE,
  wallFormData,
  wallPageSchema,
  wallPendingSchema,
  type WallPostInput,
} from '@/lib/contracts'
import { getClientIP } from '@/lib/utils/rate-limit'

import { getWall, postWall, removeWall, reportWall } from './handle'
import { MemoryWallStore } from './memory-store'
import {
  createPayloadWallStore,
  type WallCms,
  type WallFindArgs,
  type WallPhotoRow,
} from './payload-store'
import { hashRemoveToken } from './token'
import type { SqlValue, WallDb } from './types'

const ORIGIN = 'http://localhost'
const CONSENT = 'Show my photo on the HONEST wall. I can ask for it to go.'

let directory: string
let store: MemoryWallStore
let ip = '10.1.0.1'
let octet = 1

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'wall-api-'))
  store = new MemoryWallStore(directory)
  octet += 1
  ip = `10.9.${Math.floor(octet / 250)}.${(octet % 250) + 1}`
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

function deps() {
  return {
    store,
    verifyCaptcha: async (payload: string) => payload !== 'fail',
    cursorSecret: 'test-cursor-secret-at-least-32-characters',
    clientIp: getClientIP,
  }
}

function handlers() {
  const wired = deps()
  return [
    http.post(apiRoutes.wall, ({ request }) => postWall(request, wired)),
    http.get(apiRoutes.wall, ({ request }) => getWall(request, wired)),
    http.post(apiRoutes.wallReport, ({ request }) =>
      reportWall(request, wired)
    ),
    http.post(apiRoutes.wallRemove, ({ request }) =>
      removeWall(request, wired)
    ),
  ]
}

async function fetchWall(url: string, init?: RequestInit) {
  const response = await getResponse(handlers(), new Request(url, init), {
    baseUrl: ORIGIN,
  })
  if (!response) throw new Error(`No handler for ${url}`)
  return response
}

const sample = (image: Blob): WallPostInput => ({
  image,
  consentText: CONSENT,
  adult: true,
  displayName: 'Avery',
  altcha: 'ok',
})

async function postPhoto(
  input?: WallPostInput | FormData,
  key: string | null = crypto.randomUUID(),
  address = ip
) {
  const body = input ?? sample(await jpeg())
  const headers = new Headers({ 'x-forwarded-for': address })
  if (key) headers.set(IDEMPOTENCY_HEADER, key)
  return fetchWall(`${ORIGIN}${apiRoutes.wall}`, {
    method: 'POST',
    headers,
    body: body instanceof FormData ? body : wallFormData(body),
  })
}

function postJson(
  pathName: string,
  body: { id?: string; token?: string },
  address = ip
) {
  return fetchWall(`${ORIGIN}${pathName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': address,
    },
    body: JSON.stringify(body),
  })
}

async function errorOf(response: Response) {
  return errorEnvelopeSchema.parse(await response.json()).error
}

async function jpeg(): Promise<Blob> {
  const bytes = await sharp({
    create: { width: 12, height: 8, channels: 3, background: 'red' },
  })
    .jpeg()
    .toBuffer()
  return new Blob([bytes], { type: 'image/jpeg' })
}

describe('POST /api/v1/wall', () => {
  it('stores one pending photo and replays the token', async () => {
    const key = crypto.randomUUID()
    const first = await postPhoto(sample(await jpeg()), key)
    const second = await fetchWall(`${ORIGIN}${apiRoutes.wall}`, {
      method: 'POST',
      headers: { [IDEMPOTENCY_HEADER]: key, 'x-forwarded-for': ip },
    })
    expect(first.status).toBe(202)
    expect(second.status).toBe(202)
    expect(first.headers.get('cache-control')).toBe('no-store')
    const a = wallPendingSchema.parse(await first.json())
    const b = wallPendingSchema.parse(await second.json())
    expect(b).toEqual(a)
    expect(store.receiptCount()).toBe(1)
    expect(store.statusOf(a.id)).toBe('pending')
    expect(store.consentOf(a.id)).toBe(CONSENT)
    expect(Object.keys(a).sort()).toEqual(['id', 'removeToken', 'status'])
  })

  it('answers 400, 413, 415 and 429', async () => {
    const missing = await postPhoto(sample(await jpeg()), null)
    expect(missing.status).toBe(400)
    expect((await errorOf(missing)).code).toBe('idempotency_key_missing')

    const empty = await postPhoto(sample(new Blob([], { type: 'image/jpeg' })))
    expect(empty.status).toBe(400)
    expect((await errorOf(empty)).fields?.image).toBe('Add a photo.')

    const form = wallFormData(sample(await jpeg()))
    form.delete('adult')
    form.set('consentText', '  ')
    const fields = await postPhoto(form)
    const fieldError = await errorOf(fields)
    expect(fields.status).toBe(400)
    expect(fieldError.fields?.adult).toBeDefined()
    expect(fieldError.fields?.consentText).toBeDefined()

    const large = new Uint8Array(WALL_MAX_BYTES + 1)
    const tooBig = await postPhoto(
      sample(new Blob([large], { type: 'image/jpeg' }))
    )
    expect(tooBig.status).toBe(413)
    expect((await errorOf(tooBig)).fields?.image).toBeDefined()

    const gif = await postPhoto(
      sample(new Blob([Buffer.from('GIF89a-bytes')], { type: 'image/jpeg' }))
    )
    expect(gif.status).toBe(415)
    expect((await errorOf(gif)).code).toBe('validation_failed')

    const captcha = await postPhoto({
      ...sample(await jpeg()),
      altcha: 'fail',
    })
    expect((await errorOf(captcha)).code).toBe('captcha_failed')

    const limitedIp = '10.7.4.4'
    for (let count = 0; count < 3; count += 1) {
      await postPhoto(sample(await jpeg()), crypto.randomUUID(), limitedIp)
    }
    const limited = await postPhoto(
      sample(await jpeg()),
      crypto.randomUUID(),
      limitedIp
    )
    expect(limited.status).toBe(429)
    expect(store.receiptCount()).toBe(3)
  })

  it('stores a GPS photo with no metadata, outside public/', async () => {
    const shot = await sharp({
      create: {
        width: 40,
        height: 10,
        channels: 3,
        background: { r: 180, g: 20, b: 20 },
      },
    })
      .jpeg()
      .withExif({
        IFD0: { ImageDescription: 'visitor-secret' },
        IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '41/1 24/1 12/1' },
      })
      .withMetadata({ orientation: 6 })
      .toBuffer()
    const response = await postPhoto(
      sample(new Blob([shot], { type: 'text/plain' }))
    )
    const pending = wallPendingSchema.parse(await response.json())
    const storedPath = store.filePath(pending.id)
    if (!storedPath) throw new Error('The photo was not stored')
    expect(storedPath.startsWith(directory)).toBe(true)
    expect(storedPath.includes(`${path.sep}public${path.sep}`)).toBe(false)
    const file = await readFile(storedPath)
    const meta = await sharp(file).metadata()
    expect(meta.exif).toBeUndefined()
    expect(meta.orientation).toBeUndefined()
    expect(file.includes(Buffer.from('visitor-secret'))).toBe(false)
    expect(meta.width).toBe(10)
    expect(meta.height).toBe(40)

    const page = wallPageSchema.parse(
      await (await fetchWall(`${ORIGIN}${apiRoutes.wall}`)).json()
    )
    expect(page.items.some((item) => item.id === pending.id)).toBe(false)
  })
})

describe('GET /api/v1/wall', () => {
  it('pages approved photos, newest first', async () => {
    const ids: string[] = []
    for (let index = 0; index < WALL_PAGE_SIZE + 1; index += 1) {
      const id = crypto.randomUUID()
      ids.push(id)
      store.addApproved({
        id,
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
        displayName: index === WALL_PAGE_SIZE ? 'Newest' : null,
      })
    }
    const first = wallPageSchema.parse(
      await (await fetchWall(`${ORIGIN}${apiRoutes.wall}`)).json()
    )
    expect(first.items).toHaveLength(WALL_PAGE_SIZE)
    expect(first.items[0]?.displayName).toBe('Newest')
    expect(first.items[0]?.id).toBe(ids[WALL_PAGE_SIZE])
    expect(first.nextCursor).not.toBeNull()
    expect(
      (await fetchWall(`${ORIGIN}${apiRoutes.wall}`)).headers.get(
        'cache-control'
      )
    ).toContain('max-age=30')

    const second = wallPageSchema.parse(
      await (
        await fetchWall(
          `${ORIGIN}${apiRoutes.wall}?cursor=${first.nextCursor ?? ''}`
        )
      ).json()
    )
    expect(second.items).toHaveLength(1)
    expect(second.items[0]?.id).toBe(ids[0])
    expect(second.nextCursor).toBeNull()

    const forged = await fetchWall(`${ORIGIN}${apiRoutes.wall}?cursor=nope`)
    expect(forged.status).toBe(400)
    expect((await errorOf(forged)).fields?.cursor).toBeDefined()
  })
})

describe('POST /api/v1/wall/report', () => {
  it('counts one report per address and hides the photo at three', async () => {
    const { id } = wallPendingSchema.parse(await (await postPhoto()).json())
    store.approve(id)
    const again = await postJson(apiRoutes.wallReport, { id })
    expect(again.status).toBe(204)
    expect(store.reportsOf(id)).toBe(1)
    const repeat = await postJson(apiRoutes.wallReport, { id })
    expect(repeat.status).toBe(204)
    expect(store.reportsOf(id)).toBe(1)

    await postJson(apiRoutes.wallReport, { id }, '10.8.0.2')
    await postJson(apiRoutes.wallReport, { id }, '10.8.0.3')
    expect(store.statusOf(id)).toBe('pending')
    const page = wallPageSchema.parse(
      await (await fetchWall(`${ORIGIN}${apiRoutes.wall}`)).json()
    )
    expect(page.items.some((item) => item.id === id)).toBe(false)
    expect(
      (await postJson(apiRoutes.wallReport, { id }, '10.8.0.4')).status
    ).toBe(404)
  })

  it('answers 400, 404 and 429', async () => {
    expect((await postJson(apiRoutes.wallReport, {})).status).toBe(400)
    expect(
      (await postJson(apiRoutes.wallReport, { id: crypto.randomUUID() })).status
    ).toBe(404)
    const { id } = wallPendingSchema.parse(await (await postPhoto()).json())
    store.approve(id)
    const burst = '10.4.4.4'
    for (let count = 0; count < 30; count += 1) {
      expect((await postJson(apiRoutes.wallReport, { id }, burst)).status).toBe(
        204
      )
    }
    expect((await postJson(apiRoutes.wallReport, { id }, burst)).status).toBe(
      429
    )
  })
})

describe('POST /api/v1/wall/remove', () => {
  it('removes a photo once, only with its token, and deletes the file', async () => {
    const { id, removeToken } = wallPendingSchema.parse(
      await (await postPhoto()).json()
    )
    const storedPath = store.filePath(id)
    if (!storedPath) throw new Error('The photo was not stored')
    const wrong = await postJson(apiRoutes.wallRemove, {
      id,
      token: removeToken.replace(/^./u, (char) => (char === 'A' ? 'B' : 'A')),
    })
    expect(wrong.status).toBe(404)
    expect(store.statusOf(id)).toBe('pending')

    const removed = await postJson(apiRoutes.wallRemove, {
      id,
      token: removeToken,
    })
    expect(removed.status).toBe(204)
    expect(store.statusOf(id)).toBe('removed')
    await expect(readFile(storedPath)).rejects.toThrow()
    const second = await postJson(apiRoutes.wallRemove, {
      id,
      token: removeToken,
    })
    expect(second.status).toBe(404)
    expect((await errorOf(wrong)).message).toBe((await errorOf(second)).message)
  })

  it('answers 400 and 429', async () => {
    expect(
      (await postJson(apiRoutes.wallRemove, { id: 'x', token: 'y' })).status
    ).toBe(400)
    const token = 'c'.repeat(43)
    const id = crypto.randomUUID()
    store.addApproved({
      id,
      createdAt: '2026-11-06T12:00:00.000Z',
      displayName: null,
    })
    for (let count = 0; count < 10; count += 1) {
      await postJson(apiRoutes.wallRemove, { id, token })
    }
    expect((await postJson(apiRoutes.wallRemove, { id, token })).status).toBe(
      429
    )
  })
})

describe('payload wall store', () => {
  it('writes a pending WebP through the Local API and replays the receipt', async () => {
    const key = crypto.randomUUID()
    const token = 'd'.repeat(43)
    const publicId = crypto.randomUUID()
    const db = scripted({ receipt: null })
    const cms = fakeCms()
    const wall = createPayloadWallStore(db, async () => cms.api, directory)
    const image = Buffer.from('webp')
    const saved = await wall.createPost({
      idempotencyKey: key,
      publicId,
      removeToken: token,
      removeTokenHash: hashRemoveToken(token),
      consentText: CONSENT,
      consentAt: '2026-11-06T12:00:00.000Z',
      adult: true,
      displayName: 'Avery',
      image,
      width: 8,
      height: 8,
    })
    expect(saved).toEqual({ id: publicId, removeToken: token })
    const created = cms.created[0]
    if (!created) throw new Error('Local API create was not called')
    expect(created.overrideAccess).toBe(true)
    expect(created.context).toEqual({ skipRevalidation: true })
    expect(created.file).toEqual({
      data: image,
      mimetype: 'image/webp',
      name: `${publicId}.webp`,
      size: image.length,
    })
    expect(created.data.removeTokenHash).toBe(hashRemoveToken(token))
    expect(created.data.removeTokenHash).not.toBe(token)
    expect(created.data.status).toBe('pending')
    expect(created.data.consentText).toBe(CONSENT)
    expect(created.data.adult).toBe(true)
    const insert = db.queries.find((query) =>
      query.sql.includes('INSERT INTO integration.wall_posts')
    )
    expect(insert?.params).toEqual([key, publicId, token])

    const replayDb = scripted({
      receipt: { public_id: publicId, remove_token: token },
    })
    const replayCms = fakeCms()
    const replay = createPayloadWallStore(
      replayDb,
      async () => replayCms.api,
      directory
    )
    await expect(
      replay.createPost({
        idempotencyKey: key,
        publicId: crypto.randomUUID(),
        removeToken: 'e'.repeat(43),
        removeTokenHash: hashRemoveToken('e'.repeat(43)),
        consentText: CONSENT,
        consentAt: '2026-11-06T12:00:00.000Z',
        adult: true,
        image,
        width: 8,
        height: 8,
      })
    ).resolves.toEqual({ id: publicId, removeToken: token })
    expect(replayCms.created).toHaveLength(0)
  })

  it('drops the photo when the receipt insert fails', async () => {
    const db = scripted({ receipt: null, failInsert: true })
    const cms = fakeCms()
    const wall = createPayloadWallStore(db, async () => cms.api, directory)
    await expect(
      wall.createPost({
        idempotencyKey: crypto.randomUUID(),
        publicId: crypto.randomUUID(),
        removeToken: 'f'.repeat(43),
        removeTokenHash: hashRemoveToken('f'.repeat(43)),
        consentText: CONSENT,
        consentAt: '2026-11-06T12:00:00.000Z',
        adult: true,
        image: Buffer.from('webp'),
        width: 4,
        height: 4,
      })
    ).rejects.toThrow('insert failed')
    expect(cms.deleted).toHaveLength(1)
    expect(cms.deleted[0]?.id).toBe(4)
  })

  it('lists approved photos and hides one at the third report', async () => {
    const id = crypto.randomUUID()
    const row = photoRow(id)
    const db = scripted({ receipt: null, reportCount: 3 })
    const cms = fakeCms([row])
    const wall = createPayloadWallStore(db, async () => cms.api, directory)
    const page = await wall.listApproved(null, 30)
    expect(page).toEqual([
      {
        id,
        src: `/api/cms/wallPhotos/file/${id}.webp`,
        width: 10,
        height: 20,
        displayName: 'Avery',
        createdAt: '2026-11-06T12:00:00.000Z',
      },
    ])
    expect(cms.finds[0]?.overrideAccess).toBe(false)

    const reported = await wall.report(id, 'visitor')
    expect(reported).toEqual({ count: 3 })
    expect(cms.updates[0]?.data).toEqual({ reports: 3, status: 'pending' })
  })

  it('deletes the file when the photo is removed', async () => {
    const id = crypto.randomUUID()
    const row = photoRow(id)
    await writeFile(path.join(directory, `${id}.webp`), Buffer.from('secret'))
    const db = scripted({ receipt: null })
    const cms = fakeCms([row])
    const wall = createPayloadWallStore(db, async () => cms.api, directory)
    await wall.markRemoved(id)
    expect(cms.updates[0]?.data).toEqual({ status: 'removed' })
    await expect(readFile(path.join(directory, `${id}.webp`))).rejects.toThrow()
  })
})

function photoRow(id: string): WallPhotoRow {
  return {
    id: 9,
    publicId: id,
    status: 'approved',
    displayName: 'Avery',
    removeTokenHash: hashRemoveToken('b'.repeat(43)),
    reports: 2,
    createdAt: '2026-11-06T12:00:00.000Z',
    url: `/api/cms/wallPhotos/file/${id}.webp`,
    width: 10,
    height: 20,
    filename: `${id}.webp`,
    sizes: { thumbnail: { filename: `${id}-400x225.webp` } },
  }
}

function scripted(options: {
  receipt: { public_id: string; remove_token: string } | null
  failInsert?: boolean
  reportCount?: number
}): WallDb & { queries: { sql: string; params: readonly SqlValue[] }[] } {
  const queries: { sql: string; params: readonly SqlValue[] }[] = []
  const query = async <Row>(sql: string, params: readonly SqlValue[] = []) => {
    queries.push({ sql, params })
    if (sql.includes('pg_advisory')) return { rows: [] as Row[] }
    if (sql.includes('SELECT public_id')) {
      return { rows: (options.receipt ? [options.receipt] : []) as Row[] }
    }
    if (sql.includes('INSERT INTO integration.wall_posts')) {
      if (options.failInsert) throw new Error('insert failed')
      return { rows: [] as Row[] }
    }
    if (sql.includes('INSERT INTO integration.wall_reports')) {
      return { rows: [{ public_id: params[0] }] as Row[] }
    }
    if (sql.includes('count(*)')) {
      return { rows: [{ count: options.reportCount ?? 1 }] as Row[] }
    }
    if (sql.startsWith('DELETE') || sql.includes('DELETE FROM')) {
      return { rows: [] as Row[] }
    }
    throw new Error(`Unexpected SQL: ${sql}`)
  }
  return {
    queries,
    query,
    async connect() {
      return {
        query,
        release() {
          queries.push({ sql: 'release', params: [] })
        },
      }
    },
  }
}

function fakeCms(docs: WallPhotoRow[] = []) {
  const created: Parameters<WallCms['create']>[0][] = []
  const updates: Parameters<WallCms['update']>[0][] = []
  const deleted: Parameters<WallCms['delete']>[0][] = []
  const finds: WallFindArgs[] = []
  const api: WallCms = {
    async create(args) {
      created.push(args)
      return { id: 4 }
    },
    async find(args) {
      finds.push(args)
      return { docs, hasNextPage: false }
    },
    async update(args) {
      updates.push(args)
      return { id: args.id }
    },
    async delete(args) {
      deleted.push(args)
    },
  }
  return { api, created, updates, deleted, finds }
}
