'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import { Cmdo } from './cmdo'
import Orchestra from './orchestra'
const Stats = dynamic(() => import('./stats').then(({ Stats }) => Stats), {
  ssr: false,
})
const GridDebugger = dynamic(
  () => import('./grid').then(({ GridDebugger }) => GridDebugger),
  { ssr: false }
)

// hamo 1.0.1 dropped the `./scroll-trigger/debugger` subpath from its exports
// map. The file still ships, and `./dist/*` is still exported, so this is the
// only reachable path until hamo restores the clean subpath.
const ScrollTriggerDebugger = dynamic(
  () =>
    import('hamo/dist/scroll-trigger/debugger').then(
      ({ Debugger }) => Debugger
    ),
  { ssr: false }
)

const ReactScan = dynamic(
  () =>
    import('@/components/react-scan-provider').then(
      ({ ReactScanProvider }) => ReactScanProvider
    ),
  { ssr: false }
)

export function OrchestraTools() {
  const { grid, dev, minimap, screenshot, reactScan, stats } = useOrchestra()

  useEffect(() => {
    document.documentElement.classList.toggle('dev', Boolean(dev))
  }, [dev])

  useEffect(() => {
    document.documentElement.classList.toggle('screenshot', Boolean(screenshot))
  }, [screenshot])

  return (
    <>
      <Cmdo />

      {grid && <GridDebugger />}
      {minimap && <ScrollTriggerDebugger />}
      {reactScan && <ReactScan />}
      {stats && <Stats />}
    </>
  )
}

export function useOrchestra() {
  const [state, setState] = useState<Record<string, boolean>>({})

  useEffect(() => {
    return Orchestra.subscribe(
      (state) => state,
      (state) => setState(state),
      {
        fireImmediately: true,
      }
    )
  }, [])

  return state
}
