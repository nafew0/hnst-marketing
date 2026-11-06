'use client'

import { Dialog } from '@base-ui/react/dialog'
import cn from 'clsx'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

import { openPrivacyPreferences } from '@/components/forms/privacy'
import { useDeviceTier } from '@/components/motion/device-tier'
import { HomeBar, PhoneAppBar } from '@/components/ui/phone/bars'
import { PHONE_LAYOUT } from '@/components/ui/phone/flag'
import { iconOf, takeLaunch } from '@/components/ui/phone/store'
import { clearZoom, zoomHome, zoomOpen } from '@/components/ui/phone/zoom'
import { worldHost, WorldSky } from '@/components/world'
import { useDeviceDetection } from '@/hooks/use-device-detection'

import { closeWindow, focusWindow, minimiseWindow } from './actions'
import { TitleBar } from './controls'
import { applyDraft } from './drafts'
import { genieOut, registerSurface, useMeasure } from './genie'
import { windowDepth } from './history'
import {
  clearDraft,
  toggleFullscreen,
  useWindows,
  type WindowEntry,
} from './store'

import s from './window.module.css'

/**
 * Hidden panes stay laid out but invisible, not `display: none`: a browser keeps
 * the scroll position of a box it still lays out, so restoring needs no reads.
 */
function Pane({ entry, active }: { entry: WindowEntry; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { href, title, content, draft } = entry

  useEffect(() => {
    if (!draft || !content || !ref.current) return
    applyDraft(ref.current, draft)
    clearDraft(href)
  }, [draft, content, href])

  return (
    // Takes focus when a page opens, so the arrow keys scroll it straight away.
    // Not a Tab stop: jsx-a11y forbids tabIndex 0 on a non-interactive element,
    // and every real page has links in it. A page with nothing focusable (the
    // CMS's empty fallback) fails axe's scrollable-region-focusable (M2 report).
    <div
      ref={ref}
      className={cn(s.scroller, worldHost)}
      data-active={active || undefined}
      data-window-scroller
      data-href={href}
      data-lenis-prevent
      tabIndex={-1}
      aria-label={title || 'Loading'}
    >
      <WorldSky />
      {content ?? (
        <p role="status" className={s.loading}>
          Loading
        </p>
      )}
    </div>
  )
}

/** The one visible window. Minimised pages stay mounted, invisible, behind it. */
export function WindowDialog() {
  const entries = useWindows((state) => state.entries)
  const activeHref = useWindows((state) => state.activeHref)
  const fullscreen = useWindows((state) => state.fullscreen)
  const active = entries.find((entry) => entry.href === activeHref)
  const { state: device } = useDeviceTier()
  const titleId = useId()
  const openedRef = useRef(false)
  const [popup, setPopup] = useState<HTMLElement | null>(null)
  const [backdrop, setBackdrop] = useState<HTMLElement | null>(null)
  const [setMeasureRef, measure] = useMeasure()
  const open = active !== undefined
  const { isMobile } = useDeviceDetection()
  const phone = PHONE_LAYOUT && isMobile === true

  // Phone layout: an app tapped on the home screen grows out of its icon.
  // Before paint, so it never shows at full size first.
  useLayoutEffect(() => {
    if (!phone || !activeHref || !popup || !takeLaunch(activeHref)) return
    const frame = measure()
    const icon = iconOf(activeHref)
    if (device?.motionMedia && frame && icon) void zoomOpen(popup, frame, icon)
  }, [phone, activeHref, popup, measure, device?.motionMedia])

  // Phone layout: home keeps the app as it is, like minimising, and shrinks
  // it back into its icon on the way.
  const goHome = () => {
    if (!active) return
    const frame = measure()
    const icon = iconOf(active.href)
    if (!device?.motionMedia || !popup || !frame || !icon) {
      minimiseWindow(active)
      return
    }
    void zoomHome(popup, frame, icon).then(() => {
      minimiseWindow(active)
      // After the dialog has hidden it, so it never flashes back at full size.
      setTimeout(() => clearZoom(popup), 400)
    })
  }

  useEffect(() => {
    setMeasureRef(popup)
    if (!popup) return
    return registerSurface({ element: popup, backdrop, measure })
  }, [popup, backdrop, measure, setMeasureRef])

  // Not Base UI's modal, which would shut the dock out too: real `inert` on the
  // rest, so Tab moves between the window and the dock and hits nothing behind.
  useEffect(() => {
    if (!open || !popup) return
    const behind = [...document.body.children].filter(
      (element) =>
        !element.contains(popup) &&
        element.id !== 'cc-main' &&
        !element.hasAttribute('data-window-dock') &&
        element.tagName !== 'SCRIPT'
    )
    for (const element of behind) element.setAttribute('inert', '')
    return () => {
      for (const element of behind) element.removeAttribute('inert')
    }
  }, [open, popup])

  // A link inside the window replaced its page: the old link's focus went with it.
  useEffect(() => {
    if (activeHref && openedRef.current) focusWindow(activeHref)
    openedRef.current = activeHref !== null
  }, [activeHref])

  return (
    <Dialog.Root
      open={open}
      modal={false}
      disablePointerDismissal
      onOpenChange={(open, details) => {
        if (!open && details.reason === 'escape-key') closeWindow()
      }}
    >
      <Dialog.Portal keepMounted>
        <Dialog.Backdrop ref={setBackdrop} className={s.backdrop} />
        <Dialog.Popup
          ref={setPopup}
          className={s.window}
          data-theme="dark"
          data-window
          data-fullscreen={fullscreen || undefined}
          data-static={device?.tier === 0 || undefined}
          data-phone={PHONE_LAYOUT || undefined}
          aria-labelledby={titleId}
          initialFocus={() =>
            document.querySelector<HTMLElement>(
              `[data-window-scroller][data-href="${activeHref}"]`
            )
          }
        >
          {PHONE_LAYOUT && (
            <PhoneAppBar
              className="mobile-only"
              title={active?.title ?? ''}
              onAction={() => {
                if (windowDepth() > 1) history.back()
                else goHome()
              }}
              onPrivacy={openPrivacyPreferences}
            />
          )}
          {/* Hidden on phones in the phone layout; `contents` keeps it sticky. */}
          <div className={PHONE_LAYOUT ? 'contents desktop-only' : 'contents'}>
            <TitleBar
              title={active?.title ?? ''}
              titleId={titleId}
              fullscreen={fullscreen}
              onClose={closeWindow}
              onMinimise={() => {
                if (!active) return
                if (!device?.motionMedia || !popup) {
                  minimiseWindow(active)
                  return
                }
                void genieOut(
                  { element: popup, backdrop, measure },
                  active.href,
                  () => minimiseWindow(active)
                )
              }}
              onToggleFullscreen={toggleFullscreen}
              onPrivacy={openPrivacyPreferences}
            />
          </div>
          <div className={s.panes}>
            {entries.map((entry) => (
              <Pane
                key={entry.href}
                entry={entry}
                active={entry.href === activeHref}
              />
            ))}
          </div>
          {PHONE_LAYOUT && (
            <HomeBar className="mobile-only" onAction={goHome} />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
