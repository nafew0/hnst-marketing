'use client'

import { useWindowSize } from 'hamo'
import { type PointerEvent, useEffect, useRef, useState } from 'react'

import { NotificationCard } from '../notifications/card'
import { type Delivered, notify } from '../notifications/store'
import { useOpenApp } from '../open'
import { phoneApp } from '../registry'
import type { PhoneNotification } from '../settings'
import { unlock } from '../store'
import { useClock } from './clock'
import { Wallpaper } from './wallpaper'

import s from './home.module.css'

/** A swipe that starts this close to the bottom is the phone's own gesture. */
const EDGE = 24
/** How far up a swipe must travel to unlock, in px. */
const SWIPE_UNLOCK = 80

interface LockScreenProps {
  /** The lock-screen cards: settings' `lock-first-visit` notifications. */
  cards: readonly PhoneNotification[]
  /** Known to be up, not just server-rendered and maybe hidden by CSS. */
  up: boolean
}

/** After unlocking, focus goes to the first app, not the page's top. */
function unlockToHome() {
  unlock()
  document
    .querySelector<HTMLElement>('[data-phone-home] nav :is(a, button)')
    ?.focus({ preventScroll: true })
}

/**
 * The lock screen: date, clock and the visit's first notifications, over the
 * wallpaper. Once a session, on `/` only (the layout's script hides it before
 * paint otherwise). Unlock with a tap, a swipe up or the keyboard; a card
 * unlocks and opens its app.
 */
export function LockScreen({ cards, up }: LockScreenProps) {
  const clock = useClock()
  const openApp = useOpenApp()
  const unlockRef = useRef<HTMLButtonElement>(null)
  const start = useRef<number | null>(null)
  const [lift, setLift] = useState(0)
  const { height } = useWindowSize()

  // The cards go to the Notification Centre too, without a banner.
  useEffect(() => {
    if (!up) return
    notify('lock-first-visit', { banner: false })
    unlockRef.current?.focus({ preventScroll: true })
  }, [up])

  const onPointerDown = (event: PointerEvent) => {
    if (height !== undefined && height - event.clientY < EDGE) return
    start.current = event.clientY
  }
  const onPointerMove = (event: PointerEvent) => {
    if (start.current === null) return
    setLift(Math.min(0, event.clientY - start.current))
  }
  const onPointerEnd = () => {
    if (start.current === null) return
    start.current = null
    if (lift < -SWIPE_UNLOCK) unlockToHome()
    setLift(0)
  }

  const items: Delivered[] = cards.map((card, index) => ({
    id: `lock-${index}`,
    trigger: card.trigger,
    app: card.app,
    title: card.title,
    body: card.body,
    at: 0,
  }))

  return (
    <section
      className={s.lock}
      data-phone-lock
      aria-label="Lock screen"
      style={lift ? { transform: `translateY(${lift}px)` } : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <Wallpaper active={false} loop={false} />
      <div className={s.lockClock}>
        <p className={s.lockDate}>{clock?.date ?? ''}</p>
        <p className={s.lockTime}>{clock?.time ?? ''}</p>
      </div>
      {items.length > 0 && (
        <ul className={s.lockCards} aria-label="Notifications">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={s.lockCard}
                onClick={() => {
                  unlock()
                  openApp(phoneApp(item.app))
                }}
              >
                <NotificationCard item={item} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        ref={unlockRef}
        type="button"
        className={s.unlock}
        onClick={unlockToHome}
      >
        <svg viewBox="0 0 20 12" aria-hidden="true" focusable="false">
          <path d="M2 10 10 2l8 8" />
        </svg>
        Swipe up or tap to unlock
      </button>
    </section>
  )
}
