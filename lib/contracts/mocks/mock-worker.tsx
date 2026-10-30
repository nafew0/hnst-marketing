'use client'

import { useEffect } from 'react'

import { startWorker } from './browser'
import { markMocksReady } from './ready'

/** Registers the MSW service worker; only ever loaded in the browser. */
export function MockWorker() {
  useEffect(() => {
    void startWorker()
      .then(() => {
        console.info('[api] /api/v1 is mocked (NEXT_PUBLIC_API_MOCKS=1)')
      })
      .finally(markMocksReady)
  }, [])

  return null
}
