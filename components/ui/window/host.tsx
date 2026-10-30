'use client'

import { useLenis } from 'lenis/react'
import dynamic from 'next/dynamic'
import { useEffect } from 'react'

import { pauseDrawing } from '@/webgl/utils/awake'

import { resetDepth } from './history'
import { settle, useWindows } from './store'

// Lazy, like the header's drawer: Base UI stays out of every page's first load.
const WindowDialog = dynamic(
  () => import('./dialog').then((mod) => mod.WindowDialog),
  { ssr: false }
)
const WindowDock = dynamic(
  () => import('./dock').then((mod) => mod.WindowDock),
  { ssr: false }
)

/** The window layer, in the site layout. */
export function WindowHost() {
  const routeHref = useWindows((state) => state.routeHref)
  const open = useWindows((state) => state.activeHref !== null)
  const hasContent = useWindows((state) =>
    state.entries.some((entry) => entry.content !== null || !entry.minimised)
  )
  const hasMinimised = useWindows((state) =>
    state.entries.some((entry) => entry.minimised)
  )
  const lenis = useLenis()

  useEffect(() => {
    if (routeHref !== null) return
    settle()
    resetDepth()
  }, [routeHref])

  // The page behind stops: no scrolling, and the canvas keeps its last frame.
  useEffect(() => {
    if (!open) return
    lenis?.lock()
    const resumeDrawing = pauseDrawing()
    return () => {
      lenis?.unlock()
      resumeDrawing()
    }
  }, [open, lenis])

  return (
    <>
      {(open || hasContent) && <WindowDialog />}
      {hasMinimised && !open && <WindowDock />}
    </>
  )
}
