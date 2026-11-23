'use client'

import cn from 'clsx'
import { useEffect, useState } from 'react'

import { NETWORK_LABELS } from '@/components/social/networks'
import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { SOCIAL_NETWORKS } from '@/components/ui/phone/registry'
import { useDeviceDetection } from '@/hooks/use-device-detection'

import type { HomeScreenWidget } from './copy'

import s from './home-screen.module.css'

/** How long each headline stays, and how far apart the widgets turn over. */
const HOLD_MS = 3200
const STAGGER_MS = 800

/**
 * The page's headlines, one at a time (Dylan's "animated GIF", 20 Nov 2026).
 * Still under reduced motion, while hovered or focused, and while the screen
 * isn't showing. The link's name is its label; the headlines are decoration.
 */
function Ticker({
  lines,
  order,
  playing,
}: {
  lines: readonly string[]
  order: number
  playing: boolean
}) {
  const { isReducedMotion } = useDeviceDetection()
  const [index, setIndex] = useState(0)
  const moving = playing && isReducedMotion === false

  useEffect(() => {
    if (!moving || lines.length < 2) return
    let timer = setTimeout(
      function next() {
        setIndex((current) => (current + 1) % lines.length)
        timer = setTimeout(next, HOLD_MS)
      },
      HOLD_MS + order * STAGGER_MS
    )
    return () => clearTimeout(timer)
  }, [moving, lines.length, order])

  if (!lines.length) return null
  return (
    <span className={s.ticker} aria-hidden="true">
      {lines.map((line, at) => (
        <span
          key={line}
          className={s.tick}
          data-active={at === index || undefined}
        >
          {line}
        </span>
      ))}
    </span>
  )
}

/** HONEST's social profile, as a card: one tap opens the social page. */
function ProfileWidget({ widget }: { widget: HomeScreenWidget }) {
  return (
    <Link href={widget.href} className={cn(s.widget, s.profile)}>
      <span className={s.cover} aria-hidden="true">
        <Image
          src="/worlds/astronaut-window.webp"
          alt=""
          fill
          sizes="(min-width: 800px) 72vw, 100vw"
        />
      </span>
      <span className={cn(s.widgetLabel, s.profileLabel)}>{widget.label}</span>
      <span className={s.profileRow} aria-hidden="true">
        <span className={s.avatar}>H</span>
        <span className={s.handle}>{widget.handle}</span>
        <span className={s.networks}>
          {SOCIAL_NETWORKS.map((network) => (
            <Image
              key={network}
              src={`/social/${network}.png`}
              alt={NETWORK_LABELS[network]}
              width={18}
              height={18}
              sizes="18px"
            />
          ))}
        </span>
      </span>
    </Link>
  )
}

/** One of the four widgets: a frosted panel that opens its page. */
export function Widget({
  widget,
  order,
  playing,
}: {
  widget: HomeScreenWidget
  order: number
  playing: boolean
}) {
  const [held, setHeld] = useState(false)
  if (widget.style === 'profile') return <ProfileWidget widget={widget} />
  // Held still while pointed at or focused, so a headline can be read.
  return (
    <Link
      href={widget.href}
      className={s.widget}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <span className={s.widgetLabel}>{widget.label}</span>
      {/* After the label in reading order; pinned to the corner by CSS. */}
      {widget.note && <span className={s.note}>{widget.note}</span>}
      <Ticker lines={widget.lines} order={order} playing={playing && !held} />
    </Link>
  )
}
