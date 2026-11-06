'use client'

import cn from 'clsx'
import type { MouseEvent } from 'react'

import { Link } from '@/components/ui/link'

import s from './bars.module.css'

/** Either a button, or a link home that works without JavaScript too. */
type Action =
  | { onAction: (event: MouseEvent) => void; href?: never }
  | { href: '/'; onAction?: (event: MouseEvent) => void }

type AppBarProps = Action & {
  title: string
  className?: string
  /** A window covers the page's "Privacy choices"; consent must stay reachable. */
  onPrivacy?: () => void
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 12 20"
      aria-hidden="true"
      focusable="false"
      className={s.chevron}
    >
      <path d="M10 2 2 10l8 8" />
    </svg>
  )
}

/** An app's top bar on the phone: back at the left, its title centred. */
export function PhoneAppBar({
  title,
  className,
  href,
  onAction,
  onPrivacy,
}: AppBarProps) {
  return (
    <div className={cn(s.bar, className)}>
      {href ? (
        <Link
          href={href}
          className={s.back}
          aria-label="Back"
          {...(onAction && { onClick: onAction })}
        >
          <Chevron />
        </Link>
      ) : (
        <button
          type="button"
          className={s.back}
          aria-label="Back"
          onClick={onAction}
        >
          <Chevron />
        </button>
      )}
      <div className={s.title}>{title}</div>
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

type HomeBarProps = Action & { className?: string }

/** The home indicator: back to the home screen, with the app kept as it is. */
export function HomeBar({ className, href, onAction }: HomeBarProps) {
  return (
    <div className={cn(s.home, className)}>
      {href ? (
        <Link
          href={href}
          className={s.indicator}
          aria-label="Home screen"
          {...(onAction && { onClick: onAction })}
        >
          <span className={s.pill} />
        </Link>
      ) : (
        <button
          type="button"
          className={s.indicator}
          aria-label="Home screen"
          onClick={onAction}
        >
          <span className={s.pill} />
        </button>
      )}
    </div>
  )
}
