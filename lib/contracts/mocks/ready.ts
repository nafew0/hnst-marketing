/**
 * Gate for the API client while the MSW worker registers, so the first request
 * on a page cannot slip past the mocks. Resolves at once when mocks are off.
 */

const enabled = process.env.NEXT_PUBLIC_API_MOCKS === '1'

let resolveReady: (() => void) | undefined
const ready = enabled
  ? new Promise<void>((resolve) => {
      resolveReady = resolve
    })
  : Promise.resolve()

export const apiMocksEnabled = enabled

export function mocksReady() {
  return ready
}

export function markMocksReady() {
  resolveReady?.()
}
