import { setupWorker } from 'msw/browser'

import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

// One start per worker. `worker.start()` checks its state, then awaits the
// service-worker registration, so a second call in that gap (React Strict
// Mode, or Fast Refresh re-running a component module) throws. The guard
// lives beside the worker so it resets only when the worker does.
let starting: Promise<unknown> | undefined

export function startWorker() {
  starting ??= worker.start({ onUnhandledFrame: 'bypass', quiet: true })
  return starting
}
