import { describe, expect, it } from 'bun:test'

import { failureDisposition, runUntilSettled } from './attempts'
import { LEAD_MAX_FAILURES, LEAD_RETRY_LIMIT } from './constants'

describe('lead retries', () => {
  it('dead-letters on the 8th failure and retries before that', async () => {
    expect(LEAD_MAX_FAILURES).toBe(8)
    expect(failureDisposition(LEAD_RETRY_LIMIT - 1, LEAD_RETRY_LIMIT)).toBe(
      'retry'
    )
    expect(failureDisposition(LEAD_RETRY_LIMIT, LEAD_RETRY_LIMIT)).toBe('dlq')

    let runs = 0
    const settled = await runUntilSettled(LEAD_RETRY_LIMIT, async () => {
      runs += 1
      throw new Error('ghl down')
    })
    expect(settled).toBe('dlq')
    expect(runs).toBe(8)
  })

  it('stops retrying once a later attempt succeeds', async () => {
    let runs = 0
    const settled = await runUntilSettled(LEAD_RETRY_LIMIT, async () => {
      runs += 1
      if (runs < 3) throw new Error('ghl down')
    })
    expect(settled).toBe('done')
    expect(runs).toBe(3)
  })
})
