import { describe, expect, it } from 'bun:test'

import { acceptWorkflow, secretsMatch } from './workflow'

const secret = 'workflow-secret-at-least-24'

function harness() {
  const receipts = new Set<string>()
  let revalidations = 0
  const deps = {
    insertReceipt: async (id: string) => {
      if (receipts.has(id)) return false
      receipts.add(id)
      return true
    },
    deleteReceipt: async (id: string) => {
      receipts.delete(id)
    },
    revalidate: () => {
      revalidations += 1
    },
  }
  return {
    deps,
    receipts,
    revalidations: () => revalidations,
  }
}

describe('workflow webhook', () => {
  it('rejects a bad key without storing a receipt', async () => {
    const { deps, receipts, revalidations } = harness()
    const result = await acceptWorkflow(
      {
        key: 'not-the-secret-value-here',
        secret,
        body: { event: 'offer-changed', id: 'evt-1', timestamp: 't1' },
      },
      deps
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.status).toBe(401)
    expect(receipts.size).toBe(0)
    expect(revalidations()).toBe(0)
    expect(secretsMatch('short', secret)).toBe(false)
  })

  it('dedupes the same id and timestamp and expires offers once', async () => {
    const { deps, revalidations } = harness()
    const body = { event: 'offer-changed', id: 'evt-1', timestamp: 't1' }
    const first = await acceptWorkflow({ key: secret, secret, body }, deps)
    const second = await acceptWorkflow({ key: secret, secret, body }, deps)
    expect(first).toEqual({ ok: true, duplicate: false })
    expect(second).toEqual({ ok: true, duplicate: true })
    expect(revalidations()).toBe(1)

    const third = await acceptWorkflow(
      {
        key: secret,
        secret,
        body: { event: 'offer-changed', id: 'evt-1', timestamp: 't2' },
      },
      deps
    )
    expect(third).toEqual({ ok: true, duplicate: false })
    expect(revalidations()).toBe(2)
  })

  it('rejects a payload that is missing an id', async () => {
    const { deps, receipts } = harness()
    const result = await acceptWorkflow(
      { key: secret, secret, body: { event: 'offer-changed' } },
      deps
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('validation_failed')
    expect(receipts.size).toBe(0)
  })
})
