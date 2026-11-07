import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { WALL_ORPHAN_GRACE_MS } from './constants'
import { MemoryWallStore } from './memory-store'
import { purgeWall } from './purge'

let directory: string
let store: MemoryWallStore

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'wall-purge-'))
  store = new MemoryWallStore(directory)
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

describe('purgeWall', () => {
  it('deletes old rejected photos and stale orphans', async () => {
    const now = new Date('2026-11-06T12:00:00.000Z')
    const kept = crypto.randomUUID()
    const rejected = crypto.randomUUID()
    store.addApproved({
      id: kept,
      createdAt: now.toISOString(),
      displayName: null,
    })
    store.addRejected(rejected, '2026-10-01T12:00:00.000Z')
    store.addRejected(crypto.randomUUID(), '2026-11-05T12:00:00.000Z')

    await writeFile(path.join(directory, `${kept}.webp`), Buffer.from('keep'))
    await writeFile(
      path.join(directory, `${rejected}.webp`),
      Buffer.from('rejected')
    )
    const stale = path.join(directory, 'orphan-old.webp')
    const fresh = path.join(directory, 'orphan-new.webp')
    const odd = path.join(directory, 'leave this.webp')
    await writeFile(stale, Buffer.from('stale'))
    await writeFile(fresh, Buffer.from('fresh'))
    await writeFile(odd, Buffer.from('odd'))
    const old = new Date(now.getTime() - WALL_ORPHAN_GRACE_MS - 1000)
    await utimes(stale, old, old)

    const result = await purgeWall(store, directory, now)
    expect(result.rejected).toBe(1)
    expect(result.orphans).toBe(1)
    expect(result.receipts).toBe(0)
    await expect(
      readFile(path.join(directory, `${kept}.webp`))
    ).resolves.toBeDefined()
    await expect(
      readFile(path.join(directory, `${rejected}.webp`))
    ).rejects.toThrow()
    await expect(readFile(stale)).rejects.toThrow()
    expect(await readFile(fresh)).toEqual(Buffer.from('fresh'))
    expect(await readFile(odd)).toEqual(Buffer.from('odd'))
    expect(store.statusOf(rejected)).toBeUndefined()
  })

  it('deletes receipts older than 24 hours and keeps newer ones', async () => {
    const now = new Date('2026-11-06T12:00:00.000Z')
    const expired = crypto.randomUUID()
    const fresh = crypto.randomUUID()
    store.seedReceipt(expired, '2026-11-05T11:00:00.000Z')
    store.seedReceipt(fresh, '2026-11-06T00:00:00.000Z')

    const result = await purgeWall(store, directory, now)

    expect(result.receipts).toBe(1)
    expect(await store.findReceipt(expired)).toBeNull()
    const kept = await store.findReceipt(fresh)
    expect(kept).not.toBeNull()
  })
})
