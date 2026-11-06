import type { WallCursorPoint } from './cursor'

export type WallStatus = 'pending' | 'approved' | 'rejected' | 'removed'

export interface StoredPost {
  id: string
  removeToken: string
}

export interface ApprovedPhoto {
  id: string
  src: string
  width: number
  height: number
  displayName: string | null
  createdAt: string
}

export interface RemovablePhoto {
  id: string
  status: WallStatus
  removeTokenHash: string
  filename: string | null
  thumbnailFilename: string | null
}

export interface NewWallPhoto {
  idempotencyKey: string
  publicId: string
  removeToken: string
  removeTokenHash: string
  consentText: string
  consentAt: string
  adult: true
  displayName?: string
  image: Buffer
  width: number
  height: number
}

export interface WallStore {
  findReceipt(key: string): Promise<StoredPost | null>
  createPost(photo: NewWallPhoto): Promise<StoredPost>
  listApproved(
    before: WallCursorPoint | null,
    limit: number
  ): Promise<ApprovedPhoto[]>
  findRemovable(id: string): Promise<RemovablePhoto | null>
  markRemoved(id: string): Promise<void>
  /** Null when no approved photo has that id. A repeat visitor does not add another report. */
  report(id: string, visitorHash: string): Promise<{ count: number } | null>
  deleteRejectedBefore(iso: string): Promise<number>
  listFilenames(): Promise<string[]>
}

export type SqlValue = string | number

export interface WallQueryResult<Row> {
  rows: Row[]
}

export interface WallConnection {
  query<Row>(
    sql: string,
    params?: readonly SqlValue[]
  ): Promise<WallQueryResult<Row>>
  release(): void
}

export interface WallDb {
  query<Row>(
    sql: string,
    params?: readonly SqlValue[]
  ): Promise<WallQueryResult<Row>>
  connect(): Promise<WallConnection>
}
