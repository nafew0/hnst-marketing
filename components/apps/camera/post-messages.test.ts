import { describe, expect, it } from 'bun:test'

import { postFailure, removalPath } from './post-messages'

describe('what the post sheet says', () => {
  // Every failure in POST /api/v1/wall (lib/contracts/wall.ts), plus no network.
  const answers = [
    [0, 'upstream_unavailable', /connection/u],
    [400, 'validation_failed', /details need attention/u],
    [400, 'captcha_failed', /check/u],
    [413, 'validation_failed', /8 MB/u],
    [415, 'validation_failed', /JPEG, PNG, WebP or HEIC/u],
    [429, 'rate_limited', /Wait a while/u],
    [500, 'internal_error', /try again/u],
  ] as const

  for (const [status, code, says] of answers) {
    it(`${status} ${code}`, () => {
      expect(postFailure(status, code)).toMatch(says)
    })
  }
})

describe('the removal link', () => {
  it('keeps the id and token in the fragment, which never reaches the server', () => {
    const path = removalPath({
      id: '7b0f4c1e-1111-4222-8333-444455556666',
      removeToken: 'a'.repeat(43),
    })
    expect(path).toBe(
      `/wall/remove#7b0f4c1e-1111-4222-8333-444455556666.${'a'.repeat(43)}`
    )
    expect(new URL(path, 'https://hnst.example').pathname).toBe('/wall/remove')
  })
})
