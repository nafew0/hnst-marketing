'use client'

import dynamic from 'next/dynamic'

import { apiMocksEnabled } from './ready'

// `ssr: false` keeps MSW out of the server graph: its `msw/browser` entry has
// no Node build. The chunk is only requested when the flag is on.
const MockWorker = dynamic(
  () => import('./mock-worker').then((mod) => mod.MockWorker),
  { ssr: false }
)

/**
 * Mocks /api/v1 in the browser when NEXT_PUBLIC_API_MOCKS=1 (inlined at build
 * time). Only /api/v1 is mocked; every other request passes through.
 */
export function ApiMocks() {
  return apiMocksEnabled ? <MockWorker /> : null
}
