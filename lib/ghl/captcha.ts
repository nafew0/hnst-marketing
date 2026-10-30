import { verifySolution } from 'altcha-lib'
import type { Challenge, DeriveKeyFunction, Solution } from 'altcha-lib'
import { deriveKey as derivePbkdf2 } from 'altcha-lib/algorithms/pbkdf2'
import { deriveKey as deriveSha } from 'altcha-lib/algorithms/sha'
import { verifySolution as verifyV1 } from 'altcha-lib/v1'
import { z } from 'zod'

const v2PayloadSchema = z.object({
  challenge: z
    .object({
      parameters: z
        .object({
          algorithm: z.string(),
          nonce: z.string(),
          salt: z.string(),
          cost: z.number(),
          keyLength: z.number(),
          keyPrefix: z.string(),
        })
        .passthrough(),
      signature: z.string().optional(),
    })
    .passthrough(),
  solution: z
    .object({
      counter: z.number(),
      derivedKey: z.string(),
    })
    .passthrough(),
})

function deriveFor(algorithm: string): DeriveKeyFunction | null {
  if (
    algorithm === 'SHA-256' ||
    algorithm === 'SHA-384' ||
    algorithm === 'SHA-512'
  ) {
    return deriveSha
  }
  if (algorithm.startsWith('PBKDF2/')) return derivePbkdf2
  return null
}

function decodeV2(payload: string) {
  try {
    const parsed = v2PayloadSchema.safeParse(
      JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
    )
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/**
 * Checks an ALTCHA widget payload. v2 is `{ challenge, solution }` in base64.
 * v1 is the older base64 payload `altcha-lib/v1` verifies directly. A bad or
 * unsupported payload is a failure, not an exception the caller has to sort.
 */
export async function verifyAltcha(
  payload: string,
  hmacKey: string
): Promise<boolean> {
  const parsed = decodeV2(payload)
  if (parsed) {
    const deriveKey = deriveFor(parsed.challenge.parameters.algorithm)
    if (!deriveKey) return false
    // SAFETY: zod checked the fields verifySolution reads. passthrough keeps
    // the rest of the signed parameters, which a rebuilt object would drop.
    const challenge = parsed.challenge as Challenge
    // SAFETY: zod checked solution.counter and solution.derivedKey on this same payload.
    const solution = parsed.solution as Solution
    try {
      const result = await verifySolution({
        challenge,
        solution,
        deriveKey,
        hmacSignatureSecret: hmacKey,
      })
      return result.verified
    } catch {
      return false
    }
  }

  try {
    return await verifyV1(payload, hmacKey)
  } catch {
    return false
  }
}
