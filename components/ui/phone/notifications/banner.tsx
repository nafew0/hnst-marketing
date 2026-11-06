'use client'

import { type PointerEvent, useEffect, useRef, useState } from 'react'

import { useOpenApp } from '../open'
import { phoneApp } from '../registry'
import { NotificationCard } from './card'
import { BANNER_MS, dismissBanner, useNotifications } from './store'

import s from './notifications.module.css'

/** How far up a swipe must travel to dismiss, in px. */
const SWIPE_DISMISS = 40

/**
 * The banner: slides down from the top, stays BANNER_MS, then tucks away.
 * Pauses while it has focus, a pointer or a finger on it. Swipe up or × to
 * dismiss; tap to open its app. Never takes focus: the host announces it.
 */
export function NotificationBanner() {
  const banner = useNotifications((state) => state.banner)
  const openApp = useOpenApp()
  const [held, setHeld] = useState(false)
  const start = useRef<number | null>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (!banner || held) return
    const timer = setTimeout(dismissBanner, BANNER_MS)
    return () => clearTimeout(timer)
  }, [banner, held])

  if (!banner) return null

  const onPointerDown = (event: PointerEvent) => {
    start.current = event.clientY
    setHeld(true)
  }
  const onPointerMove = (event: PointerEvent) => {
    if (start.current === null) return
    setOffset(Math.min(0, event.clientY - start.current))
  }
  const onPointerEnd = () => {
    const swiped = offset < -SWIPE_DISMISS
    start.current = null
    setOffset(0)
    setHeld(false)
    if (swiped) dismissBanner()
  }

  return (
    <div
      key={banner.id}
      className={s.banner}
      data-theme="dark"
      style={offset ? { transform: `translateY(${offset}px)` } : undefined}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={onPointerEnd}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <button
        type="button"
        className={s.bannerOpen}
        onClick={() => {
          // A swipe that ended over the banner isn't a tap.
          if (offset < -SWIPE_DISMISS) return
          dismissBanner()
          openApp(phoneApp(banner.app))
        }}
      >
        <NotificationCard item={banner} />
      </button>
      <button
        type="button"
        className={s.bannerDismiss}
        aria-label="Dismiss notification"
        onClick={dismissBanner}
      >
        <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false">
          <path d="M2.5 2.5l5 5m0-5l-5 5" />
        </svg>
      </button>
    </div>
  )
}
