import { env } from '@/lib/env'
import { loadWallCms, wallDatabase } from '@/lib/wall/backend'
import { resolveWallDirectory } from '@/lib/wall/directory'
import { createPayloadWallStore } from '@/lib/wall/payload-store'
import { purgeWall, type WallPurgeResult } from '@/lib/wall/purge'

export async function runWallPurge(now = new Date()): Promise<WallPurgeResult> {
  const directory = resolveWallDirectory(env.WALL_MEDIA_DIR)
  const store = createPayloadWallStore(wallDatabase(), loadWallCms, directory)
  return purgeWall(store, directory, now)
}
