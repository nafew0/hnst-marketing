'use client'

import { Dialog } from '@base-ui/react/dialog'
import cn from 'clsx'
import { useEffect, useId, useRef, useState } from 'react'

import { openPrivacyPreferences } from '@/components/forms/privacy'
import { useDeviceTier } from '@/components/motion/device-tier'
import { worldHost, WorldSky } from '@/components/world'

import { closeWindow, focusWindow, minimiseWindow } from './actions'
import { TitleBar } from './controls'
import { applyDraft } from './drafts'
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

/** Base UI hides everything outside a modal, but consent must stay readable. */
function exposeConsent() {
  document.getElementById('cc-main')?.removeAttribute('aria-hidden')
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
  const open = active !== undefined

  // Base UI's modal only hides the page from screen readers and wraps focus, so
  // the browser could still tab into it. The consent banner stays usable.
  useEffect(() => {
    if (!open || !popup) return
    const behind = [...document.body.children].filter(
      (element) =>
        !element.contains(popup) &&
        element.id !== 'cc-main' &&
        element.tagName !== 'SCRIPT'
    )
    for (const element of behind) element.setAttribute('inert', '')
    const frame = requestAnimationFrame(exposeConsent)
    return () => {
      cancelAnimationFrame(frame)
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
      disablePointerDismissal
      onOpenChange={(open, details) => {
        if (!open && details.reason === 'escape-key') closeWindow()
      }}
    >
      <Dialog.Portal keepMounted>
        <Dialog.Backdrop className={s.backdrop} />
        <Dialog.Popup
          ref={setPopup}
          className={s.window}
          data-theme="dark"
          data-window
          data-fullscreen={fullscreen || undefined}
          data-static={device?.tier === 0 || undefined}
          aria-labelledby={titleId}
          initialFocus={() =>
            document.querySelector<HTMLElement>(
              `[data-window-scroller][data-href="${activeHref}"]`
            )
          }
        >
          <TitleBar
            title={active?.title ?? ''}
            titleId={titleId}
            fullscreen={fullscreen}
            onClose={closeWindow}
            onMinimise={() => {
              if (active) minimiseWindow(active)
            }}
            onToggleFullscreen={toggleFullscreen}
            onPrivacy={() => {
              exposeConsent()
              openPrivacyPreferences()
            }}
          />
          <div className={s.panes}>
            {entries.map((entry) => (
              <Pane
                key={entry.href}
                entry={entry}
                active={entry.href === activeHref}
              />
            ))}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
