'use server'
import { createChallenge } from 'altcha-lib'
import { deriveKey } from 'altcha-lib/algorithms/sha'

import { env } from '@/lib/env'
export async function getChallenge() {
  if (!env.ALTCHA_HMAC_KEY) return null
  return createChallenge({
    algorithm: 'SHA-256',
    cost: 1,
    deriveKey,
    hmacSignatureSecret: env.ALTCHA_HMAC_KEY,
    expiresAt: new Date(Date.now() + 300000),
  })
}
