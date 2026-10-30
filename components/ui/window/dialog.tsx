'use client'

import { Dialog } from '@base-ui/react/dialog'
import { Activity, useEffect, useId, useLayoutEffect, useRef } from 'react'

import { useDeviceTier } from '@/components/motion/device-tier'

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

function Pane({ entry }: { entry: WindowEntry }) {
  const ref = useRef<HTMLDivElement>(null)
  const { href, title, content, scrollOffset, draft } = entry

  // Runs again on each restore: a hidden Activity loses its scroll position.
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = scrollOffset
  }, [scrollOffset])

  useEffect(() => {
    if (!draft || !content || !ref.current) return
    applyDraft(ref.current, draft)
    clearDraft(href)
  }, [draft, content, href])

  return (
    // Takes focus when a page opens, so the arrow keys scroll it straight away.
    <div
      ref={ref}
      className={s.scroller}
      data-window-scroller
      data-href={href}
      data-lenis-prevent
      tabIndex={-1}
      aria-label={title || 'Loading'}
    >
      {content ?? (
        <p role="status" className={s.loading}>
          Loading
        </p>
      )}
    </div>
  )
}

/** The one visible window. Minimised pages stay mounted, hidden, beside it. */
export function WindowDialog() {
  const entries = useWindows((state) => state.entries)
  const activeHref = useWindows((state) => state.activeHref)
  const fullscreen = useWindows((state) => state.fullscreen)
  const active = entries.find((entry) => entry.href === activeHref)
  const { state: device } = useDeviceTier()
  const titleId = useId()
  const openedRef = useRef(false)

  // A link inside the window replaced its page: the old link's focus went with it.
  useEffect(() => {
    if (activeHref && openedRef.current) focusWindow(activeHref)
    openedRef.current = activeHref !== null
  }, [activeHref])

  return (
    <Dialog.Root
      open={active !== undefined}
      disablePointerDismissal
      onOpenChange={(open, details) => {
        if (!open && details.reason === 'escape-key') closeWindow()
      }}
    >
      <Dialog.Portal keepMounted>
        <Dialog.Backdrop className={s.backdrop} />
        <Dialog.Popup
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
          />
          {entries.map((entry) => (
            <Activity
              key={entry.href}
              mode={entry.href === activeHref ? 'visible' : 'hidden'}
            >
              <Pane entry={entry} />
            </Activity>
          ))}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
