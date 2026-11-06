import { lstat, readdir, unlink } from 'node:fs/promises'
import path from 'node:path'

import { WALL_ORPHAN_GRACE_MS, WALL_REJECTED_DAYS } from './constants'
import { isEnoent, isSafeWallFilename } from './directory'
import type { WallStore } from './types'

export interface WallPurgeResult {
  rejected: number
  orphans: number
}

/**
 * Deletes rejected photos older than 30 days, then files in the wall
 * directory that no row still names. Young files are left, in case an upload
 * has not committed its row yet.
 */
export async function purgeWall(
  store: WallStore,
  directory: string,
  now: Date
): Promise<WallPurgeResult> {
  const cutoff = new Date(
    now.getTime() - WALL_REJECTED_DAYS * 24 * 60 * 60 * 1000
  )
  const rejected = await store.deleteRejectedBefore(cutoff.toISOString())
  const referenced = new Set(await store.listFilenames())
  let names: string[]
  try {
    names = await readdir(directory)
  } catch (error) {
    if (error instanceof Error && isEnoent(error)) {
      return { rejected, orphans: 0 }
    }
    throw error
  }

  const grace = now.getTime() - WALL_ORPHAN_GRACE_MS
  let orphans = 0
  for (const name of names) {
    if (!isSafeWallFilename(name) || referenced.has(name)) continue
    const full = path.join(directory, name)
    const info = await lstat(full)
    if (!info.isFile() || info.mtimeMs > grace) continue
    await unlink(full)
    orphans += 1
  }
  return { rejected, orphans }
}
