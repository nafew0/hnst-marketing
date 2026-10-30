/**
 * Matches pg-boss: a failure whose `retry_count` is still under `retryLimit`
 * is queued again. At the limit the job is failed and copied to the dead-letter
 * queue. `retryCount` is the count stored on the attempt that just failed.
 */
export function failureDisposition(
  retryCount: number,
  retryLimit: number
): 'retry' | 'dlq' {
  return retryCount >= retryLimit ? 'dlq' : 'retry'
}

/**
 * Runs `run` the way the lead queue does: the first failure has retryCount 0,
 * each later failure increments it, and the call stops at `done` or `dlq`.
 * Tests use this so they do not wait on pg-boss backoff. The last error is
 * dropped because the `dlq` result is the outcome the caller asserts.
 */
export async function runUntilSettled(
  retryLimit: number,
  run: (retryCount: number) => Promise<void>
): Promise<'done' | 'dlq'> {
  let retryCount = 0
  for (;;) {
    try {
      await run(retryCount)
      return 'done'
    } catch {
      if (failureDisposition(retryCount, retryLimit) === 'dlq') return 'dlq'
      retryCount += 1
    }
  }
}
