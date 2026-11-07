import type { ErrorCode, WallPending } from '@/lib/contracts'

/**
 * What the post sheet says for each answer in the wall contract
 * (lib/contracts/wall.ts). Pure, so `bun test` covers every status.
 */
export function postFailure(status: number, code: ErrorCode): string {
  if (status === 0 || code === 'upstream_unavailable')
    return 'Couldn’t reach HONEST. Check your connection, then try again.'
  if (code === 'captcha_failed')
    return 'The check didn’t go through. Do it again, then post.'
  if (status === 413)
    return 'This photo is too large to post. The limit is 8 MB.'
  if (status === 415)
    return 'This type of photo can’t be posted. Use a JPEG, PNG, WebP or HEIC photo.'
  if (status === 429 || code === 'rate_limited')
    return 'Too many posts from this connection. Wait a while, then try again.'
  if (code === 'validation_failed') return 'Some details need attention.'
  return 'Something went wrong. Please try again.'
}

/** The page that removes a photo; the id and token stay in the fragment, out of server logs. */
export function removalPath(pending: Pick<WallPending, 'id' | 'removeToken'>) {
  return `/wall/remove#${pending.id}.${pending.removeToken}`
}
