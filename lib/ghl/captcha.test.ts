import { describe, expect, it } from 'bun:test'

import { createChallenge, solveChallenge } from 'altcha-lib'
import { deriveKey } from 'altcha-lib/algorithms/sha'

import { verifyAltcha } from './captcha'

const secret = 'test-secret-test-secret-test-secret'

describe('verifyAltcha', () => {
  it('accepts a solved challenge and rejects a garbage payload', async () => {
    const challenge = await createChallenge({
      algorithm: 'SHA-256',
      cost: 1,
      keyPrefix: '0',
      hmacSignatureSecret: secret,
      deriveKey,
    })
    const solution = await solveChallenge({ challenge, deriveKey })
    expect(solution).not.toBeNull()
    if (!solution) return
    const payload = Buffer.from(
      JSON.stringify({ challenge, solution })
    ).toString('base64')
    expect(await verifyAltcha(payload, secret)).toBe(true)
    expect(await verifyAltcha(payload, 'wrong-secret-wrong-secret-wrong')).toBe(
      false
    )
    expect(await verifyAltcha('fail', secret)).toBe(false)
  })
})
