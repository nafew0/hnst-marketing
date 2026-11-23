'use client'

import { useWindowSize } from 'hamo'
import { type PointerEvent, useRef, useState } from 'react'

import { useClock } from '@/components/ui/phone/home/clock'

import type { HomeScreenCopy } from './copy'

import s from './home-screen.module.css'

/** The visit's "picked an experience" flag. It holds no visitor input. */
export const UNLOCKED_KEY = 'hnst-home-unlocked'
export const UNLOCKED_ATTRIBUTE = 'data-home-unlocked'

/** A swipe that starts this close to the bottom is the phone's own gesture. */
const EDGE = 24
/** How far up counts as trying to swipe past the question, in px. */
const SWIPE = 60

export type Experience = 'audit' | 'browse'

/**
 * The first screen of a visit (Dylan, 20 Nov 2026): the clock and a priority
 * notification that asks whether they came with an audit. It stays locked
 * until they answer: a swipe up, or the hint under it, only says they didn't
 * pick. Once a visit, on `/` only; a prospect's tagged link skips it (the site
 * layout's script hides it before paint).
 */
export function HomeLock({
  copy,
  onPick,
}: {
  copy: HomeScreenCopy['lock']
  onPick: (experience: Experience) => void
}) {
  const clock = useClock()
  const { height } = useWindowSize()
  const start = useRef<number | null>(null)
  const [lift, setLift] = useState(0)
  const [nudged, setNudged] = useState(0)

  const nudge = () => setNudged((count) => count + 1)
  const pick = (experience: Experience) => {
    try {
      sessionStorage.setItem(UNLOCKED_KEY, '1')
    } catch {
      // Storage blocked: the lock comes back on the next visit to `/`.
    }
    document.documentElement.setAttribute(UNLOCKED_ATTRIBUTE, '')
    onPick(experience)
  }

  const onPointerDown = (event: PointerEvent) => {
    if (height !== undefined && height - event.clientY < EDGE) return
    if (event.target instanceof Element && event.target.closest('button'))
      return
    start.current = event.clientY
  }
  const onPointerMove = (event: PointerEvent) => {
    if (start.current === null) return
    setLift(Math.max(-SWIPE * 1.5, Math.min(0, event.clientY - start.current)))
  }
  const onPointerEnd = () => {
    if (start.current === null) return
    start.current = null
    if (lift < -SWIPE) nudge()
    setLift(0)
  }

  return (
    <section
      className={s.lock}
      aria-label="Lock screen"
      data-home-lock
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <div className={s.lockClock}>
        <p className={s.lockDate}>{clock?.date ?? ''}</p>
        <p className={s.lockTime}>{clock?.time ?? ''}</p>
      </div>
      <div
        key={nudged}
        className={s.priority}
        role="group"
        aria-labelledby="home-lock-title"
        data-nudge={nudged > 0 || undefined}
        style={lift ? { transform: `translateY(${lift}px)` } : undefined}
      >
        <p className={s.priorityHead}>
          <span className={s.mark} aria-hidden="true">
            H
          </span>
          {copy.app}
          <span className={s.tag}>{copy.tag}</span>
        </p>
        <h2 id="home-lock-title" className={s.priorityTitle}>
          {copy.title}
        </h2>
        <p className={s.priorityBody}>{copy.body}</p>
        <div className={s.choices}>
          <button
            type="button"
            className={s.choice}
            onClick={() => pick('audit')}
          >
            {copy.audit}
          </button>
          <button
            type="button"
            className={s.choice}
            onClick={() => pick('browse')}
          >
            {copy.browse}
          </button>
        </div>
      </div>
      <p className={s.locked} role="status">
        {nudged > 0 ? copy.locked : ''}
      </p>
      <button type="button" className={s.hint} onClick={nudge}>
        <svg viewBox="0 0 20 12" aria-hidden="true" focusable="false">
          <path d="M2 10 10 2l8 8" />
        </svg>
        {copy.hint}
      </button>
    </section>
  )
}
