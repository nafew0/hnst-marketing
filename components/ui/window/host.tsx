'use client'

import { useLenis } from 'lenis/react'
import dynamic from 'next/dynamic'
import { useEffect } from 'react'

import { PHONE_LAYOUT } from '@/components/ui/phone/flag'
import type { SiteLinks } from '@/components/ui/phone/load'
import { usePhone } from '@/components/ui/phone/store'
import { useDeviceDetection } from '@/hooks/use-device-detection'
import { pauseDrawing } from '@/webgl/utils/awake'

import { DockIconDefs } from './dock-icons'
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

/** The window layer, in the site layout. `links` feed the dock's way-out icons. */
export function WindowHost({ links }: { links: SiteLinks }) {
  const routeHref = useWindows((state) => state.routeHref)
  const open = useWindows((state) => state.activeHref !== null)
  const hasContent = useWindows((state) =>
    state.entries.some((entry) => entry.content !== null || !entry.minimised)
  )
  const lenis = useLenis()
  const { isMobile } = useDeviceDetection()
  // The phone layout's home screen has its own dock (docs/phases/M1.md).
  const classic = usePhone((state) => state.classic)
  const dock = !PHONE_LAYOUT || isMobile === false || classic

  useEffect(() => {
    if (routeHref !== null) return
    settle()
    resetDepth()
  }, [routeHref])

  // The page behind stops: no scrolling, and the canvas keeps its last frame.
  useEffect(() => {
    if (!open) return
    lenis?.lock()
    const root = document.documentElement
    root.style.overflow = 'hidden'
    const resumeDrawing = pauseDrawing()
    return () => {
      lenis?.unlock()
      root.style.overflow = ''
      resumeDrawing()
    }
  }, [open, lenis])

  return (
    <>
      {/* The icons' gradients, once, server-rendered, for both layouts. */}
      <DockIconDefs />
      {(open || hasContent) && <WindowDialog />}
      {dock && <WindowDock links={links} />}
    </>
  )
}
