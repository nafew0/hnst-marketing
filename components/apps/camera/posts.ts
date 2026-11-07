import { create } from 'zustand'

import type { WallPending } from '@/lib/contracts'
import { newIdempotencyKey } from '@/lib/contracts/client'

import { removalPath } from './post-messages'

/**
 * Wall posts this visit, by shot, in memory only: the Idempotency-Key that
 * every attempt for a photo reuses, and once accepted, the removal link the
 * visitor was shown.
 */
interface WallPost {
  key: string
  removalLink?: string
}

export const useWallPosts = create<{ posts: Record<string, WallPost> }>(() => ({
  posts: {},
}))

/** One key per photo: made on its first post, reused by every retry (docs/phases/M7.md). */
export function postKeyFor(shotId: string) {
  const existing = useWallPosts.getState().posts[shotId]
  if (existing) return existing.key
  const key = newIdempotencyKey()
  useWallPosts.setState(({ posts }) => ({
    posts: { ...posts, [shotId]: { key } },
  }))
  return key
}

export function markPosted(shotId: string, pending: WallPending) {
  const removalLink = new URL(removalPath(pending), window.location.origin).href
  useWallPosts.setState(({ posts }) => ({
    posts: {
      ...posts,
      [shotId]: { key: posts[shotId]?.key ?? newIdempotencyKey(), removalLink },
    },
  }))
}
