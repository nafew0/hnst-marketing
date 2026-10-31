'use client'

import cn from 'clsx'
import type { MouseEvent, ReactNode } from 'react'

import { Link } from '@/components/ui/link'

import s from './window.module.css'

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 10 10"
      aria-hidden="true"
      focusable="false"
      className={s.glyph}
    >
      {children}
    </svg>
  )
}

const CLOSE = <path d="M2.5 2.5l5 5m0-5l-5 5" />
const MINIMISE = <path d="M2 5h6" />
const ENTER = <path d="M2 5V2h3M8 5v3H5" />
const EXIT = <path d="M5 2v3H2M5 8V5h3" />

interface TitleBarProps {
  title: string
  titleId?: string
  fullscreen: boolean
  onToggleFullscreen: () => void
  /** A direct visit's red and yellow are links home, so they work without JavaScript. */
  home?: boolean
  onClose?: () => void
  onMinimise: (event: MouseEvent) => void
  /** A modal hides the page's "Privacy choices", and consent must stay reachable. */
  onPrivacy?: () => void
}

/** The window's title bar: red, yellow and green at the left, title centred. */
export function TitleBar({
  title,
  titleId,
  fullscreen,
  onToggleFullscreen,
  home = false,
  onClose,
  onMinimise,
  onPrivacy,
}: TitleBarProps) {
  return (
    <div className={s.bar}>
      <div className={s.controls}>
        {home ? (
          <>
            <Link
              href="/"
              aria-label="Close window"
              className={cn(s.dot, s.close)}
            >
              <Glyph>{CLOSE}</Glyph>
            </Link>
            <Link
              href="/"
              aria-label="Minimise window"
              className={cn(s.dot, s.minimise)}
              onClick={onMinimise}
            >
              <Glyph>{MINIMISE}</Glyph>
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              aria-label="Close window"
              className={cn(s.dot, s.close)}
              onClick={onClose}
            >
              <Glyph>{CLOSE}</Glyph>
            </button>
            <button
              type="button"
              aria-label="Minimise window"
              className={cn(s.dot, s.minimise)}
              onClick={onMinimise}
            >
              <Glyph>{MINIMISE}</Glyph>
            </button>
          </>
        )}
        <button
          type="button"
          aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'}
          className={cn(s.dot, s.zoom)}
          onClick={onToggleFullscreen}
        >
          <Glyph>{fullscreen ? EXIT : ENTER}</Glyph>
        </button>
      </div>
      <div id={titleId} className={s.title}>
        {title}
      </div>
      {onPrivacy && (
        <button
          type="button"
          aria-label="Privacy choices"
          className={s.privacy}
          onClick={onPrivacy}
        >
          Privacy
        </button>
      )}
    </div>
  )
}
