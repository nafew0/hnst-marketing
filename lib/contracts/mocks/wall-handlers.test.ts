import { beforeEach, describe, expect, it } from 'bun:test'

import { getResponse } from 'msw'

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
  type WallRemoveInput,
} from '@/lib/contracts'

import { sampleWall } from './fixtures'
import { handlers, RATE_LIMITED_WALL_ID, resetMockState } from './handlers'

// M1 acceptance: the wall mocks answer every status in lib/contracts/wall.ts,
// and every success parses with the contract the real back end must meet.

const ORIGIN = 'http://localhost'

beforeEach(() => resetMockState())

async function fetch(url: string, init?: RequestInit) {
  const response = await getResponse(handlers, new Request(url, init), {
    baseUrl: ORIGIN,
  })
  if (!response) throw new Error(`No mock handler for ${url}`)
  return response
}

const photo = (bytes = 64, type = 'image/jpeg') =>
  new Blob([new Uint8Array(bytes)], { type })

const samplePost: WallPostInput = {
  image: photo(),
  consentText: 'Show my photo on the HONEST wall. I can ask for it to go.',
  adult: true,
  displayName: 'Avery',
  altcha: 'mock-altcha-payload',
}

function postPhoto(
  input: WallPostInput | FormData = samplePost,
  key: string | null = crypto.randomUUID()
) {
  return fetch(`${ORIGIN}${apiRoutes.wall}`, {
    method: 'POST',
    headers: key ? { [IDEMPOTENCY_HEADER]: key } : {},
    body: input instanceof FormData ? input : wallFormData(input),
  })
}

function postJson(path: string, body: Partial<WallRemoveInput>) {
  return fetch(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function errorOf(response: Response) {
  return errorEnvelopeSchema.parse(await response.json()).error
}

describe('POST /api/v1/wall', () => {
  it('stores a photo as pending and replays a repeated key', async () => {
    const key = crypto.randomUUID()
    const first = await postPhoto(samplePost, key)
    const second = await postPhoto(samplePost, key)
    expect(first.status).toBe(202)
    expect(second.status).toBe(202)
    const a = wallPendingSchema.parse(await first.json())
    const b = wallPendingSchema.parse(await second.json())
    expect(b).toEqual(a)
  })

  it('needs an idempotency key', async () => {
    const response = await postPhoto(samplePost, null)
    expect(response.status).toBe(400)
    expect((await errorOf(response)).code).toBe('idempotency_key_missing')
  })

  it('answers 400, 413 and 415 for the photo itself', async () => {
    const empty = await postPhoto({ ...samplePost, image: photo(0) })
    expect(empty.status).toBe(400)
    expect((await errorOf(empty)).fields?.image).toBeDefined()

    const large = await postPhoto({
      ...samplePost,
      image: photo(WALL_MAX_BYTES + 1),
    })
    expect(large.status).toBe(413)
    expect((await errorOf(large)).fields?.image).toBeDefined()

    const gif = await postPhoto({
      ...samplePost,
      image: photo(64, 'image/gif'),
    })
    expect(gif.status).toBe(415)
    expect((await errorOf(gif)).code).toBe('validation_failed')
  })

  it('refuses a post without the 18+ box or consent wording', async () => {
    const form = wallFormData(samplePost)
    form.delete('adult')
    form.set('consentText', '  ')
    const response = await postPhoto(form)
    const error = await errorOf(response)
    expect(response.status).toBe(400)
    expect(error.fields?.adult).toBeDefined()
    expect(error.fields?.consentText).toBeDefined()
  })

  it('simulates captcha failure and rate limiting', async () => {
    const captcha = await postPhoto({ ...samplePost, altcha: 'fail' })
    expect((await errorOf(captcha)).code).toBe('captcha_failed')
    const limited = await postPhoto({ ...samplePost, displayName: 'ratelimit' })
    expect(limited.status).toBe(429)
  })
})

describe('GET /api/v1/wall', () => {
  it('pages approved photos, newest first', async () => {
    const first = wallPageSchema.parse(
      await (await fetch(`${ORIGIN}${apiRoutes.wall}`)).json()
    )
    expect(first.items).toHaveLength(WALL_PAGE_SIZE)
    expect(first.nextCursor).not.toBeNull()
    const [newest, next] = first.items
    expect(Date.parse(newest?.createdAt ?? '')).toBeGreaterThan(
      Date.parse(next?.createdAt ?? '')
    )

    const second = wallPageSchema.parse(
      await (
        await fetch(
          `${ORIGIN}${apiRoutes.wall}?cursor=${first.nextCursor ?? ''}`
        )
      ).json()
    )
    expect(second.items).toHaveLength(sampleWall.length - WALL_PAGE_SIZE)
    expect(second.nextCursor).toBeNull()
  })

  it('never lists a photo that is still pending', async () => {
    const posted = wallPendingSchema.parse(await (await postPhoto()).json())
    const page = wallPageSchema.parse(
      await (await fetch(`${ORIGIN}${apiRoutes.wall}`)).json()
    )
    expect(page.items.some((item) => item.id === posted.id)).toBe(false)
  })

  it('rejects a cursor it did not issue', async () => {
    const response = await fetch(`${ORIGIN}${apiRoutes.wall}?cursor=nope`)
    expect(response.status).toBe(400)
    expect((await errorOf(response)).fields?.cursor).toBeDefined()
  })
})

describe('POST /api/v1/wall/report', () => {
  it('counts a report on an approved photo', async () => {
    const [approved] = sampleWall
    if (!approved) throw new Error('Expected sample wall photos')
    const response = await postJson(apiRoutes.wallReport, { id: approved.id })
    expect(response.status).toBe(204)
  })

  it('answers 400, 404 and 429', async () => {
    expect((await postJson(apiRoutes.wallReport, {})).status).toBe(400)
    expect(
      (await postJson(apiRoutes.wallReport, { id: crypto.randomUUID() })).status
    ).toBe(404)
    expect(
      (await postJson(apiRoutes.wallReport, { id: RATE_LIMITED_WALL_ID }))
        .status
    ).toBe(429)
  })
})

describe('POST /api/v1/wall/remove', () => {
  it('removes a posted photo once, with its own token only', async () => {
    const { id, removeToken } = wallPendingSchema.parse(
      await (await postPhoto()).json()
    )
    const wrong = await postJson(apiRoutes.wallRemove, {
      id,
      token: removeToken.replace(/^./u, (first) => (first === 'A' ? 'B' : 'A')),
    })
    expect(wrong.status).toBe(404)

    const removed = await postJson(apiRoutes.wallRemove, {
      id,
      token: removeToken,
    })
    expect(removed.status).toBe(204)
    const again = await postJson(apiRoutes.wallRemove, {
      id,
      token: removeToken,
    })
    expect(again.status).toBe(404)
  })

  it('answers 400 and 429', async () => {
    expect(
      (await postJson(apiRoutes.wallRemove, { id: 'x', token: 'y' })).status
    ).toBe(400)
    expect(
      (
        await postJson(apiRoutes.wallRemove, {
          id: RATE_LIMITED_WALL_ID,
          token: 'A'.repeat(43),
        })
      ).status
    ).toBe(429)
  })
})
