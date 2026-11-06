import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

const DUMMY_HASH = createHash('sha256')
  .update('wall-remove-dummy')
  .digest('hex')

/** 32 bytes, base64url. Matches `wallRemoveTokenSchema` and the removal link. */
export function newRemoveToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashRemoveToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Compares the token to the stored hash in constant time. A missing hash is
 * compared against a stand-in so a wrong id does not return faster.
 */
export function removeTokenMatches(
  token: string,
  hash: string | null
): boolean {
  const actual = hashRemoveToken(token)
  const expected =
    hash !== null && hash.length === actual.length ? hash : DUMMY_HASH
  const match = timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  return match && hash === expected
}

/** One report bucket per address. Headerless clients share a single bucket. */
export function visitorHash(ip: string | null): string {
  return createHash('sha256')
    .update(`wall-report\0${ip ?? 'unknown'}`)
    .digest('hex')
}
