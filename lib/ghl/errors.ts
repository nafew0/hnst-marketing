import type { RateLimitInfo } from '@gohighlevel/api-client'

/** A GoHighLevel call failed. `retryAfterMs` is set when the API said to wait. */
export class GhlRequestError extends Error {
  readonly statusCode: number
  readonly retryAfterMs: number | null

  constructor(
    message: string,
    statusCode: number,
    retryAfterMs: number | null
  ) {
    super(message)
    this.name = 'GhlRequestError'
    this.statusCode = statusCode
    this.retryAfterMs = retryAfterMs
  }
}

/**
 * How long to wait after a 429. Daily limits are capped so one attempt cannot
 * sleep for hours; the job retry waits the rest. Cost: a daily-limit failure
 * burns one of the eight attempts instead of blocking the worker.
 */
export function retryDelayMs(info: RateLimitInfo | undefined): number {
  const cap = 30_000
  if (!info) return 1_000
  if (info.scope === 'daily') return Math.min(info.dailyResetMs ?? cap, cap)
  return Math.min(Math.max(info.intervalMs ?? 1_000, 200), cap)
}
