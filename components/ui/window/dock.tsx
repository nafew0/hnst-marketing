'use client'

import type { Route } from 'next'
import { usePathname, useRouter } from 'next/navigation'
import { type MouseEvent, type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

import { useDeviceTier } from '@/components/motion/device-tier'
import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { CLIP_FOCUS, type WorldClip, worldFor } from '@/components/world/worlds'
import { bookCall, footerNav } from '@/lib/navigation'

import { focusWindow } from './actions'
import { genieIn, registerTile, registerViewport, useMeasure } from './genie'
import {
  dismissMinimised,
  parkActive,
  setRestored,
  useWindows,
  type WindowEntry,
} from './store'

import s from './dock.module.css'

const GLYPHS = new Map<string, ReactNode>([
  ['/', <path key="home" d="M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5" />],
  [
    '/packages',
    <path key="box" d="m12 3.5 8 4v9l-8 4-8-4v-9zM4 7.5l8 4 8-4M12 11.5v9" />,
  ],
  [
    '/how-it-works',
    <path
      key="route"
      d="M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"
    />,
  ],
  [
    '/proof',
    <path
      key="proof"
      d="M12 3.5 19 6v6c0 4.5-3 7.3-7 8.5-4-1.2-7-4-7-8.5V6zM9 12l2.2 2.2L15.5 10"
    />,
  ],
  [
    '/about',
    <path
      key="about"
      d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5-5 2 2-5z"
    />,
  ],
  [
    '/the-honest-marketer',
    <path
      key="marketer"
      d="M4 10v4l2 .5L18 19V5L6 9.5zM8 15l1 4.5h3l-.8-3.4M18 9.5a2.5 2.5 0 0 1 0 5"
    />,
  ],
  ['/contact', <path key="mail" d="M4 6h16v12H4zM4 7l8 6 8-6" />],
  [
    bookCall.href,
    <path
      key="calendar"
      d="M5 6h14v14H5zM5 10h14M9 3.5V7M15 3.5V7M9 14h2M13 14h2M9 17h2"
    />,
  ],
])

const clipOf = (href: string): WorldClip => worldFor(href.slice(1)).hero

const APPS = [{ href: '/', label: 'Home' }, ...footerNav, bookCall].map(
  ({ href, label }) => ({ href, label })
)

const APP_HREFS = new Set(APPS.map((app) => app.href))

interface TileProps {
  href: string
  label: string
  entry: WindowEntry | undefined
  onSite: boolean
}

function Tile({ href, label, entry, onSite }: TileProps) {
  const router = useRouter()
  const { state: device } = useDeviceTier()
  const active = useWindows((state) => state.activeHref === href)
  const [setMeasureRef, measure] = useMeasure()
  const clip = clipOf(href)

  useEffect(() => registerTile(href, measure), [href, measure])

  const minimised = entry?.minimised === true
  const icon = (
    <span className={s.icon}>
      <Image
        src={`/worlds/${clip}.webp`}
        alt=""
        fill
        sizes="96px"
        className={s.art}
        style={{ objectPosition: CLIP_FOCUS[clip] }}
      />
      {GLYPHS.has(href) && (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
          className={s.glyph}
        >
          {GLYPHS.get(href)}
        </svg>
      )}
    </span>
  )

  const onOpen = (event: MouseEvent) => {
    if (active) {
      event.preventDefault()
      focusWindow(href)
      return
    }
    parkActive()
  }

  return (
    <li
      ref={setMeasureRef}
      className={s.tile}
      data-dock-tile={href}
      data-running={entry || onSite ? '' : undefined}
    >
      {minimised ? (
        <button
          type="button"
          className={s.app}
          aria-label={`Restore ${entry.title || label}`}
          onClick={() => {
            parkActive()
            setRestored(href)
            if (device?.motionMedia) genieIn(href)
            // SAFETY: `href` is the pathname of a page that rendered a window.
            router.push(href as Route, { scroll: false })
          }}
        >
          {icon}
        </button>
      ) : (
        <Link
          href={href}
          className={s.app}
          aria-label={label}
          aria-current={active ? 'page' : undefined}
          onClick={onOpen}
        >
          {icon}
        </Link>
      )}
      <span aria-hidden="true" className={s.label}>
        {entry?.title || label}
      </span>
      <span aria-hidden="true" className={s.running} />
      {minimised && (
        <button
          type="button"
          className={s.dismiss}
          aria-label={`Dismiss ${entry.title || label}`}
          onClick={() => dismissMinimised(href)}
        >
          <svg
            viewBox="0 0 10 10"
            aria-hidden="true"
            focusable="false"
            className={s.dismissGlyph}
          >
            <path d="M2.5 2.5l5 5m0-5l-5 5" />
          </svg>
        </button>
      )}
    </li>
  )
}

/**
 * The site's dock: one app icon per main page, drawn from that page's world, and
 * one more for anything else open, such as a package tier. A portal on `body`, so
 * it stays usable above a window while everything else behind one is inert.
 */
export function WindowDock() {
  const entries = useWindows((state) => state.entries)
  const open = useWindows((state) => state.activeHref !== null)
  const pathname = usePathname()
  const [setViewportRef, measureViewport] = useMeasure()

  useEffect(() => registerViewport(measureViewport), [measureViewport])

  const entryOf = (href: string) => entries.find((entry) => entry.href === href)
  const others = entries.filter((entry) => !APP_HREFS.has(entry.href))

  return createPortal(
    <>
      <div ref={setViewportRef} aria-hidden="true" className={s.viewport} />
      <nav
        aria-label="Dock"
        className={s.dock}
        data-window-dock
        data-theme="dark"
        data-open={open || undefined}
      >
        <ul className={s.bar}>
          {APPS.map(({ href, label }) => (
            <Tile
              key={href}
              href={href}
              label={label}
              entry={entryOf(href)}
              onSite={href !== '/' && pathname === href}
            />
          ))}
          {others.length > 0 && <li aria-hidden="true" className={s.divider} />}
          {others.map((entry) => (
            <Tile
              key={entry.href}
              href={entry.href}
              label={entry.title}
              entry={entry}
              onSite={false}
            />
          ))}
        </ul>
      </nav>
    </>,
    document.body
  )
}
