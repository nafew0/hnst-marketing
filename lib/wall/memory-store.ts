import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { WALL_REPORTS_TO_HIDE } from '@/lib/contracts'

import { WALL_FILE_PREFIX } from './constants'
import type { WallCursorPoint } from './cursor'
import { unlinkWallFile } from './directory'
import type {
  ApprovedPhoto,
  NewWallPhoto,
  RemovablePhoto,
  StoredPost,
  WallStatus,
  WallStore,
} from './types'

interface MemoryPhoto {
  publicId: string
  status: WallStatus
  removeTokenHash: string
  reports: number
  displayName: string | null
  consentText: string
  consentAt: string
  createdAt: string
  statusChangedAt: string
  width: number
  height: number
  filename: string | null
  thumbnailFilename: string | null
}

interface MemoryReceipt {
  publicId: string
  removeToken: string
}

/**
 * The handler tests' stand-in for Payload. It keeps the same rules: one row
 * per idempotency key, approved rows only on the page, and files beside the
 * directory the production store uses.
 */
export class MemoryWallStore implements WallStore {
  readonly directory: string
  private readonly photos = new Map<string, MemoryPhoto>()
  private readonly receipts = new Map<string, MemoryReceipt>()
  private readonly reporters = new Map<string, Set<string>>()
  private readonly tails = new Map<string, Promise<void>>()

  constructor(directory: string) {
    this.directory = directory
  }

  receiptCount(): number {
    return this.receipts.size
  }

  statusOf(id: string): WallStatus | undefined {
    return this.photos.get(id)?.status
  }

  reportsOf(id: string): number {
    return this.photos.get(id)?.reports ?? 0
  }

  consentOf(id: string): string | undefined {
    return this.photos.get(id)?.consentText
  }

  filePath(id: string): string | null {
    const name = this.photos.get(id)?.filename
    return name ? path.join(this.directory, name) : null
  }

  addApproved(input: {
    id: string
    createdAt: string
    displayName: string | null
  }): void {
    this.photos.set(
      input.id,
      this.blank(input.id, 'approved', input.createdAt, input.displayName)
    )
  }

  addRejected(id: string, statusChangedAt: string): void {
    const photo = this.blank(id, 'rejected', statusChangedAt, null)
    photo.statusChangedAt = statusChangedAt
    this.photos.set(id, photo)
  }

  approve(id: string): void {
    const photo = this.photos.get(id)
    if (!photo) throw new Error('No wall photo to approve')
    photo.status = 'approved'
    photo.statusChangedAt = new Date().toISOString()
  }

  async findReceipt(key: string): Promise<StoredPost | null> {
    const existing = this.receipts.get(key)
    if (!existing) return null
    return { id: existing.publicId, removeToken: existing.removeToken }
  }

  async createPost(photo: NewWallPhoto): Promise<StoredPost> {
    return this.exclusive(photo.idempotencyKey, async () => {
      const existing = this.receipts.get(photo.idempotencyKey)
      if (existing) {
        return { id: existing.publicId, removeToken: existing.removeToken }
      }
      const filename = `${photo.publicId}.webp`
      await mkdir(this.directory, { recursive: true })
      await writeFile(path.join(this.directory, filename), photo.image)
      this.receipts.set(photo.idempotencyKey, {
        publicId: photo.publicId,
        removeToken: photo.removeToken,
      })
      this.photos.set(photo.publicId, {
        publicId: photo.publicId,
        status: 'pending',
        removeTokenHash: photo.removeTokenHash,
        reports: 0,
        displayName: photo.displayName ?? null,
        consentText: photo.consentText,
        consentAt: photo.consentAt,
        createdAt: photo.consentAt,
        statusChangedAt: photo.consentAt,
        width: photo.width,
        height: photo.height,
        filename,
        thumbnailFilename: null,
      })
      return { id: photo.publicId, removeToken: photo.removeToken }
    })
  }

  async listApproved(
    before: WallCursorPoint | null,
    limit: number
  ): Promise<ApprovedPhoto[]> {
    return [...this.photos.values()]
      .filter((photo) => photo.status === 'approved')
      .filter((photo) => before === null || isOlderThan(photo, before))
      .sort(newestFirst)
      .slice(0, limit)
      .map((photo) => toApproved(photo))
  }

  async findRemovable(id: string): Promise<RemovablePhoto | null> {
    const photo = this.photos.get(id)
    if (!photo) return null
    return toRemovable(photo)
  }

  async markRemoved(id: string): Promise<void> {
    const photo = this.photos.get(id)
    if (!photo || photo.status === 'removed') return
    const names = [photo.filename, photo.thumbnailFilename]
    photo.status = 'removed'
    photo.filename = null
    photo.thumbnailFilename = null
    photo.statusChangedAt = new Date().toISOString()
    this.reporters.delete(id)
    for (const name of names) await unlinkWallFile(this.directory, name)
  }

  async report(
    id: string,
    visitorHash: string
  ): Promise<{ count: number } | null> {
    const photo = this.photos.get(id)
    if (!photo || photo.status !== 'approved') return null
    const seen = this.reporters.get(id) ?? new Set<string>()
    this.reporters.set(id, seen)
    if (seen.has(visitorHash)) return { count: photo.reports }
    seen.add(visitorHash)
    photo.reports = seen.size
    if (photo.reports >= WALL_REPORTS_TO_HIDE) {
      photo.status = 'pending'
      photo.statusChangedAt = new Date().toISOString()
    }
    return { count: photo.reports }
  }

  async deleteRejectedBefore(iso: string): Promise<number> {
    const doomed = [...this.photos.values()].filter(
      (photo) => photo.status === 'rejected' && photo.statusChangedAt < iso
    )
    for (const photo of doomed) {
      const names = [photo.filename, photo.thumbnailFilename]
      this.photos.delete(photo.publicId)
      this.reporters.delete(photo.publicId)
      for (const name of names) await unlinkWallFile(this.directory, name)
    }
    return doomed.length
  }

  async listFilenames(): Promise<string[]> {
    const names: string[] = []
    for (const photo of this.photos.values()) {
      if (photo.filename) names.push(photo.filename)
      if (photo.thumbnailFilename) names.push(photo.thumbnailFilename)
    }
    return names
  }

  private blank(
    id: string,
    status: WallStatus,
    createdAt: string,
    displayName: string | null
  ): MemoryPhoto {
    return {
      publicId: id,
      status,
      removeTokenHash: 'seed',
      reports: 0,
      displayName,
      consentText: 'seed',
      consentAt: createdAt,
      createdAt,
      statusChangedAt: createdAt,
      width: 8,
      height: 8,
      filename: `${id}.webp`,
      thumbnailFilename: null,
    }
  }

  private async exclusive<T>(key: string, run: () => Promise<T>): Promise<T> {
    const previous = this.tails.get(key) ?? Promise.resolve()
    const gate = Promise.withResolvers<void>()
    const opened = previous.then(
      () => gate.promise,
      () => gate.promise
    )
    this.tails.set(
      key,
      opened.then(
        () => undefined,
        () => undefined
      )
    )
    try {
      await previous
      return await run()
    } finally {
      gate.resolve()
    }
  }
}

function isOlderThan(photo: MemoryPhoto, cursor: WallCursorPoint): boolean {
  if (photo.createdAt !== cursor.createdAt) {
    return photo.createdAt < cursor.createdAt
  }
  return photo.publicId < cursor.publicId
}

function newestFirst(a: MemoryPhoto, b: MemoryPhoto): number {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1
  if (a.publicId === b.publicId) return 0
  return a.publicId < b.publicId ? 1 : -1
}

function toApproved(photo: MemoryPhoto): ApprovedPhoto {
  return {
    id: photo.publicId,
    src: `${WALL_FILE_PREFIX}${encodeURIComponent(photo.filename ?? '')}`,
    width: photo.width,
    height: photo.height,
    displayName: photo.displayName,
    createdAt: photo.createdAt,
  }
}

function toRemovable(photo: MemoryPhoto): RemovablePhoto {
  return {
    id: photo.publicId,
    status: photo.status,
    removeTokenHash: photo.removeTokenHash,
    filename: photo.filename,
    thumbnailFilename: photo.thumbnailFilename,
  }
}
