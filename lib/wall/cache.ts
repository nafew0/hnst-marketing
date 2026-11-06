import { unstable_cache } from 'next/cache'

import { WALL_CACHE_SECONDS, WALL_CACHE_TAG } from './constants'
import type { WallCursorPoint } from './cursor'
import type { ApprovedPhoto, WallStore } from './types'

/** Approved pages, tagged so a status change in Payload drops the cache. */
export function cachedApproved(
  store: WallStore
): (point: WallCursorPoint | null, limit: number) => Promise<ApprovedPhoto[]> {
  const read = unstable_cache(
    async (createdAt: string, publicId: string, limit: number) =>
      store.listApproved(
        createdAt === '' ? null : { createdAt, publicId },
        limit
      ),
    ['honest-wall'],
    { revalidate: WALL_CACHE_SECONDS, tags: [WALL_CACHE_TAG] }
  )
  return (point, limit) =>
    read(point?.createdAt ?? '', point?.publicId ?? '', limit)
}
